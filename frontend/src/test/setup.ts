// Test setup file for vitest
import { vi } from 'vitest'

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_BACKEND_BASE_URL: 'http://localhost:3001'
  }
}))

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}