import { LOG_DIR } from '@/config';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import winston from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';

// log dir
const logDir: string = join(__dirname, LOG_DIR || '../logs');

// if LOG_DIR does not exist, then create one
if (!existsSync(logDir)) {
  mkdirSync(logDir);
}

// Define log format using winston logger
const logFormat = winston.format.printf(({ level, timestamp, message }) => `${timestamp} ${level} ${message}`);

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports: [
    // debug log setting
    new winstonDailyRotateFile({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/debug', // log file /logs/debug/*.log
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 files max to be kept
      json: false,
      zippedArchive: true,
    }),
    // error log setting
    new winstonDailyRotateFile({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error', // log file /logs/error/*.log
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 files max to be kept
      json: false,
      zippedArchive: true,
      handleExceptions: true,
    }),
  ],
});

//Add a console transport to the logger. This allows logs to be printed to the console in addition to being saved to files.
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize()),
  }),
);

// Custom stream for Morgan integration.
// Morgan generates log messages from incoming HTTP requests
// Custom stream option is an object expects `write` method for processing log messages
const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export { logger, stream };
