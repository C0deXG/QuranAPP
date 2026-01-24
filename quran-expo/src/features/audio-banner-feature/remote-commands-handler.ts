/**
 * RemoteCommandsHandler.swift → remote-commands-handler.ts
 *
 * Handles media remote control commands (lock screen controls, headphone buttons).
 *
 * Quran.com. All rights reserved.
 */

// ============================================================================
// RemoteCommandActions
// ============================================================================

/**
 * Actions for remote command handling.
 */
export interface RemoteCommandActions {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
}

// ============================================================================
// RemoteCommandsHandler
// ============================================================================

/**
 * Handles remote media control commands.
 *
 * Note: In React Native, remote commands are typically handled by the audio
 * library (expo-av) or a dedicated media controls library. This is a placeholder
 * implementation that the audio player can integrate with.
 *
 * 1:1 translation of iOS RemoteCommandsHandler.
 */
export class RemoteCommandsHandler {
  // ============================================================================
  // Properties
  // ============================================================================

  private readonly actions: RemoteCommandActions;
  private isListening: boolean = false;
  private isPlayCommandListening: boolean = false;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(actions: RemoteCommandActions) {
    this.actions = actions;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Start listening to all remote commands.
   */
  startListening(): void {
    this.isListening = true;
    // In a real implementation, this would register handlers with the
    // native media session or expo-av's playback controls.
  }

  /**
   * Stop listening to remote commands.
   */
  stopListening(): void {
    this.isListening = false;
    // In a real implementation, this would unregister handlers.
  }

  /**
   * Start listening only to the play command.
   * Used when audio is stopped but we want to respond to play from lock screen.
   */
  startListeningToPlayCommand(): void {
    this.isPlayCommandListening = true;
    // In a real implementation, this would enable only the play command.
  }

  /**
   * Handle a play command (can be called from external sources).
   */
  handlePlay(): void {
    if (this.isListening || this.isPlayCommandListening) {
      this.actions.play();
    }
  }

  /**
   * Handle a pause command.
   */
  handlePause(): void {
    if (this.isListening) {
      this.actions.pause();
    }
  }

  /**
   * Handle a toggle play/pause command.
   */
  handleTogglePlayPause(): void {
    if (this.isListening) {
      this.actions.togglePlayPause();
    }
  }

  /**
   * Handle a next track command.
   */
  handleNextTrack(): void {
    if (this.isListening) {
      this.actions.nextTrack();
    }
  }

  /**
   * Handle a previous track command.
   */
  handlePreviousTrack(): void {
    if (this.isListening) {
      this.actions.previousTrack();
    }
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.stopListening();
  }
}

