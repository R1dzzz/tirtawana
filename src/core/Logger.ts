export enum LogLevel { DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3 }

export class Logger {
  private static level: LogLevel = LogLevel.DEBUG;
  private static prefix = '[TIRTAWANA]';

  static setLevel(level: LogLevel): void { Logger.level = level; }
  static debug(...args: any[]): void { if (Logger.level <= LogLevel.DEBUG) console.debug(Logger.prefix, ...args); }
  static info(...args: any[]): void { if (Logger.level <= LogLevel.INFO) console.info(Logger.prefix, ...args); }
  static warn(...args: any[]): void { if (Logger.level <= LogLevel.WARN) console.warn(Logger.prefix, ...args); }
  static error(...args: any[]): void { if (Logger.level <= LogLevel.ERROR) console.error(Logger.prefix, ...args); }
}
