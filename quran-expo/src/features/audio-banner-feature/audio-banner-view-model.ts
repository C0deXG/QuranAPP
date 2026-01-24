/**
 * AudioBannerViewModel.swift → audio-banner-view-model.ts
 *
 * View model for the Audio Banner feature.
 *
 * Quran.com. All rights reserved.
 */

import { AppState, type AppStateStatus } from 'react-native';
import { logger } from '../../core/logging';
import { crasher, CrasherKey } from '../../core/crashing';
import { l, lFormat } from '../../core/localization';
import { CancellableTaskSet } from '../../core/utilities';
import type { AnalyticsLibrary } from '../../core/analytics';
import { Runs } from '../../core/queue-player';
import type { AyahNumber, Page, IAyahNumber, IPage } from '../../model/quran-kit';
import type { Reciter } from '../../model/quran-audio';
import {
  ReciterDataRetriever,
  RecentRecitersService,
  ReciterPreferences,
} from '../../domain/reciter-service';
import {
  QuranAudioPlayer,
  QuranAudioDownloader,
  AudioPreferences,
  PreferencesLastAyahFinder,
} from '../../domain/quran-audio-kit';
import type { DownloadBatchResponse } from '../../data/batch-downloader';
import type { AudioBannerState } from '../../ui/features/audio-banner';
import type { ToastAction } from '../../ui/uix';
import {
  RemoteCommandsHandler,
  type RemoteCommandActions,
} from './remote-commands-handler';

// ============================================================================
// Crasher Keys
// ============================================================================

const ReciterIdKey = new CrasherKey<number>('ReciterId');
const DownloadingQuranKey = new CrasherKey<boolean>('DownloadingQuran');
const PlayingAyahKey = new CrasherKey<IAyahNumber>('PlayingAyah');

// ============================================================================
// AudioBannerListener
// ============================================================================

/**
 * Listener for audio banner events.
 *
 * 1:1 translation of iOS AudioBannerListener.
 */
export interface AudioBannerListener {
  visiblePages: IPage[];
  highlightReadingAyah(ayah: IAyahNumber | null): void;
}

// ============================================================================
// PlaybackState
// ============================================================================

type PlaybackState =
  | { type: 'playing' }
  | { type: 'paused' }
  | { type: 'stopped' }
  | { type: 'downloading'; progress: number };

// ============================================================================
// AudioRange
// ============================================================================

interface AudioRange {
  start: IAyahNumber;
  end: IAyahNumber;
}

// ============================================================================
// AdvancedAudioOptions
// ============================================================================

export interface AdvancedAudioOptions {
  reciter: Reciter;
  start: IAyahNumber;
  end: IAyahNumber;
  verseRuns: Runs;
  listRuns: Runs;
}

// ============================================================================
// AudioBannerViewState
// ============================================================================

export interface AudioBannerViewState {
  audioBannerState: AudioBannerState;
  playbackRate: number;
  error: Error | null;
  toast: { message: string; action: ToastAction | null } | null;
}

export const initialAudioBannerViewState: AudioBannerViewState = {
  audioBannerState: { type: 'readyToPlay', reciter: '' },
  playbackRate: 1.0,
  error: null,
  toast: null,
};

// ============================================================================
// AudioBannerViewModel
// ============================================================================

/**
 * View model for the Audio Banner feature.
 *
 * 1:1 translation of iOS AudioBannerViewModel.
 */
export class AudioBannerViewModel {
  // ============================================================================
  // Properties
  // ============================================================================

  listener: AudioBannerListener | null = null;

  private readonly analytics: AnalyticsLibrary;
  private readonly reciterRetriever: ReciterDataRetriever;
  private readonly recentRecitersService: RecentRecitersService;
  private readonly audioPlayer: QuranAudioPlayer;
  private readonly downloader: QuranAudioDownloader;
  private readonly preferences = ReciterPreferences.shared;
  private readonly lastAyahFinder = PreferencesLastAyahFinder.shared;

  private remoteCommandsHandler: RemoteCommandsHandler | null = null;

