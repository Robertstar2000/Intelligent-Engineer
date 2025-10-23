import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';

// Global test setup
beforeAll(() => {
  // Setup code that runs once before all tests
});

afterAll(() => {
  // Cleanup code that runs once after all tests
});

afterEach(() => {
  // Cleanup after each test
});
