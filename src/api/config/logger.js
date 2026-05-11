import winston from 'winston';

const Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.label({ label: '[LOGGER]' }),
    winston.format.timestamp(),
    winston.format.printf(
      (log) =>
        ` ${log.label}  ${log.timestamp}  ${log.level} : ${
          log.stack ? 'Stack Trace: ' + log.stack : JSON.stringify(log.message)
        }`
    )
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize({ all: true })),
      level: 'info',
    }),
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      maxsize: 1000000,
      maxFiles: 20,
      tailable: true,
      zippedArchive: true,
    }),
  ],
});

export default Logger;
