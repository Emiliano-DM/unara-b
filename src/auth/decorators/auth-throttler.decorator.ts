import { Throttle } from '@nestjs/throttler';

// Stricter rate limiting for authentication endpoints
export const AuthThrottle = () => Throttle({
  default: {
    ttl: 60000, // 1 minute
    limit: 5, // max 5 requests per minute
  }
});