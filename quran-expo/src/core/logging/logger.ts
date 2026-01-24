/**
 * Logger.swift → logger.ts
 *
 * Logging system translated from quran-ios Core/VLogging
 *
 * Quran for iOS is a Quran reading application for iOS.
 * Copyright (C) 2017 Quran.com
 */

// ============================================================================
// Log Levels
// ============================================================================

export enum LogLevel {
  verbose = 0,
  debug = 1,
  info = 2,
  warning = 3,
  error = 4,
}

// ============================================================================
// Log Metadata
// ============================================================================

export type LogMetadata = Record<string, string | number | boolean | null | undefined>;

// ============================================================================
// Log Handler
// ============================================================================

export interface LogHandler {
  log(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    file?: string,
    function_?: string,
    line?: number
  ): void;
}

// ============================================================================
// Console Log Handler
// ============================================================================

export class ConsoleLogHandler implements LogHandler {
  log(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    file?: string,
    function_?: string,
    line?: number
  ): void {
    const levelName = LogLevel[level].toUpperCase();
    const timestamp = new Date().toISOString();
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    const locationStr = file ? ` [${file}:${line}]` : '';
    
    const fullMessage = `[${timestamp}] ${levelName}${locationStr}: ${message}${metadataStr}`;
    
    switch (level) {
      case LogLevel.error:
        console.error(fullMessage);
        break;
      case LogLevel.warning:
        console.warn(fullMessage);
        break;
      case LogLevel.info:
        console.info(fullMessage);
        break;
      case LogLevel.debug:
        console.debug(fullMessage);
        break;
      default:
        console.log(fullMessage);
    }
  }
}

// ============================================================================
// Logger
// ============================================================================

class LoggerImpl {
  private handler: LogHandler = new ConsoleLogHandler();
  private minLevel: LogLevel = LogLevel.debug;

  setHandler(handler: LogHandler): void {
    this.handler = handler;
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata | string
  ): void {
    if (level < this.minLevel) return;
    
    const metadataObj = typeof metadata === 'string' 
      ? { info: metadata } 
      : metadata;
    
    this.handler.log(level, message, metadataObj);
  }

  verbose(message: string, metadata?: LogMetadata | string): void {
    this.log(LogLevel.verbose, message, metadata);
  }

  debug(message: string, metadata?: LogMetadata | string): void {
    this.log(LogLevel.debug, message, metadata);
  }

  info(message: string, metadata?: LogMetadata | string): void {
    this.log(LogLevel.info, message, metadata);
  }

  warning(message: string, metadata?: LogMetadata | string): void {
    this.log(LogLevel.warning, message, metadata);
  }

  notice(message: string, metadata?: LogMetadata | string): void {
    this.log(LogLevel.info, message, metadata);
  }

  error(message: string, error?: unknown, metadata?: LogMetadata | string): void {
    const errorMessage = error instanceof Error 
      ? `${message}: ${error.message}` 
      : message;
    this.log(LogLevel.error, errorMessage, metadata);
  }
}

// ============================================================================
// Global Logger Instance
// ============================================================================

export const logger = new LoggerImpl();

/**
 * Creates a named logger instance (returns the global logger for simplicity).
 */
export function createLogger(name: string): LoggerImpl {
  // In a more complex setup, this could create separate loggers per subsystem
  return logger;
}
