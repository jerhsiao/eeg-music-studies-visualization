class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.enabled = process.env.NODE_ENV !== 'test'; // Auto-disable in tests
    this.logLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'info'; // for production = warn+error only
  }
  
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  setLevel(level) { this.logLevel = level; } 
  
  shouldLog(level) {
    if (!this.enabled) return false;
    
    const levels = { info: 0, warn: 1, error: 2 };
    return levels[level] >= levels[this.logLevel];
  }
  
  log(level, message, context = {}) {
    if (!this.shouldLog(level)) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      id: Date.now() + Math.random()
    };
    
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) this.logs.pop();
    
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${level.toUpperCase()}]`, message, context);
    
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.reportError(logEntry);
    }
  }
  
  warn(message, context) { this.log('warn', message, context); }
  error(message, context) { this.log('error', message, context); }
  info(message, context) { this.log('info', message, context); }
  
  getLogs(level = null) {
    return level ? this.logs.filter(log => log.level === level) : this.logs;
  }
}

export const logger = new Logger();