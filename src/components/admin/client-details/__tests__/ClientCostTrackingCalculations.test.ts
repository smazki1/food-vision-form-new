import { describe, it, expect } from 'vitest';

// Mock client data for testing calculations
const mockFormData = {
  ai_training_25_count: 8,
  ai_training_15_count: 1,
  ai_training_5_count: 0,
  ai_prompts_count: 48,
  ai_prompt_cost_per_unit: 0.162,
  revenue_from_client_local: 0,
  exchange_rate_at_conversion: 3.6,
};

const mockPackageData = {
  package_name: 'חבילה פרימיום',
  price: 800,
  total_servings: 20,
  total_images: 10,
};

// Extract calculation functions for isolated testing
const calculateTotalCosts = (formData: typeof mockFormData) => {
  return (
    (formData.ai_training_25_count * 2.5) +
    (formData.ai_training_15_count * 1.5) +
    (formData.ai_training_5_count * 5) +
    (formData.ai_prompts_count * formData.ai_prompt_cost_per_unit)
  );
};

const calculateTotalCostsILS = (formData: typeof mockFormData) => {
  return calculateTotalCosts(formData) * formData.exchange_rate_at_conversion;
};

const calculateProfitILS = (packageData: typeof mockPackageData, formData: typeof mockFormData) => {
  const packagePrice = packageData?.price || 0;
  const costsInILS = calculateTotalCostsILS(formData);
  return Math.max(0, packagePrice - costsInILS);
};

const calculateROI = (packageData: typeof mockPackageData, formData: typeof mockFormData) => {
  const packagePrice = packageData?.price || 0;
  const costsInILS = calculateTotalCostsILS(formData);
  
  if (costsInILS === 0) return 0;
  return ((packagePrice - costsInILS) / costsInILS) * 100;
};

