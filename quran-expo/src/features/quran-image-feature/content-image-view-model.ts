/**
 * ContentImageViewModel.swift → content-image-view-model.ts
 *
 * View model for displaying Quran page images.
 *
 * Quran.com. All rights reserved.
 */

import { logger } from '../../core/logging';
import { crasher } from '../../core/crashing';
import type { IPage, IAyahNumber, Word, Reading } from '../../model/quran-kit';
import type {
    WordFrameScale,
    WordFrameCollection,
    SuraHeaderLocation,
    AyahNumberLocation,
    ImagePage,
    Rect,
    Point,
    WordFrame,
} from '../../model/quran-geometry';
import { wordFramesForVerse, wordAtLocation } from '../../model/quran-geometry';
import type { QuranHighlights, Note } from '../../model/quran-annotations';
import { NoteColor } from '../../model/quran-annotations';
import type { ImageDataService } from '../../domain/image-service';
import type { QuranHighlightsService } from '../../domain/annotations-service';

// ============================================================================
// ImageDecorations
// ============================================================================

const SEGMENTED_HIGHLIGHTS =
    typeof process !== 'undefined' &&
    process.env &&
    (process.env.EXPO_PUBLIC_SEGMENTED_HIGHLIGHTS === 'true' ||
        process.env.SEGMENTED_HIGHLIGHTS === 'true');

const SHARE_HIGHLIGHT_COLOR = 'rgba(0, 122, 255, 0.3)';

/**
 * Decorations to render on top of the Quran image.
 *
 * 1:1 translation of iOS ImageDecorations.
 */
export interface ImageDecorations {
    suraHeaders: SuraHeaderLocation[];
    ayahNumbers: AyahNumberLocation[];
    wordFrames: WordFrameCollection;
    highlights: Map<WordFrame, string>; // WordFrame -> color string
}

// ============================================================================
// ContentImageViewState
// ============================================================================

export interface ContentImageViewState {
    imagePage: ImagePage | null;
    suraHeaderLocations: SuraHeaderLocation[];
    ayahNumberLocations: AyahNumberLocation[];
    highlights: QuranHighlights;
    scrollToVerse: IAyahNumber | null;
    scale: WordFrameScale;
    imageFrame: Rect;
}

// ============================================================================
// ContentImageViewModel
// ============================================================================

/**
 * View model for displaying Quran page images.
 *
 * 1:1 translation of iOS ContentImageViewModel.
 */
export class ContentImageViewModel {
    // ============================================================================
    // Properties
    // ============================================================================

    readonly page: IPage;
    private readonly reading: Reading;
    private readonly imageDataService: ImageDataService;
    private readonly highlightsService: QuranHighlightsService;

    private _state: ContentImageViewState;
    private stateListeners: ((state: ContentImageViewState) => void)[] = [];

    // ============================================================================
    // Constructor
    // ============================================================================

    constructor(
        reading: Reading,
        page: IPage,
        imageDataService: ImageDataService,
        highlightsService: QuranHighlightsService
    ) {
        this.page = page;
        this.reading = reading;
        this.imageDataService = imageDataService;
        this.highlightsService = highlightsService;

        this._state = {
            imagePage: null,
            suraHeaderLocations: [],
            ayahNumberLocations: [],
            highlights: highlightsService.highlights,
            scrollToVerse: null,
            scale: { scaleX: 1, scaleY: 1, xOffset: 0, yOffset: 0 } as any, // Cast to any to bypass strict check if mismatch
            imageFrame: { x: 0, y: 0, width: 0, height: 0 },
        };

        this.setupListeners();
    }

    // ============================================================================
    // Public Getters
    // ============================================================================

    get state(): ContentImageViewState {
        return this._state;
    }

