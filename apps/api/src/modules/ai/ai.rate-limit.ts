type Bucket = { tokens: number; lastRefillMs: number };

export class SimpleRateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
  ) {}

  tryConsume(key: string, cost = 1): boolean {
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

