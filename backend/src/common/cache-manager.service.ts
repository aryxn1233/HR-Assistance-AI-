import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheManagerService {
    private cache = new Map<string, { value: any; expiry: number }>();

    /**
     * Set a value in cache with a TTL in seconds
     */
    set(key: string, value: any, ttlSeconds: number = 300): void {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiry });
    }

    /**
     * Get a value from cache if it exists and is not expired
     */
    get<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }

        return cached.value as T;
    }

    /**
     * Invalidate a specific key
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }
}
