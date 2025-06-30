import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAffiliateAuth } from '../useAffiliate';

describe('useAffiliateAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Happy Path - Valid Sessions', () => {
    it('should return affiliate data when valid session exists', () => {
      const validSession = {
        affiliate_id: 'test-affiliate-id',
        email: 'test@affiliate.com',
        name: 'Test Affiliate'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(validSession));

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current).toEqual({
        affiliate: validSession,
        isAffiliate: true,
        isLoading: false,
        error: null,
        affiliateId: 'test-affiliate-id'
      });
    });

    it('should handle session with minimal required fields', () => {
      const minimalSession = {
        affiliate_id: 'test-id',
        email: 'test@test.com'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(minimalSession));

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toEqual(minimalSession);
      expect(result.current.isAffiliate).toBe(true);
      expect(result.current.affiliateId).toBe('test-id');
    });

    it('should handle session with null name field', () => {
      const sessionWithNullName = {
        affiliate_id: 'test-id',
        email: 'test@test.com',
        name: null
      };
      localStorage.setItem('affiliate_session', JSON.stringify(sessionWithNullName));

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate.name).toBeNull();
      expect(result.current.isAffiliate).toBe(true);
    });

    it('should handle session with additional fields', () => {
      const extendedSession = {
        affiliate_id: 'test-id',
        email: 'test@test.com',
        name: 'Test Name',
        phone: '+1234567890',
        status: 'active',
        commission_rate: 25,
        extraField: 'should be preserved'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(extendedSession));

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toEqual(extendedSession);
      expect(result.current.isAffiliate).toBe(true);
    });
  });

  describe('Edge Cases - No Session', () => {
    it('should return null affiliate when no localStorage session exists', () => {
      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current).toEqual({
        affiliate: null,
        isAffiliate: false,
        isLoading: false,
        error: null,
        affiliateId: undefined
      });
    });

    it('should return null affiliate when localStorage session is empty string', () => {
      localStorage.setItem('affiliate_session', '');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBeNull();
      expect(result.current.isAffiliate).toBe(false);
    });

    it('should return null affiliate when localStorage session is null string', () => {
      localStorage.setItem('affiliate_session', 'null');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBeNull();
      expect(result.current.isAffiliate).toBe(false);
    });

    it('should return null affiliate when localStorage session is undefined string', () => {
      localStorage.setItem('affiliate_session', 'undefined');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBeNull();
      expect(result.current.isAffiliate).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('affiliate_session', 'invalid-json{');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBeNull();
      expect(result.current.isAffiliate).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle localStorage access errors', () => {
      // Mock localStorage.getItem to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBeNull();
      expect(result.current.isAffiliate).toBe(false);

      // Restore localStorage
      localStorage.getItem = originalGetItem;
    });

    it('should handle JSON.parse throwing specific error', () => {
      const originalParse = JSON.parse;
      JSON.parse = vi.fn(() => {
        throw new SyntaxError('Unexpected token');
      });

      localStorage.setItem('affiliate_session', '{"valid": "json"}');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBeNull();
      expect(result.current.isAffiliate).toBe(false);

      // Restore JSON.parse
      JSON.parse = originalParse;
    });

    it('should handle localStorage returning null', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => null);

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBeNull();
      expect(result.current.isAffiliate).toBe(false);

      localStorage.getItem = originalGetItem;
    });

    it('should handle localStorage returning undefined', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => undefined as any);

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBeNull();
      expect(result.current.isAffiliate).toBe(false);

      localStorage.getItem = originalGetItem;
    });
  });

  describe('Data Integrity', () => {
    it('should handle session with empty object', () => {
      localStorage.setItem('affiliate_session', '{}');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toEqual({});
      expect(result.current.isAffiliate).toBe(true); // Empty object is truthy
      expect(result.current.affiliateId).toBeUndefined();
    });

    it('should handle session with array instead of object', () => {
      localStorage.setItem('affiliate_session', '[]');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toEqual([]);
      expect(result.current.isAffiliate).toBe(true); // Empty array is truthy
    });

    it('should handle session with string value', () => {
      localStorage.setItem('affiliate_session', '"string-value"');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBe('string-value');
      expect(result.current.isAffiliate).toBe(true);
      expect(result.current.affiliateId).toBeUndefined();
    });

    it('should handle session with number value', () => {
      localStorage.setItem('affiliate_session', '42');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBe(42);
      expect(result.current.isAffiliate).toBe(true);
    });

    it('should handle session with boolean value', () => {
      localStorage.setItem('affiliate_session', 'true');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBe(true);
      expect(result.current.isAffiliate).toBe(true);
    });

    it('should handle session with false boolean value', () => {
      localStorage.setItem('affiliate_session', 'false');

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toBe(false);
      expect(result.current.isAffiliate).toBe(false); // false is falsy
    });
  });

  describe('Consistency Across Multiple Calls', () => {
    it('should return consistent results when called multiple times', () => {
      const validSession = {
        affiliate_id: 'test-id',
        email: 'test@test.com',
        name: 'Test Name'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(validSession));

      const { result: result1 } = renderHook(() => useAffiliateAuth());
      const { result: result2 } = renderHook(() => useAffiliateAuth());
      const { result: result3 } = renderHook(() => useAffiliateAuth());

      expect(result1.current).toEqual(result2.current);
      expect(result2.current).toEqual(result3.current);
      expect(result1.current.affiliate).toEqual(validSession);
    });

    it('should reflect localStorage changes on new hook instances', () => {
      // Initial state
      const { result: result1 } = renderHook(() => useAffiliateAuth());
      expect(result1.current.affiliate).toBeNull();

      // Add session
      const validSession = {
        affiliate_id: 'test-id',
        email: 'test@test.com'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(validSession));

      // New hook instance should see the change
      const { result: result2 } = renderHook(() => useAffiliateAuth());
      expect(result2.current.affiliate).toEqual(validSession);

      // Clear session
      localStorage.removeItem('affiliate_session');

      // Another new hook instance should see it's gone
      const { result: result3 } = renderHook(() => useAffiliateAuth());
      expect(result3.current.affiliate).toBeNull();
    });
  });

  describe('Type Safety', () => {
    it('should handle special characters in session data', () => {
      const sessionWithSpecialChars = {
        affiliate_id: 'test-id',
        email: 'test@test.com',
        name: 'שגשדג משתמש עם תווים מיוחדים!@#$%^&*()',
        description: 'הערה עם\nירידת שורה\tוטאב'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(sessionWithSpecialChars));

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toEqual(sessionWithSpecialChars);
      expect(result.current.isAffiliate).toBe(true);
    });

    it('should handle Unicode characters correctly', () => {
      const unicodeSession = {
        affiliate_id: 'test-id',
        email: 'test@test.com',
        name: '🚀 Unicode 测试 العربية עברית',
        emoji: '😀🎉✨'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(unicodeSession));

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate).toEqual(unicodeSession);
      expect(result.current.isAffiliate).toBe(true);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const sessionWithLongString = {
        affiliate_id: 'test-id',
        email: 'test@test.com',
        description: longString
      };
      localStorage.setItem('affiliate_session', JSON.stringify(sessionWithLongString));

      const { result } = renderHook(() => useAffiliateAuth());

      expect(result.current.affiliate.description).toBe(longString);
      expect(result.current.isAffiliate).toBe(true);
    });
  });
}); 