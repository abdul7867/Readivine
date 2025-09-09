import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';

// Mock environment variables
const mockEnv = {
  DEV: false,
  PROD: true,
  VITE_API_BASE_URL: undefined
};

vi.mock('axios');

// Mock import.meta.env
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: mockEnv
    }
  },
  writable: true
});

describe('API Configuration', () => {
  let mockAxios;
  
  beforeEach(() => {
    mockAxios = vi.mocked(axios);
    mockAxios.create = vi.fn().mockReturnValue({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      defaults: {}
    });
    
    // Clear module cache to get fresh imports
    vi.resetModules();
    
    // Reset environment
    mockEnv.DEV = false;
    mockEnv.PROD = true;
    mockEnv.VITE_API_BASE_URL = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Base URL Configuration', () => {
    it('should use environment variable when provided in production', async () => {
      mockEnv.VITE_API_BASE_URL = 'https://my-backend.com/api/v1';
      
      const { default: api } = await import('../../services/api.js');
      
      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://my-backend.com/api/v1'
        })
      );
    });

    it('should throw error in production when VITE_API_BASE_URL is not set', async () => {
      mockEnv.VITE_API_BASE_URL = undefined;
      
      await expect(async () => {
        await import('../../services/api.js');
      }).rejects.toThrow('Production API URL not configured');
    });

    it('should use localhost in development', async () => {
      mockEnv.DEV = true;
      mockEnv.PROD = false;
      
      const { default: api } = await import('../../services/api.js');
      
      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:8080/api/v1'
        })
      );
    });

    it('should prioritize VITE_API_BASE_URL over other variables', async () => {
      mockEnv.VITE_API_BASE_URL = 'https://priority-url.com/api/v1';
      mockEnv.VITE_PROD_API_URL = 'https://secondary-url.com/api/v1';
      
      const { default: api } = await import('../../services/api.js');
      
      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://priority-url.com/api/v1'
        })
      );
    });
  });

  describe('Axios Configuration', () => {
    beforeEach(() => {
      mockEnv.VITE_API_BASE_URL = 'https://test-backend.com/api/v1';
    });

    it('should configure axios with correct options', async () => {
      const { default: api } = await import('../../services/api.js');
      
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://test-backend.com/api/v1',
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000,
        validateStatus: expect.any(Function)
      });
    });

    it('should have correct validateStatus function', async () => {
      const { default: api } = await import('../../services/api.js');
      
      const createCall = mockAxios.create.mock.calls[0][0];
      const validateStatus = createCall.validateStatus;
      
      // Should accept 2xx and 3xx status codes
      expect(validateStatus(200)).toBe(true);
      expect(validateStatus(201)).toBe(true);
      expect(validateStatus(300)).toBe(true);
      expect(validateStatus(399)).toBe(true);
      
      // Should accept 401 for auth handling
      expect(validateStatus(401)).toBe(true);
      
      // Should reject other 4xx and 5xx
      expect(validateStatus(400)).toBe(false);
      expect(validateStatus(403)).toBe(false);
      expect(validateStatus(404)).toBe(false);
      expect(validateStatus(500)).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      mockEnv.VITE_API_BASE_URL = 'https://test-backend.com/api/v1';
      
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });
      
      // Mock navigator
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'test-agent',
          onLine: true,
          connection: { effectiveType: '4g' }
        },
        writable: true
      });
      
      // Mock location
      Object.defineProperty(window, 'location', {
        value: { href: 'https://test-frontend.com' },
        writable: true
      });
    });

    it('should provide debug information', async () => {
      const { getApiDebugInfo } = await import('../../services/api.js');
      
      const debugInfo = getApiDebugInfo();
      
      expect(debugInfo).toMatchObject({
        environment: 'production',
        userAgent: 'test-agent',
        currentURL: 'https://test-frontend.com',
        isOnline: true,
        connectionType: '4g'
      });
    });

    it('should clear debug information', async () => {
      const { clearApiDebugInfo } = await import('../../services/api.js');
      
      const mockRemoveItem = vi.mocked(localStorage.removeItem);
      
      clearApiDebugInfo();
      
      expect(mockRemoveItem).toHaveBeenCalledWith('lastAuthError');
      expect(mockRemoveItem).toHaveBeenCalledWith('lastServerError');
      expect(mockRemoveItem).toHaveBeenCalledWith('lastNetworkError');
      expect(mockRemoveItem).toHaveBeenCalledWith('apiErrorLog');
    });

    it('should test API connectivity', async () => {
      const mockApiInstance = {
        get: vi.fn().mockResolvedValue({ status: 200 })
      };
      
      mockAxios.create.mockReturnValue({
        ...mockApiInstance,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        },
        defaults: { baseURL: 'https://test-backend.com/api/v1' }
      });
      
      const { testApiConnectivity } = await import('../../services/api.js');
      
      const result = await testApiConnectivity();
      
      expect(result).toMatchObject({
        success: true,
        status: 200,
        baseURL: 'https://test-backend.com/api/v1'
      });
      
      expect(mockApiInstance.get).toHaveBeenCalledWith('/health', { timeout: 5000 });
    });

    it('should handle connectivity test failures', async () => {
      const mockApiInstance = {
        get: vi.fn().mockRejectedValue(new Error('Connection failed'))
      };
      
      mockAxios.create.mockReturnValue({
        ...mockApiInstance,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        },
        defaults: { baseURL: 'https://test-backend.com/api/v1' }
      });
      
      const { testApiConnectivity } = await import('../../services/api.js');
      
      const result = await testApiConnectivity();
      
      expect(result).toMatchObject({
        success: false,
        error: {
          message: 'Connection failed'
        }
      });
    });
  });

  describe('Environment Edge Cases', () => {
    it('should handle missing environment variables gracefully', async () => {
      // Simulate completely missing import.meta.env
      Object.defineProperty(globalThis, 'import', {
        value: { meta: { env: {} } },
        writable: true
      });
      
      await expect(async () => {
        await import('../../services/api.js');
      }).rejects.toThrow('Production API URL not configured');
    });

    it('should handle VITE_PROD_API_URL when PROD is true', async () => {
      mockEnv.VITE_API_BASE_URL = undefined;
      mockEnv.VITE_PROD_API_URL = 'https://prod-specific.com/api/v1';
      mockEnv.PROD = true;
      
      const { default: api } = await import('../../services/api.js');
      
      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://prod-specific.com/api/v1'
        })
      );
    });
  });
});