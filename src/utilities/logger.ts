import { v4 as uuidv4 } from 'uuid';

class Logger {
    private id: string;
    public token: string | null = null;

    constructor() {
        this.id = uuidv4();
    }

    log(message: unknown): void {
        this.send('LOG', message);
    }

    error(message: unknown): void {
        this.send('ERROR', message);
    }

    warn(message: unknown): void {
        this.send('WARN', message);
    }

    private send(level: string, message: unknown): void {
        if (!this.token) return;

        fetch(import.meta.env.VITE_LOGGING_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: this.token, message: JSON.stringify(message), level, id: this.id }),
        }).catch((err) => {
            console.error('Failed to send log:', err);
        });
    }
}

const logger = new Logger();

export function initializeLogger(token: string): void {
    if (!logger.token) {
        logger.token = token;
        logger.log({ action: 'logger_initialized', userAgent: navigator.userAgent });
    }
}

export default logger;
