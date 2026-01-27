/**
 * Winston Logger Configuration
 * Production-ready logging with multiple transports and custom levels
 * 
 * Log Levels:
 * - error: 0 (Highest priority - errors that need immediate attention)
 * - warn: 1 (Warning messages)
 * - info: 2 (General information)
 * - http: 3 (HTTP request logging)
 * - database: 4 (Database operations)
 * - auth: 5 (Authentication/Authorization events)
 * - debug: 6 (Detailed debugging information)
 * 
 * Transports:
 * - Console: All logs in development, errors only in production
 * - Error File: Error level logs only (with rotation)
 * - Combined File: All logs (with rotation)
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define custom log levels (combining standard + application-specific)
const customLevels = {
  levels: {
    error: 0,     // Standard - Critical errors
    warn: 1,      // Standard - Warnings
    info: 2,      // Standard - General info
    http: 3,      // Custom - HTTP requests
    database: 4,  // Custom - Database operations
    auth: 5,      // Custom - Authentication events
    debug: 6,     // Standard - Debug information
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    database: 'magenta',
    auth: 'blue',
    debug: 'gray',
  }
};

// Add colors to Winston
winston.addColors(customLevels.colors);

// Define log format for console (colored and readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Define log format for files (JSON for easy parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory path
const logsDir = path.join(__dirname, '../../logs');

// Transport: Console (different behavior for dev vs prod)
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
});

// Transport: Error logs file (daily rotation)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: fileFormat,
  maxSize: '20m',        // Rotate if file exceeds 20MB
  maxFiles: '30d',       // Keep logs for 30 days
  zippedArchive: true,   // Compress rotated files
});

// Transport: Combined logs file (daily rotation)
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
});

// Transport: HTTP logs file (daily rotation) - for request logging
const httpFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d',       // Keep HTTP logs for 14 days
  zippedArchive: true,
});

// Transport: Database logs file (daily rotation)
const databaseFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'database-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'database',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

// Transport: Auth logs file (daily rotation)
const authFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'auth-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'auth',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '30d',       // Keep auth logs for 30 days (security audit)
  zippedArchive: true,
});

// Create the logger instance
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
    httpFileTransport,
    databaseFileTransport,
    authFileTransport,
  ],
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Handle transport errors
errorFileTransport.on('error', (error) => {
  console.error('Error writing to error log file:', error);
});

combinedFileTransport.on('error', (error) => {
  console.error('Error writing to combined log file:', error);
});

// Log rotation events (optional - for debugging)
if (process.env.NODE_ENV === 'development') {
  errorFileTransport.on('rotate', (oldFilename, newFilename) => {
    logger.info('Error log file rotated', { oldFilename, newFilename });
  });
  
  combinedFileTransport.on('rotate', (oldFilename, newFilename) => {
    logger.info('Combined log file rotated', { oldFilename, newFilename });
  });
}

// Create a stream object for Morgan HTTP logger integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Export logger
export default logger;

/**
 * Usage Examples:
 * 
 * logger.error('Database connection failed', { error: err.message });
 * logger.warn('API rate limit approaching', { user_id: 123, current: 95, limit: 100 });
 * logger.info('User registered successfully', { user_id: 456, email: 'user@example.com' });
 * logger.http('GET /api/users - 200 - 45ms');
 * logger.database('Query executed', { query: 'SELECT * FROM users', duration: '23ms' });
 * logger.auth('Login attempt', { mobile: '9876543210', success: true });
 * logger.debug('Variable value:', { someVar: value });
 */