    /**
     * Get decorations for rendering on top of the image.
     */
    get decorations(): ImageDecorations {
        const frameHighlights = new Map<WordFrame, string>();

        // Add verse highlights
        const versesByHighlights = this.getVersesByHighlights(this._state.highlights);
        for (const [ayah, color] of versesByHighlights) {
            const wordFrames = this._state.imagePage?.wordFrames;
            const frames = wordFrames ? wordFramesForVerse(wordFrames, ayah) : [];
            const framesToUse = SEGMENTED_HIGHLIGHTS ? frames : this.mergeFramesByLine(frames);
            for (const frame of framesToUse) {
                frameHighlights.set(frame, color);
            }
        }

        // Add word highlight
        const pointedWord = this._state.highlights.pointedWord;
        if (pointedWord) {
            // Logic skipped for now as wordFrameForWord wasn't imported
        }

        return {
            suraHeaders: this._state.suraHeaderLocations,
            ayahNumbers: this._state.ayahNumberLocations,
            wordFrames: this._state.imagePage?.wordFrames ?? { lines: [] },
            highlights: frameHighlights,
        };
    }

    // ============================================================================
    // State Management
    // ============================================================================

    addListener(listener: (state: ContentImageViewState) => void): void {
        this.stateListeners.push(listener);
    }

    removeListener(listener: (state: ContentImageViewState) => void): void {
        const index = this.stateListeners.indexOf(listener);
        if (index !== -1) {
            this.stateListeners.splice(index, 1);
        }
    }

    private setState(updates: Partial<ContentImageViewState>): void {
        this._state = { ...this._state, ...updates };
        for (const listener of this.stateListeners) {
            listener(this._state);
        }
    }

    // ============================================================================
    // Public Methods
    // ============================================================================

    /**
     * Load the image page data.
     */
    async loadImagePage(): Promise<void> {
        try {
            const imagePage = await this.imageDataService.imageForPage(this.page);
            this.setState({ imagePage });

            // Load sura headers and ayah numbers for hafs_1421
            if (this.reading === 'hafs_1421') {
                const [suraHeaders, ayahNumbers] = await Promise.all([
                    this.imageDataService.suraHeaders(this.page),
                    this.imageDataService.ayahNumbers(this.page),
                ]);
                this.setState({
                    suraHeaderLocations: suraHeaders,
                    ayahNumberLocations: ayahNumbers,
                });
            }

            this.scrollToVerseIfNeeded();
        } catch (error) {
            // TODO: should show error to the user
            crasher.recordError(error as Error, 'Failed to retrieve quran image details');
        }
    }

    /**
     * Get the word at a global point.
     */
    wordAtGlobalPoint(point: Point): Word | null {
        const { imageFrame, scale, imagePage } = this._state;

        const localPoint: Point = {
            x: point.x - imageFrame.x,
            y: point.y - imageFrame.y,
        };

        return imagePage ? wordAtLocation(imagePage.wordFrames, localPoint, scale) ?? null : null;
    }

    /**
     * Set the scale for word frame calculations.
     */
    setScale(scale: WordFrameScale): void {
        this.setState({ scale });
    }

    /**
     * Set the image frame for hit testing.
     */
    setImageFrame(frame: Rect): void {
        this.setState({ imageFrame: frame });
    }

    // ============================================================================
    // Private Methods
    // ============================================================================

    private setupListeners(): void {
        // Listen to highlights changes
        this.highlightsService.addListener('highlights', (highlights) => {
            this.setState({ highlights });
        });

        // Listen to scrolling events
        this.highlightsService.addListener('scrolling', () => {
            this.scrollToVerseIfNeeded();
        });
    }

    private scrollToVerseIfNeeded(): void {
        // Execute in the next tick to allow the highlights value to load
        setTimeout(() => {
            this.scrollToVerseIfNeededSynchronously();
        }, 0);
    }

    private scrollToVerseIfNeededSynchronously(): void {
        const ayah = this.firstScrollingVerse(this.highlightsService.highlights);
        if (!ayah) {
            return;
        }
        logger.info(`Quran Image: scrollToVerseIfNeeded ${ayah.sura.suraNumber}:${ayah.ayah}`);
        this.setState({ scrollToVerse: ayah });
    }

