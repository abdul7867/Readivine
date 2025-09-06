import winston from 'winston';

const { combine, timestamp, printf, colorize, align } = winston.format;

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const logFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  align(),
  printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
);

const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    // In a real production environment, you would also add transports for files or logging services:
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    // new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    // new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

export default logger;
