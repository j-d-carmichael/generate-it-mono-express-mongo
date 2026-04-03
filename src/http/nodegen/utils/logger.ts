import clc from 'cli-color';

import path from 'path';
import fs from 'fs-extra';
import { inspect } from 'util';
import config from '../../../config';

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageObj = fs.readJsonSync(packageJsonPath);

// Log levels in order of priority (lower number = higher priority)
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  LOG = 3,
  DEBUG = 4,
  VERBOSE = 5,
}

// Map environment variable values to log levels
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  'error': LogLevel.ERROR,
  'warn': LogLevel.WARN,
  'warning': LogLevel.WARN,
  'info': LogLevel.INFO,
  'log': LogLevel.LOG,
  'debug': LogLevel.DEBUG,
  'verbose': LogLevel.VERBOSE,
};

// Get current log level from config
if (!config.loggerMode) {
  throw new Error('LOGGER_MODE must be set in environment variables. Valid options: error, warn, info, log, debug, verbose');
}

const loggerModeKey = config.loggerMode.toLowerCase();
const currentLogLevel: LogLevel = LOG_LEVEL_MAP[loggerModeKey];

if (currentLogLevel === undefined) {
  throw new Error(
    `Invalid LOGGER_MODE: "${config.loggerMode}". Valid options: error, warn, warning, info, log, debug, verbose`
  );
}

function formatMessageToPrint (item: any) {
  return (typeof item !== 'string' ? inspect(item, { depth: null, colors: true }) : item);
}

function shouldLog(level: LogLevel): boolean {
  return level <= currentLogLevel;
}

function logger (logItems: any[], level: string, logLevel: LogLevel) {
  if (logItems.length === 0) {
    return;
  }

  // Check if this log level should be printed
  if (!shouldLog(logLevel)) {
    return;
  }

  const msg = formatMessageToPrint(logItems.shift());
  const rest = logItems.map((data) => formatMessageToPrint(data)).join(' ');

  // Color coding for different levels
  let coloredLevel = level;
  if (level === 'ERROR') {
    coloredLevel = clc.red(level);
  } else if (level === 'WARN') {
    coloredLevel = clc.yellow(level);
  } else if (level === 'DEBUG') {
    coloredLevel = clc.cyan(level);
  } else if (level === 'VERBOSE') {
    coloredLevel = clc.magenta(level);
  }

  const output = `[${packageObj.name}] ${new Date().toISOString()} ${coloredLevel}: ${msg}${rest ? ' - ' + rest : ''}`;

  if (level === 'ERROR' || level === 'WARN') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

// Override console methods with level-aware logger
console.error = function (...args) {
  logger([...args], 'ERROR', LogLevel.ERROR);
};
console.warn = function (...args) {
  logger([...args], 'WARN', LogLevel.WARN);
};
console.info = function (...args) {
  logger([...args], 'INFO', LogLevel.INFO);
};
console.log = function (...args) {
  logger([...args], 'LOG', LogLevel.LOG);
};
console.debug = function (...args) {
  logger([...args], 'DEBUG', LogLevel.DEBUG);
};

// Add verbose method (not standard console method)
(console as any).verbose = function (...args: any[]) {
  logger([...args], 'VERBOSE', LogLevel.VERBOSE);
};