  private audioRange: AudioRange | null = null;
  private verseRuns: Runs = Runs.One;
  private listRuns: Runs = Runs.One;
  private reciters: Reciter[] = [];
  private cancellableTasks = new CancellableTaskSet();

  private playingState: PlaybackState = { type: 'stopped' };

  /** Current state */
  private _state: AudioBannerViewState = { ...initialAudioBannerViewState };

  /** State change listeners */
  private stateListeners: ((state: AudioBannerViewState) => void)[] = [];

  /** Callbacks for presenting UI */
  onPresentReciterList: (() => void) | null = null;
  onPresentAdvancedOptions: ((options: AdvancedAudioOptions) => void) | null = null;
  onDismissPresented: (() => void) | null = null;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    analytics: AnalyticsLibrary,
    reciterRetriever: ReciterDataRetriever,
    recentRecitersService: RecentRecitersService,
    audioPlayer: QuranAudioPlayer,
    downloader: QuranAudioDownloader
  ) {
    this.analytics = analytics;
    this.reciterRetriever = reciterRetriever;
    this.recentRecitersService = recentRecitersService;
    this.audioPlayer = audioPlayer;
    this.downloader = downloader;

    this.setUpAudioPlayerActions();
    this.setUpRemoteCommandHandler();
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get state(): AudioBannerViewState {
    return this._state;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  addListener(listener: (state: AudioBannerViewState) => void): void {
    this.stateListeners.push(listener);
  }

  removeListener(listener: (state: AudioBannerViewState) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index !== -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  private setState(updates: Partial<AudioBannerViewState>): void {
    this._state = { ...this._state, ...updates };
    for (const listener of this.stateListeners) {
      listener(this._state);
    }
  }

  private updatePlayingState(state: PlaybackState): void {
    this.playingState = state;
    logger.info(`AudioBanner: playingState updated to ${state.type} - reciter: ${this.selectedReciter?.id}`);

    if (state.type === 'stopped') {
      this.onPlayingStateStopped();
    }

    this.updateAudioBannerState();
  }

  private updateAudioBannerState(): void {
    let audioBannerState: AudioBannerState;

    switch (this.playingState.type) {
      case 'playing':
        audioBannerState = { type: 'playing', paused: false };
        break;
      case 'paused':
        audioBannerState = { type: 'playing', paused: true };
        break;
      case 'stopped':
        audioBannerState = {
          type: 'readyToPlay',
          reciter: this.selectedReciter?.localizedName ?? '',
        };
        break;
      case 'downloading':
        audioBannerState = {
          type: 'downloading',
          progress: this.playingState.progress,
        };
        break;
    }

    this.setState({ audioBannerState });
  }

  private get selectedReciter(): Reciter | null {
    const storedSelectedReciterId = this.preferences.lastSelectedReciterId;
    let selectedReciter = this.reciters.find((r) => r.id === storedSelectedReciterId);

    if (!selectedReciter) {
      const firstReciter = this.reciters[0];
      logger.error(`AudioBanner: couldn't find reciter ${storedSelectedReciterId} using ${firstReciter?.id} instead`);
      selectedReciter = firstReciter;
    }

    return selectedReciter ?? null;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  async start(): Promise<void> {
    this.remoteCommandsHandler?.startListeningToPlayCommand();

    // Listen for app foreground
    AppState.addEventListener('change', this.handleAppStateChange);

    this.reciters = await this.reciterRetriever.getReciters();
    logger.info('AudioBanner: reciters loaded');

    const savedRate = AudioPreferences.shared.playbackRate;
    this.setState({ playbackRate: savedRate });

    const runningDownloads = await this.downloader.runningAudioDownloads();
    logger.info(`AudioBanner: loaded runningAudioDownloads count: ${runningDownloads.length}`);

    if (runningDownloads.length === 0) {
      this.updatePlayingState({ type: 'stopped' });
    } else {
      this.cancellableTasks.task(async () => {
        await this.observeDownloads(runningDownloads);
      });
    }
  }

  dispose(): void {
    this.cancellableTasks.cancelAll();
    this.remoteCommandsHandler?.dispose();
  }

  private handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      // Re-apply playingState to update UI
      this.updateAudioBannerState();
    }
  };

  private onPlayingStateStopped(): void {
    if (this.selectedReciter) {
      crasher.setValue(this.selectedReciter.id, ReciterIdKey);
    }
    this.listener?.highlightReadingAyah(null);

    this.remoteCommandsHandler?.stopListening();
    this.remoteCommandsHandler?.startListeningToPlayCommand();
  }

  // ============================================================================
  // Public Methods - Playback Controls
  // ============================================================================

  /**
   * Play from a specific ayah range (called from ayah menu).
   */
  play(from: IAyahNumber, to: IAyahNumber | null, repeatVerses: boolean): void {
    logger.info(`AudioBanner: playing from ${from.sura.suraNumber}:${from.ayah} to ${to?.sura.suraNumber}:${to?.ayah}`);
    this.analytics.logEvent('PlayAudioFrom', 'Menu');
    this.playInternal(
      from,
      to,
      Runs.One,
      repeatVerses ? Runs.Indefinite : Runs.One
    );
  }

  playFromBanner(): void {
    logger.info(`AudioBanner: play button tapped. State: ${this.playingState.type}`);
    this.playStartingCurrentPage();
  }

  pauseFromBanner(): void {
    logger.info(`AudioBanner: pause button tapped. State: ${this.playingState.type}`);
    this.pause();
  }

  resumeFromBanner(): void {
    logger.info(`AudioBanner: resume button tapped. State: ${this.playingState.type}`);
    this.resume();
  }

  stopFromBanner(): void {
    logger.info(`AudioBanner: stop button tapped. State: ${this.playingState.type}`);
    this.stop();
  }

  forwardFromBanner(): void {
    logger.info(`AudioBanner: step forward button tapped. State: ${this.playingState.type}`);
    this.stepForward();
  }

  backwardFromBanner(): void {
    logger.info(`AudioBanner: step backward button tapped. State: ${this.playingState.type}`);
    this.stepBackward();
  }

  async cancelDownload(): Promise<void> {
    logger.info(`AudioBanner: cancel download tapped. State: ${this.playingState.type}`);
    await this.downloader.cancelAllAudioDownloads();
    this.playbackEnded();
  }

  updatePlaybackRate(rate: number): void {
    this.setState({ playbackRate: rate });
    AudioPreferences.shared.playbackRate = rate;
    this.audioPlayer.setRate(rate);
  }

  // ============================================================================
  // UI Presentation
  // ============================================================================

  presentReciterList(): void {
    logger.info(`AudioBanner: reciters button tapped. State: ${this.playingState.type}`);
    this.onPresentReciterList?.();
  }

  showAdvancedAudioOptions(): void {
    logger.info(`AudioBanner: more button tapped. State: ${this.playingState.type}`);

    if (this.playingState.type === 'stopped') {
      this.setAudioRangeForCurrentPage();
    }

    const options = this.advancedAudioOptions;
    if (!options) {
      logger.info("AudioBanner: showAdvancedAudioOptions couldn't construct advanced audio options");
      return;
    }

    this.onPresentAdvancedOptions?.(options);
  }

  // ============================================================================
  // ReciterListListener
  // ============================================================================

  onSelectedReciterChanged(reciter: Reciter): void {
    logger.info(`AudioBanner: onSelectedReciterChanged to ${reciter.id}`);
    this.selectReciter(reciter);
    this.updatePlayingState({ type: 'stopped' });
  }

  // ============================================================================
  // AdvancedAudioOptionsListener
  // ============================================================================

  updateAudioOptions(options: AdvancedAudioOptions): void {
    logger.info(`AudioBanner: playing advanced audio options`);
    this.selectReciter(options.reciter);
    this.playInternal(options.start, options.end, options.verseRuns, options.listRuns);
  }

  dismissAudioOptions(): void {
    logger.info('AudioBanner: dismiss advanced audio options');
    this.onDismissPresented?.();
  }

  // ============================================================================
  // Private Methods - Playback
  // ============================================================================

  private get advancedAudioOptions(): AdvancedAudioOptions | null {
    if (!this.audioRange || !this.selectedReciter) {
      return null;
    }
    return {
      reciter: this.selectedReciter,
      start: this.audioRange.start,
      end: this.audioRange.end,
      verseRuns: this.verseRuns,
      listRuns: this.listRuns,
    };
  }

  private playStartingCurrentPage(): void {
    const currentPage = this.listener?.visiblePages.reduce((min, p) =>
      p.pageNumber < min.pageNumber ? p : min
    );
    if (!currentPage) return;

    logger.info(`AudioBanner: Play starting page ${currentPage.pageNumber}`);
    this.analytics.logEvent('PlayAudioFrom', 'AudioBar');
    this.playInternal(currentPage.firstVerse, null, Runs.One, Runs.One);
  }

  private setAudioRangeForCurrentPage(): void {
    const currentPage = this.listener?.visiblePages.reduce((min, p) =>
      p.pageNumber < min.pageNumber ? p : min
    );
    if (!currentPage) return;

    const from = currentPage.firstVerse;
    const end = this.lastAyahFinder.findLastAyah(from);
    this.audioRange = { start: from, end };
  }

  private playInternal(
    from: IAyahNumber,
    to: IAyahNumber | null,
    verseRuns: Runs,
    listRuns: Runs
  ): void {
    const selectedReciter = this.selectedReciter;
    if (!selectedReciter) return;

    this.audioPlayer.stopAudio();
    const end = to ?? this.lastAyahFinder.findLastAyah(from);
    this.audioRange = { start: from, end };
    this.verseRuns = verseRuns;
    this.listRuns = listRuns;

    this.recentRecitersService.updateRecentRecitersList(selectedReciter);

    this.cancellableTasks.task(async () => {
      try {
        const downloaded = await this.downloader.downloaded(selectedReciter, from, end);
        logger.info(`AudioBanner: reciter downloaded? ${downloaded}`);

        if (!downloaded) {
          this.startDownloading();
          const download = await this.downloader.download(from, end, selectedReciter);
          if (!download) {
            logger.info("AudioBanner: couldn't create a download request");
            return;
          }

          await this.observeDownloads([download]);
          logger.info('AudioBanner: download completed');
        }

        await this.audioPlayer.play(
          selectedReciter,
          from,
          end,
          verseRuns,
          listRuns
        );

        this.audioPlayer.setRate(this._state.playbackRate);
        this.playingStarted();
      } catch (error) {
        this.playbackFailed(error as Error);
      }
    });
  }

  private selectReciter(reciter: Reciter): void {
    this.preferences.lastSelectedReciterId = reciter.id;
  }

  private pause(): void {
    this.updatePlayingState({ type: 'paused' });
    this.audioPlayer.pauseAudio();
  }

  private resume(): void {
    this.updatePlayingState({ type: 'playing' });
    this.audioPlayer.resumeAudio();
  }

  private stop(): void {
    this.audioRange = null;
    this.audioPlayer.stopAudio();
  }

  private stepForward(): void {
    this.audioPlayer.stepForward();
  }

  private stepBackward(): void {
    this.audioPlayer.stepBackward();
  }

  private togglePlayPause(): void {
    switch (this.playingState.type) {
      case 'playing':
        this.pause();
        break;
      case 'paused':
        this.resume();
        break;
      default:
        logger.error(`Invalid playingState ${this.playingState.type} found while trying to pause/resume playback`);
    }
  }

  // ============================================================================
  // Private Methods - Downloading
  // ============================================================================

  private async observeDownloads(downloads: DownloadBatchResponse[]): Promise<void> {
    if (downloads.length === 0) return;

    this.updatePlayingState({ type: 'downloading', progress: 0 });

    await Promise.all(
      downloads.map(
        (download) =>
          new Promise<void>((resolve, reject) => {
            const progressUnsub = download.addProgressListener((progress) => {
              const fraction =
                progress && progress.total > 0 ? progress.completed / progress.total : 0;
              this.updatePlayingState({ type: 'downloading', progress: fraction });
            });

            const completeUnsub = download.addCompleteListener((error) => {
              progressUnsub();
              completeUnsub();
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          })
      )
    );
  }

  private startDownloading(): void {
    logger.info('AudioBanner: will start downloading');
    crasher.setValue(true, DownloadingQuranKey);
    this.updatePlayingState({ type: 'downloading', progress: 0 });

    if (this.audioRange) {
      const message = this.audioMessage('audio.downloading.message', this.audioRange);
      this.setState({ toast: { message, action: null } });
    }
  }

  // ============================================================================
  // Private Methods - Audio Player Callbacks
  // ============================================================================

  private setUpAudioPlayerActions(): void {
    this.audioPlayer.setActions({
      playbackEnded: () => this.playbackEnded(),
      playbackPaused: () => this.playbackPaused(),
      playbackResumed: () => this.playbackResumed(),
      playing: (ayah) => this.playing(ayah),
    });
  }

  private playbackPaused(): void {
    logger.info('AudioBanner: playback paused');
    this.updatePlayingState({ type: 'paused' });
  }

  private playbackResumed(): void {
    logger.info('AudioBanner: playback resumed');
    this.updatePlayingState({ type: 'playing' });
  }

  private playing(ayah: IAyahNumber): void {
    logger.info(`AudioBanner: playing verse ${ayah.sura.suraNumber}:${ayah.ayah}`);
    crasher.setValue(ayah, PlayingAyahKey);
    this.listener?.highlightReadingAyah(ayah);
  }

  private playingStarted(): void {
    logger.info('AudioBanner: playing started');
    this.cancellableTasks.cancelAll();
    crasher.setValue(false, DownloadingQuranKey);
    this.remoteCommandsHandler?.startListening();
    this.updatePlayingState({ type: 'playing' });

    if (this.audioRange) {
      const message = this.audioMessage('audio.playing.message', this.audioRange);
      const action: ToastAction = {
        title: l('audio.playing.action.modify'),
        handler: () => this.showAdvancedAudioOptions(),
      };
      this.setState({ toast: { message, action } });
    }
  }

  private playbackEnded(): void {
    logger.info('AudioBanner: onPlaybackOrDownloadingCompleted');
    crasher.setValue(null, PlayingAyahKey);
    crasher.setValue(false, DownloadingQuranKey);
    this.updatePlayingState({ type: 'stopped' });
  }

  private playbackFailed(error: Error): void {
    logger.info(`AudioBanner: failed to playing audio. ${error}`);
    this.setState({ error });
    this.playbackEnded();
  }

  private audioMessage(format: string, audioRange: AudioRange): string {
    return lFormat(
      format,
      audioRange.start.localizedName,
      audioRange.end.localizedName
    );
  }

  // ============================================================================
  // Private Methods - Remote Commands
  // ============================================================================

  private setUpRemoteCommandHandler(): void {
    const actions: RemoteCommandActions = {
      play: () => this.handlePlayCommand(),
      pause: () => this.handlePauseCommand(),
      togglePlayPause: () => this.handleTogglePlayPauseCommand(),
      nextTrack: () => this.handleNextTrackCommand(),
      previousTrack: () => this.handlePreviousTrackCommand(),
    };
    this.remoteCommandsHandler = new RemoteCommandsHandler(actions);
  }

  private handlePlayCommand(): void {
    logger.info(`AudioBanner: play command fired. State: ${this.playingState.type}`);
    switch (this.playingState.type) {
      case 'stopped':
        this.playStartingCurrentPage();
        break;
      case 'paused':
      case 'playing':
        this.resume();
        break;
      case 'downloading':
        break;
    }
  }

  private handlePauseCommand(): void {
    logger.info(`AudioBanner: pause command fired. State: ${this.playingState.type}`);
    this.pause();
  }

  private handleTogglePlayPauseCommand(): void {
    logger.info(`AudioBanner: toggle play/pause command fired. State: ${this.playingState.type}`);
    this.togglePlayPause();
  }

  private handleNextTrackCommand(): void {
    logger.info(`AudioBanner: step forward command fired. State: ${this.playingState.type}`);
    this.stepForward();
  }

  private handlePreviousTrackCommand(): void {
    logger.info(`AudioBanner: step backward command fired. State: ${this.playingState.type}`);
    this.stepBackward();
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  clearError(): void {
    this.setState({ error: null });
  }

  clearToast(): void {
    this.setState({ toast: null });
  }
}