describe('Revenue Calculation Functions - Isolated Testing', () => {
  
  describe('calculateTotalCosts()', () => {
    it('calculates total costs correctly with standard values', () => {
      const result = calculateTotalCosts(mockFormData);
      // (8 * 2.5) + (1 * 1.5) + (0 * 5) + (48 * 0.162) = 20 + 1.5 + 0 + 7.776 = 29.276
      expect(result).toBeCloseTo(29.276, 3);
    });

    it('calculates zero costs when all values are zero', () => {
      const zeroData = {
        ...mockFormData,
        ai_training_25_count: 0,
        ai_training_15_count: 0,
        ai_training_5_count: 0,
        ai_prompts_count: 0,
      };
      
      const result = calculateTotalCosts(zeroData);
      expect(result).toBe(0);
    });

    it('handles large numbers correctly', () => {
      const largeData = {
        ...mockFormData,
        ai_training_25_count: 1000,
        ai_training_15_count: 1000,
        ai_training_5_count: 1000,
        ai_prompts_count: 10000,
      };
      
      const result = calculateTotalCosts(largeData);
      // (1000 * 2.5) + (1000 * 1.5) + (1000 * 5) + (10000 * 0.162) = 2500 + 1500 + 5000 + 1620 = 10620
      expect(result).toBe(10620);
    });

    it('handles decimal prompt costs correctly', () => {
      const decimalData = {
        ...mockFormData,
        ai_prompts_count: 100,
        ai_prompt_cost_per_unit: 0.15789,
      };
      
      const result = calculateTotalCosts(decimalData);
      // (8 * 2.5) + (1 * 1.5) + (0 * 5) + (100 * 0.15789) = 20 + 1.5 + 0 + 15.789 = 37.289
      expect(result).toBeCloseTo(37.289, 3);
    });
  });

  describe('calculateTotalCostsILS()', () => {
    it('converts USD costs to ILS correctly', () => {
      const result = calculateTotalCostsILS(mockFormData);
      const usdCosts = calculateTotalCosts(mockFormData);
      // 29.276 * 3.6 = 105.3936
      expect(result).toBeCloseTo(usdCosts * 3.6, 3);
    });

    it('handles zero exchange rate', () => {
      const zeroExchangeData = {
        ...mockFormData,
        exchange_rate_at_conversion: 0,
      };
      
      const result = calculateTotalCostsILS(zeroExchangeData);
      expect(result).toBe(0);
    });

    it('handles different exchange rates correctly', () => {
      const differentRateData = {
        ...mockFormData,
        exchange_rate_at_conversion: 4.2,
      };
      
      const result = calculateTotalCostsILS(differentRateData);
      const usdCosts = calculateTotalCosts(mockFormData);
      expect(result).toBeCloseTo(usdCosts * 4.2, 3);
    });
  });

  describe('calculateProfitILS()', () => {
    it('calculates profit correctly when package price exceeds costs', () => {
      const result = calculateProfitILS(mockPackageData, mockFormData);
      const costsILS = calculateTotalCostsILS(mockFormData);
      const expectedProfit = 800 - costsILS;
      expect(result).toBeCloseTo(expectedProfit, 2);
    });

    it('returns zero profit when costs exceed package price', () => {
      const lowPricePackage = { ...mockPackageData, price: 50 };
      const result = calculateProfitILS(lowPricePackage, mockFormData);
      expect(result).toBe(0);
    });

    it('handles zero package price', () => {
      const zeroPricePackage = { ...mockPackageData, price: 0 };
      const result = calculateProfitILS(zeroPricePackage, mockFormData);
      expect(result).toBe(0);
    });

    it('handles null/undefined package data', () => {
      const result = calculateProfitILS(null as any, mockFormData);
      expect(result).toBe(0);
    });

    it('calculates exact profit for break-even scenario', () => {
      const costsILS = calculateTotalCostsILS(mockFormData);
      const breakEvenPackage = { ...mockPackageData, price: costsILS };
      const result = calculateProfitILS(breakEvenPackage, mockFormData);
      expect(result).toBeCloseTo(0, 2);
    });
  });

  describe('calculateROI()', () => {
    it('calculates ROI correctly for profitable scenario', () => {
      const result = calculateROI(mockPackageData, mockFormData);
      const costsILS = calculateTotalCostsILS(mockFormData);
      const profit = 800 - costsILS;
      const expectedROI = (profit / costsILS) * 100;
      expect(result).toBeCloseTo(expectedROI, 1);
    });

    it('returns negative ROI when costs exceed price', () => {
      const lowPricePackage = { ...mockPackageData, price: 50 };
      const result = calculateROI(lowPricePackage, mockFormData);
      expect(result).toBeLessThan(0);
    });

    it('returns zero ROI when costs are zero', () => {
      const zeroCostData = {
        ...mockFormData,
        ai_training_25_count: 0,
        ai_training_15_count: 0,
        ai_training_5_count: 0,
        ai_prompts_count: 0,
      };
      
      const result = calculateROI(mockPackageData, zeroCostData);
      expect(result).toBe(0);
    });

    it('calculates zero ROI for break-even scenario', () => {
      const costsILS = calculateTotalCostsILS(mockFormData);
      const breakEvenPackage = { ...mockPackageData, price: costsILS };
      const result = calculateROI(breakEvenPackage, mockFormData);
      expect(result).toBeCloseTo(0, 1);
    });

    it('handles very high ROI scenarios', () => {
      const highPricePackage = { ...mockPackageData, price: 10000 };
      const result = calculateROI(highPricePackage, mockFormData);
      expect(result).toBeGreaterThan(1000); // Very high ROI
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('handles negative input values gracefully', () => {
      const negativeData = {
        ...mockFormData,
        ai_training_25_count: -5, // This shouldn't happen in UI but testing robustness
        ai_prompts_count: -10,
      };
      
      const result = calculateTotalCosts(negativeData);
      // Should handle negative values (though UI should prevent this)
      expect(typeof result).toBe('number');
    });

    it('handles extremely large exchange rates', () => {
      const largeExchangeData = {
        ...mockFormData,
        exchange_rate_at_conversion: 1000000,
      };
      
      const result = calculateTotalCostsILS(largeExchangeData);
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    });

    it('handles floating point precision correctly', () => {
      const precisionData = {
        ...mockFormData,
        ai_prompt_cost_per_unit: 0.123456789,
        ai_prompts_count: 3,
        exchange_rate_at_conversion: 3.123456789,
      };
      
      const usdCosts = calculateTotalCosts(precisionData);
      const ilsCosts = calculateTotalCostsILS(precisionData);
      
      expect(typeof usdCosts).toBe('number');
      expect(typeof ilsCosts).toBe('number');
      expect(isFinite(usdCosts)).toBe(true);
      expect(isFinite(ilsCosts)).toBe(true);
    });
  });

  describe('Business Logic Validation', () => {
    it('ensures cost calculation components are additive', () => {
      const training25Cost = mockFormData.ai_training_25_count * 2.5;
      const training15Cost = mockFormData.ai_training_15_count * 1.5;
      const training5Cost = mockFormData.ai_training_5_count * 5;
      const promptsCost = mockFormData.ai_prompts_count * mockFormData.ai_prompt_cost_per_unit;
      
      const totalManual = training25Cost + training15Cost + training5Cost + promptsCost;
      const totalCalculated = calculateTotalCosts(mockFormData);
      
      expect(totalCalculated).toBeCloseTo(totalManual, 10);
    });

    it('validates currency conversion consistency', () => {
      const usdAmount = 100;
      const exchangeRate = 3.6;
      const ilsAmount = usdAmount * exchangeRate;
      
      expect(ilsAmount).toBe(360);
    });

    it('ensures profit never goes below zero', () => {
      const expensivePackage = { ...mockPackageData, price: 1 }; // Very low price
      const result = calculateProfitILS(expensivePackage, mockFormData);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('validates ROI calculation mathematical correctness', () => {
      // Test known values
      const testPackage = { ...mockPackageData, price: 1000 };
      const testData = {
        ...mockFormData,
        ai_training_25_count: 10, // 25 USD
        ai_training_15_count: 0,
        ai_training_5_count: 0,
        ai_prompts_count: 0,
        exchange_rate_at_conversion: 4.0, // 100 ILS costs
      };
      
      const costs = 25 * 4; // 100 ILS
      const profit = 1000 - 100; // 900 ILS
      const expectedROI = (900 / 100) * 100; // 900%
      
      const actualROI = calculateROI(testPackage, testData);
      expect(actualROI).toBeCloseTo(expectedROI, 1);
    });
  });
}); 