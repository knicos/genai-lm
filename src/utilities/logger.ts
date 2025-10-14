import { v4 as uuidv4 } from 'uuid';

class Logger {
    private id: string;
    public token: string | null = null;

    constructor() {
        this.id = uuidv4();
    }

    log(message: string): void {
        this.send('LOG', message);
    }

    error(message: string): void {
        this.send('ERROR', message);
    }

    warn(message: string): void {
        this.send('WARN', message);
    }

    private send(level: string, message: string): void {
        if (!this.token) return;
        // Placeholder for sending logs to an external service
        // e.g., HTTP request to a logging server
        console.log(`[${level} - ${this.id}]: ${message}`);
    }
}

const logger = new Logger();

export function initializeLogger(token: string): void {
    if (!logger.token) {
        logger.token = token;
    }
}

export default logger;
