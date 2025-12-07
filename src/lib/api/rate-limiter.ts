class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle();
    }
    
    this.requests.push(now);
  }
  
  reset(): void {
    this.requests = [];
  }
}

// CoinGecko rate limiter: 50 requests per minute
export const coinGeckoLimiter = new RateLimiter(50, 60000);

export async function fetchWithRateLimit(url: string, options?: RequestInit): Promise<Response> {
  await coinGeckoLimiter.throttle();
  return fetch(url, options);
}
