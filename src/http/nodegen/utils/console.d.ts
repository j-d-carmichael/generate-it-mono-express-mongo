/**
 * Custom console type declarations for level-aware logging
 * Implementation: src/http/nodegen/utils/logger.ts
 *
 * Log Levels (in priority order):
 * - ERROR: Critical errors only
 * - WARN: Warnings and errors
 * - INFO: Informational messages + above
 * - LOG: Standard logs + above
 * - DEBUG: Debug information + above
 * - VERBOSE: Everything including verbose details
 *
 * Configure via LOGGER_MODE environment variable:
 * Options: 'error', 'warn', 'info', 'log', 'debug', 'verbose'
 */

declare global {
  interface Console {
    /**
     * Logs error messages (always shown unless LOGGER_MODE=error)
     *
     * **CUSTOM IMPLEMENTATION** - See logger.ts in this directory
     *
     * This is a custom override that filters output based on LOGGER_MODE.
     * Each level includes all higher priority levels.
     */
    error(...args: any[]): void;

    /**
     * Logs warning messages (shown if LOGGER_MODE >= warn)
     *
     * **CUSTOM IMPLEMENTATION** - See logger.ts in this directory
     *
     * This is a custom override that filters output based on LOGGER_MODE.
     * Each level includes all higher priority levels.
     */
    warn(...args: any[]): void;

    /**
     * Logs informational messages (shown if LOGGER_MODE >= info)
     *
     * **CUSTOM IMPLEMENTATION** - See logger.ts in this directory
     *
     * This is a custom override that filters output based on LOGGER_MODE.
     * Each level includes all higher priority levels.
     */
    info(...args: any[]): void;

    /**
     * Logs standard messages (shown if LOGGER_MODE >= log)
     *
     * **CUSTOM IMPLEMENTATION** - See logger.ts in this directory
     *
     * This is a custom override that filters output based on LOGGER_MODE.
     * Each level includes all higher priority levels.
     */
    log(...args: any[]): void;

    /**
     * Logs debug messages (shown if LOGGER_MODE >= debug)
     *
     * **CUSTOM IMPLEMENTATION** - See logger.ts in this directory
     *
     * This is a custom override that filters output based on LOGGER_MODE.
     * Each level includes all higher priority levels.
     */
    debug(...args: any[]): void;

    /**
     * Logs verbose messages (shown if LOGGER_MODE >= verbose)
     *
     * **CUSTOM METHOD** - Not part of standard console API
     *
     * See logger.ts in this directory for implementation.
     * This is the most detailed logging level.
     */
    verbose(...args: any[]): void;
  }
}

export {};
