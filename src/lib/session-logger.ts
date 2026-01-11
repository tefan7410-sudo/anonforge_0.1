interface LogEntry {
  level: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

interface UserAction {
  type: string;
  details: string;
  timestamp: number;
}

interface BrowserInfo {
  userAgent: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  timezone: string;
  platform: string;
  cookiesEnabled: boolean;
  online: boolean;
}

interface SessionData {
  console_logs: LogEntry[];
  user_actions: UserAction[];
  browser_info: BrowserInfo;
}

class SessionLogger {
  private logs: LogEntry[] = [];
  private actions: UserAction[] = [];
  private maxLogs = 50;
  private maxActions = 20;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;
    this.interceptConsole();
  }

  private interceptConsole() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: unknown[]) => {
      this.addLog('log', args);
      originalLog.apply(console, args);
    };

    console.warn = (...args: unknown[]) => {
      this.addLog('warn', args);
      originalWarn.apply(console, args);
    };

    console.error = (...args: unknown[]) => {
      this.addLog('error', args);
      originalError.apply(console, args);
    };
  }

  private sanitizeMessage(message: string): string {
    return message
      .replace(/Bearer\s+[A-Za-z0-9\-_\.]+/gi, 'Bearer [REDACTED]')
      .replace(/api[_-]?key["']?\s*[:=]\s*["']?[A-Za-z0-9\-_]+/gi, 'api_key: [REDACTED]')
      .replace(/password["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, 'password: [REDACTED]')
      .replace(/secret["']?\s*[:=]\s*["']?[A-Za-z0-9\-_]+/gi, 'secret: [REDACTED]')
      .replace(/token["']?\s*[:=]\s*["']?[A-Za-z0-9\-_\.]+/gi, 'token: [REDACTED]');
  }

  private addLog(level: LogEntry['level'], args: unknown[]) {
    const message = this.sanitizeMessage(
      args
        .map((arg) => {
          if (typeof arg === 'string') return arg;
          try {
            return JSON.stringify(arg, null, 0)?.substring(0, 500) || String(arg);
          } catch {
            return String(arg);
          }
        })
        .join(' ')
        .substring(0, 1000)
    );

    this.logs.push({
      level,
      message,
      timestamp: Date.now(),
    });

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  addAction(type: string, details: string) {
    this.actions.push({
      type,
      details: details.substring(0, 500),
      timestamp: Date.now(),
    });

    // Keep only last maxActions entries
    if (this.actions.length > this.maxActions) {
      this.actions = this.actions.slice(-this.maxActions);
    }
  }

  getBrowserInfo(): BrowserInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: 'unknown',
        language: 'unknown',
        screenWidth: 0,
        screenHeight: 0,
        windowWidth: 0,
        windowHeight: 0,
        timezone: 'unknown',
        platform: 'unknown',
        cookiesEnabled: false,
        online: false,
      };
    }

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
    };
  }

  getSessionData(): SessionData {
    return {
      console_logs: [...this.logs],
      user_actions: [...this.actions],
      browser_info: this.getBrowserInfo(),
    };
  }

  clearLogs() {
    this.logs = [];
    this.actions = [];
  }
}

export const sessionLogger = new SessionLogger();
