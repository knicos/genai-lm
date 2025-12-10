import { v4 as uuidv4 } from 'uuid';
import EE from 'eventemitter3';

class Logger {
    private id: string;
    private idNumber: number = 0;
    public token: string | null = null;
    private emitter = new EE<'id'>();

    constructor() {
        this.id = uuidv4();
    }

    setToken(token: string): void {
        this.token = token;
        this.idNumber = Math.floor(Math.random() * 999);
        this.log({ action: 'logger_initialized', userAgent: navigator.userAgent, idNumber: this.idNumber });
        this.emitter.emit('id', this.id, this.idNumber);
    }

    onId(listener: (id: string, idNumber: number) => void): void {
        if (this.token) {
            listener(this.id, this.idNumber);
            return;
        }
        this.emitter.on('id', listener);
    }

    offId(listener: (id: string, idNumber: number) => void): void {
        this.emitter.off('id', listener);
    }

    hasToken(): boolean {
        return this.token !== null;
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
        logger.setToken(token);
    }
}

export default logger;
