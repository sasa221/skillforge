import { Logger } from '@nestjs/common';
import { createClient } from 'redis';

type Bucket = { tokens: number; lastRefillMs: number };
type RedisClient = ReturnType<typeof createClient>;

export interface AiRateLimiter {
  tryConsume(key: string, cost?: number): Promise<boolean>;
}

export class SimpleRateLimiter implements AiRateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
  ) {}

  async tryConsume(key: string, cost = 1): Promise<boolean> {
    const now = Date.now();
    const b = this.buckets.get(key) ?? { tokens: this.capacity, lastRefillMs: now };
    const elapsed = Math.max(0, now - b.lastRefillMs) / 1000;
    const refill = elapsed * this.refillPerSecond;
    b.tokens = Math.min(this.capacity, b.tokens + refill);
    b.lastRefillMs = now;

    if (b.tokens < cost) {
      this.buckets.set(key, b);
      return false;
    }
    b.tokens -= cost;
    this.buckets.set(key, b);
    return true;
  }
}

type RedisRateLimiterOptions = {
  url?: string | null;
  capacity: number;
  windowSeconds: number;
  keyPrefix?: string;
  fallback?: AiRateLimiter;
};

export class RedisBackedRateLimiter implements AiRateLimiter {
  private readonly logger = new Logger(RedisBackedRateLimiter.name);
  private readonly fallback: AiRateLimiter;
  private readonly keyPrefix: string;
  private readonly url: string | null;
  private client: RedisClient | null = null;
  private connectPromise: Promise<RedisClient | null> | null = null;

  constructor(
    private readonly options: RedisRateLimiterOptions,
  ) {
    this.url = options.url?.trim() || null;
    this.keyPrefix = options.keyPrefix ?? 'skillforge:ai-rate';
    this.fallback =
      options.fallback ??
      new SimpleRateLimiter(
        options.capacity,
        options.windowSeconds > 0 ? options.capacity / options.windowSeconds : options.capacity,
      );
  }

  async tryConsume(key: string, cost = 1): Promise<boolean> {
    if (cost <= 0) return true;

    const client = await this.getClient();
    if (!client) {
      return this.fallback.tryConsume(key, cost);
    }

    const bucket = Math.floor(Date.now() / (this.options.windowSeconds * 1000));
    const redisKey = `${this.keyPrefix}:${bucket}:${key}`;

    try {
      const count = await client.incrBy(redisKey, cost);
      if (count === cost) {
        await client.expire(redisKey, this.options.windowSeconds + 1);
      }
      return count <= this.options.capacity;
    } catch (error) {
      this.logger.warn(
        `Redis rate limiter failed for key "${key}". Falling back to in-memory limiter.`,
      );
      return this.fallback.tryConsume(key, cost);
    }
  }

  private async getClient(): Promise<RedisClient | null> {
    if (!this.url) return null;
    if (this.client?.isReady) return this.client;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = (async () => {
      try {
        const client = createClient({ url: this.url ?? undefined });
        client.on('error', (error) => {
          this.logger.warn(`Redis client error: ${error instanceof Error ? error.message : String(error)}`);
        });
        await client.connect();
        this.client = client;
        this.logger.log(`Connected AI rate limiter to Redis at ${this.url}`);
        return client;
      } catch (error) {
        this.logger.warn(
          `Could not connect AI rate limiter to Redis. Falling back to in-memory limiter.`,
        );
        this.client = null;
        return null;
      } finally {
        this.connectPromise = null;
      }
    })();

    return this.connectPromise;
  }
}

