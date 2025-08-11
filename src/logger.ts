export interface Logger {
    log(message: string, ...args: any[]): void;
    error(message: string, error?: any): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}

export class ConsoleLogger implements Logger {
    log(message: string, ...args: any[]): void {
        console.log(`[VibeCaas] ${message}`, ...args);
    }

    error(message: string, error?: any): void {
        console.error(`[VibeCaas] ERROR: ${message}`, error);
    }

    warn(message: string, ...args: any[]): void {
        console.warn(`[VibeCaas] WARN: ${message}`, ...args);
    }

    info(message: string, ...args: any[]): void {
        console.info(`[VibeCaas] INFO: ${message}`, ...args);
    }

    debug(message: string, ...args: any[]): void {
        console.debug(`[VibeCaas] DEBUG: ${message}`, ...args);
    }
}

