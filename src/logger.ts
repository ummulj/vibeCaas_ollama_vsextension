export class Logger {
  private enabled: boolean;
  constructor(enabled: boolean = false) {
    this.enabled = enabled;
  }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
  info(message: string, ...args: unknown[]) {
    if (this.enabled) {
      console.log(`[VibeCaas] ${message}`, ...args);
    }
  }
  warn(message: string, ...args: unknown[]) {
    console.warn(`[VibeCaas] ${message}`, ...args);
  }
  error(message: string, ...args: unknown[]) {
    console.error(`[VibeCaas] ${message}`, ...args);
  }
}