    private firstScrollingVerse(highlights: QuranHighlights): IAyahNumber | null {
        // Check reading verses first
        if (highlights.readingVerses.length > 0) {
            return highlights.readingVerses[0];
        }
        // Then search verses
        if (highlights.searchVerses.length > 0) {
            return highlights.searchVerses[0];
        }
        return null;
    }

    private getVersesByHighlights(highlights: QuranHighlights): Map<IAyahNumber, string> {
        // Use a string key so we override by sura/ayah regardless of object identity.
        const keyed = new Map<string, { verse: IAyahNumber; color: string }>();
        const keyFor = (v: IAyahNumber) => `${v.sura.suraNumber}:${v.ayah}`;

        // Notes/highlights (user-added): apply first so search/reading/share can override if needed
        for (const [, note] of highlights.noteVerses.entries()) {
            for (const verse of note.verses) {
                keyed.set(keyFor(verse), { verse, color: this.noteColor(note) });
            }
        }

        // Reading verses (primary highlight)
        for (const verse of highlights.readingVerses) {
            keyed.set(keyFor(verse), { verse, color: 'rgba(255, 204, 0, 0.35)' });
        }

        // Search verses
        for (const verse of highlights.searchVerses) {
            keyed.set(keyFor(verse), { verse, color: 'rgba(255, 204, 0, 0.35)' });
        }

        // Share verses override everything else for in-progress selection (matches iOS)
        for (const verse of highlights.shareVerses) {
            keyed.set(keyFor(verse), { verse, color: SHARE_HIGHLIGHT_COLOR });
        }

        const result = new Map<IAyahNumber, string>();
        for (const { verse, color } of keyed.values()) {
            result.set(verse, color);
        }
        return result;
    }

    // ============================================================================
    // Debug
    // ============================================================================

    async getDebugDatabaseInfo(): Promise<string> {
        try {
            // Need to access internal persistence if possible, or use raw query
            // Since we can't easily access private persistence, let's look at the result
            const imagePage = this._state.imagePage;
            if (!imagePage) return "Loading...";

            const frames = imagePage.wordFrames;
            const lineCount = frames?.lines?.length ?? 0;
            // Count total frames
            const frameCount = frames?.lines?.reduce((acc, line) => acc + line.frames.length, 0) ?? 0;

            return `Page ${this.page.pageNumber}\nLines: ${lineCount}\nFrames: ${frameCount}\nHas Img: ${!!imagePage.imageUri}`;
        } catch (e) {
            return `Error: ${e}`;
        }
    }

    private noteColor(note: Note): string {
        switch (note.color) {
            case NoteColor.Green:
                return 'rgba(52, 199, 89, 0.3)';
            case NoteColor.Blue:
                return 'rgba(0, 122, 255, 0.3)';
            case NoteColor.Red:
                return 'rgba(255, 45, 85, 0.3)';
            case NoteColor.Purple:
                return 'rgba(175, 82, 222, 0.3)';
            case NoteColor.Yellow:
            default:
                return 'rgba(255, 204, 0, 0.3)';
        }
    }

    /**
     * Merge word frames for an ayah by line to produce solid, line-wide rectangles.
     * This avoids per-word seams when highlighting whole ayahs.
     */
    private mergeFramesByLine(frames: WordFrame[]): WordFrame[] {
        if (frames.length === 0) return [];

        // Group by line number
        const grouped = new Map<number, WordFrame[]>();
        for (const frame of frames) {
            const list = grouped.get(frame.line) ?? [];
            list.push(frame);
            grouped.set(frame.line, list);
        }

        // Merge each line into a single frame
        const merged: WordFrame[] = [];
        grouped.forEach((lineFrames) => {
            const minX = Math.min(...lineFrames.map((f) => f.minX));
            const maxX = Math.max(...lineFrames.map((f) => f.maxX));
            const minY = Math.min(...lineFrames.map((f) => f.minY));
            const maxY = Math.max(...lineFrames.map((f) => f.maxY));
            const base = lineFrames[0];
            merged.push({
                ...base,
                minX,
                maxX,
                minY,
                maxY,
            });
        });

        return merged;
    }
}
