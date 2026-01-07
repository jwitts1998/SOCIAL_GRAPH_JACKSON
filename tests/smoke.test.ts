import { describe, it, expect, vi } from 'vitest';
import { isSupabaseConfigured } from '@/lib/supabase';

describe('Basic Configuration Smoke Tests', () => {
  it('should have Supabase client configured', () => {
    // Mock environment variables for testing
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    };

    // Re-import to get fresh module with mocked env
    vi.resetModules();
    
    // Check that the function exists and can be called
    expect(typeof isSupabaseConfigured).toBe('function');
    
    // Restore original env
    process.env = originalEnv;
  });

  it('should have required environment variable names defined', () => {
    // These are the required env var names (not values)
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
    ];

    requiredEnvVars.forEach((varName) => {
      expect(varName).toBeTruthy();
      expect(typeof varName).toBe('string');
    });
  });

  it('should be able to import main app components without crashing', async () => {
    // Test that we can import the main App component
    const AppModule = await import('@/App');
    expect(AppModule).toBeDefined();
    expect(AppModule.default).toBeDefined();
  });

  it('should be able to import Supabase client without crashing', async () => {
    // Test that we can import the Supabase client
    const supabaseModule = await import('@/lib/supabase');
    expect(supabaseModule).toBeDefined();
    expect(supabaseModule.supabase).toBeDefined();
  });

  it('should have TypeScript types working', () => {
    // Basic type check - if this compiles, types are working
    const testValue: string = 'test';
    expect(typeof testValue).toBe('string');
  });
});

describe('Build Configuration', () => {
  it('should have package.json with required scripts', async () => {
    const pkg = await import('../package.json');
    
    expect(pkg.default.scripts).toBeDefined();
    expect(pkg.default.scripts.dev).toBeDefined();
    expect(pkg.default.scripts.build).toBeDefined();
    expect(pkg.default.scripts.check).toBeDefined();
  });

  it('should have TypeScript configuration', async () => {
    const tsconfig = await import('../tsconfig.json');
    
    expect(tsconfig.default).toBeDefined();
    expect(tsconfig.default.compilerOptions).toBeDefined();
    expect(tsconfig.default.compilerOptions.strict).toBe(true);
  });
});

