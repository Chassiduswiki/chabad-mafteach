/**
 * Integration Hardening Utilities
 * 
 * Provides robust error handling, retries, and circuit breaker patterns
 * for external API integrations (Directus, Sefaria, HebrewBooks)
 */

/**
 * Circuit Breaker State
 */
enum CircuitState {
    CLOSED = 'CLOSED',     // Normal operation
    OPEN = 'OPEN',         // Temporarily rejecting requests
    HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerOptions {
    failureThreshold: number;  // Number of failures before opening
    successThreshold: number;   // Number of successes to close from half-open
    timeout: number;            // How long to wait before trying again (ms)
}

/**
 * Circuit Breaker pattern implementation
 * Prevents cascade failures by temporarily blocking requests to failing services
 */
class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private nextRetry: number = 0;
    private options: CircuitBreakerOptions;

    constructor(options: Partial<CircuitBreakerOptions> = {}) {
        this.options = {
            failureThreshold: options.failureThreshold || 5,
            successThreshold: options.successThreshold || 2,
            timeout: options.timeout || 60000, // 1 minute
        };
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextRetry) {
                throw new Error('Circuit breaker is OPEN');
            }
            // Try half-open
            this.state = CircuitState.HALF_OPEN;
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.successCount = 0;
            }
        }
    }

    private onFailure() {
        this.failureCount++;
        this.successCount = 0;

        if (this.failureCount >= this.options.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextRetry = Date.now() + this.options.timeout;
        }
    }

    getState() {
        return this.state;
    }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s, 8s...
                const delay = baseDelay * Math.pow(2, attempt);
                // Add jitter to prevent thundering herd
                const jitter = Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay + jitter));
            }
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

/**
 * Timeout wrapper
 * Rejects promise if it takes too long
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 10000
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
    ]);
}

/**
 * Safe API call wrapper
 * Combines timeout, retry, and circuit breaker
 */
const directusCircuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
});

export async function safeDirectusCall<T>(
    fn: () => Promise<T>,
    options: {
        retries?: number;
        timeout?: number;
        fallback?: T;
    } = {}
): Promise<T> {
    const { retries = 3, timeout = 10000, fallback } = options;

    try {
        return await directusCircuitBreaker.execute(async () => {
            return await retryWithBackoff(
                () => withTimeout(fn(), timeout),
                retries
            );
        });
    } catch (error) {
        console.error('Directus API error:', error);

        // Return fallback if provided
        if (fallback !== undefined) {
            return fallback;
        }

        throw error;
    }
}

/**
 * Graceful degradation helper
 * Try primary, fallback to secondary, or return default
 */
export async function gracefulFetch<T>(
    primary: () => Promise<T>,
    secondary?: () => Promise<T>,
    defaultValue?: T
): Promise<T> {
    try {
        return await primary();
    } catch (primaryError) {
        console.warn('Primary fetch failed:', primaryError);

        if (secondary) {
            try {
                return await secondary();
            } catch (secondaryError) {
                console.warn('Secondary fetch failed:', secondaryError);
            }
        }

        if (defaultValue !== undefined) {
            return defaultValue;
        }

        throw primaryError;
    }
}

/**
 * Connection pool for Directus (singleton pattern)
 */
class DirectusConnectionPool {
    private static instance: DirectusConnectionPool;
    private activeConnections: number = 0;
    private maxConnections: number = 10;
    private queue: Array<() => void> = [];

    private constructor() { }

    static getInstance(): DirectusConnectionPool {
        if (!DirectusConnectionPool.instance) {
            DirectusConnectionPool.instance = new DirectusConnectionPool();
        }
        return DirectusConnectionPool.instance;
    }

    async acquire<T>(fn: () => Promise<T>): Promise<T> {
        // Wait for available connection
        if (this.activeConnections >= this.maxConnections) {
            await new Promise<void>(resolve => this.queue.push(resolve));
        }

        this.activeConnections++;

        try {
            return await fn();
        } finally {
            this.activeConnections--;

            // Process queue
            const next = this.queue.shift();
            if (next) next();
        }
    }

    getStats() {
        return {
            active: this.activeConnections,
            max: this.maxConnections,
            queued: this.queue.length,
        };
    }
}

export const directusPool = DirectusConnectionPool.getInstance();

/**
 * Error classification
 */
export function classifyError(error: unknown): {
    isRetryable: boolean;
    isClientError: boolean;
    isServerError: boolean;
    message: string;
} {
    const err = error as any;
    const status = err?.response?.status || err?.status;

    return {
        isRetryable: !status || status >= 500 || status === 429, // Server errors or rate limiting
        isClientError: status >= 400 && status < 500,
        isServerError: status >= 500,
        message: err?.message || 'Unknown error',
    };
}
