import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp }) => {
  const msg = typeof message === 'object' ? JSON.stringify(message) : String(message);
  return `${timestamp} [${level}]: ${msg}`;
});

export const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), consoleFormat),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    })
  ]
});



export const ApiLogger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
      silent: process.env.API_LOG_CONSOLE !== 'true'
    })
  ]
});