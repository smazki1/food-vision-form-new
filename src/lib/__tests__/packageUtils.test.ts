import { describe, it, expect } from 'vitest';
import { Package } from '@/types/package';

// Utility functions to test
const validatePackageData = (data: Partial<Package>) => {
  const errors: string[] = [];
  
  if (!data.package_name?.trim()) {
    errors.push('Package name is required');
  }
  
  if (data.total_servings !== undefined && data.total_servings < 0) {
    errors.push('Total servings must be 0 or greater');
  }
  
  if (data.price !== undefined && data.price < 0) {
    errors.push('Price must be 0 or greater');
  }
  
  if (data.max_edits_per_serving !== undefined && data.max_edits_per_serving < 1) {
    errors.push('Max edits per serving must be 1 or greater');
  }
  
  if (data.total_images !== undefined && data.total_images !== null && data.total_images < 0) {
    errors.push('Total images must be 0 or greater');
  }
  
  return errors;
};

const sanitizePackageData = (data: any) => {
  return {
    package_name: data.package_name?.trim() || '',
    description: data.description?.trim() || null,
    total_servings: data.total_servings !== undefined ? Number(data.total_servings) : null,
    price: data.price !== undefined ? Number(data.price) : null,
    is_active: Boolean(data.is_active),
    max_processing_time_days: data.max_processing_time_days !== undefined ? Number(data.max_processing_time_days) : null,
    max_edits_per_serving: data.max_edits_per_serving !== undefined ? Number(data.max_edits_per_serving) : null,
    special_notes: data.special_notes?.trim() || null,
    total_images: data.total_images !== undefined ? Number(data.total_images) : null,
  };
};

const formatPackagePrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) {
    return 'N/A';
  }
  return `$${price.toLocaleString()}`;
};

const calculatePackageValue = (pkg: Package): number => {
  if (!pkg.price || !pkg.total_servings) return 0;
  return pkg.price * pkg.total_servings;
};

const isPackageActive = (pkg: Package): boolean => {
  return pkg.is_active === true;
};

const getPackageDisplayName = (pkg: Package): string => {
  return pkg.package_name || 'Unnamed Package';
};

const sortPackagesByName = (packages: Package[]): Package[] => {
  return [...packages].sort((a, b) => 
    (a.package_name || '').localeCompare(b.package_name || '')
  );
};

const sortPackagesByPrice = (packages: Package[]): Package[] => {
  return [...packages].sort((a, b) => (a.price || 0) - (b.price || 0));
};

const filterActivePackages = (packages: Package[]): Package[] => {
  return packages.filter(pkg => pkg.is_active === true);
};

describe('Package Utility Functions', () => {
  const mockPackage: Package = {
    package_id: 'test-id',
    package_name: 'Test Package',
    description: 'Test Description',
    total_servings: 10,
    price: 100,
    is_active: true,
    max_processing_time_days: 5,
    max_edits_per_serving: 2,
    special_notes: 'Test notes',
    total_images: 20,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('validatePackageData', () => {
    it('should return no errors for valid package data', () => {
      const errors = validatePackageData(mockPackage);
      expect(errors).toHaveLength(0);
    });

    it('should return error for missing package name', () => {
      const errors = validatePackageData({ ...mockPackage, package_name: '' });
      expect(errors).toContain('Package name is required');
    });

    it('should return error for negative total servings', () => {
      const errors = validatePackageData({ ...mockPackage, total_servings: -1 });
      expect(errors).toContain('Total servings must be 0 or greater');
    });

    it('should return error for negative price', () => {
      const errors = validatePackageData({ ...mockPackage, price: -1 });
      expect(errors).toContain('Price must be 0 or greater');
    });

    it('should return error for invalid max edits per serving', () => {
      const errors = validatePackageData({ ...mockPackage, max_edits_per_serving: 0 });
      expect(errors).toContain('Max edits per serving must be 1 or greater');
    });

    it('should return error for negative total images', () => {
      const errors = validatePackageData({ ...mockPackage, total_images: -1 });
      expect(errors).toContain('Total images must be 0 or greater');
    });

    it('should allow zero values for valid fields', () => {
      const errors = validatePackageData({
        ...mockPackage,
        total_servings: 0,
        price: 0,
        total_images: 0,
      });
      expect(errors).toHaveLength(0);
    });

    it('should allow null values for optional fields', () => {
      const errors = validatePackageData({
        ...mockPackage,
        description: null,
        total_images: null,
        special_notes: null,
      });
      expect(errors).toHaveLength(0);
    });

    it('should return multiple errors for multiple issues', () => {
      const errors = validatePackageData({
        package_name: '',
        total_servings: -1,
        price: -1,
      });
      expect(errors).toHaveLength(3);
      expect(errors).toContain('Package name is required');
      expect(errors).toContain('Total servings must be 0 or greater');
      expect(errors).toContain('Price must be 0 or greater');
    });
  });

  describe('sanitizePackageData', () => {
    it('should sanitize and convert string numbers to numbers', () => {
      const input = {
        package_name: '  Test Package  ',
        description: '  Test Description  ',
        total_servings: '10',
        price: '100.50',
        is_active: 'true',
        max_processing_time_days: '5',
        max_edits_per_serving: '2',
        special_notes: '  Test notes  ',
        total_images: '20',
      };

      const result = sanitizePackageData(input);

      expect(result).toEqual({
        package_name: 'Test Package',
        description: 'Test Description',
        total_servings: 10,
        price: 100.50,
        is_active: true,
        max_processing_time_days: 5,
        max_edits_per_serving: 2,
        special_notes: 'Test notes',
        total_images: 20,
      });
    });

    it('should handle empty strings by converting to null', () => {
      const input = {
        package_name: 'Test',
        description: '',
        special_notes: '',
      };

      const result = sanitizePackageData(input);

      expect(result.package_name).toBe('Test');
      expect(result.description).toBeNull();
      expect(result.special_notes).toBeNull();
    });

    it('should handle undefined values correctly', () => {
      const input = {
        package_name: 'Test',
        total_servings: undefined,
        price: undefined,
      };

      const result = sanitizePackageData(input);

      expect(result.package_name).toBe('Test');
      expect(result.total_servings).toBeNull();
      expect(result.price).toBeNull();
    });

    it('should convert falsy is_active to false', () => {
      const input = {
        package_name: 'Test',
        is_active: false,
      };

      const result = sanitizePackageData(input);
      expect(result.is_active).toBe(false);
    });

    it('should handle zero values correctly', () => {
      const input = {
        package_name: 'Test',
        total_servings: 0,
        price: 0,
        total_images: 0,
      };

      const result = sanitizePackageData(input);

      expect(result.total_servings).toBe(0);
      expect(result.price).toBe(0);
      expect(result.total_images).toBe(0);
    });
  });

  describe('formatPackagePrice', () => {
    it('should format price with dollar sign and comma separators', () => {
      expect(formatPackagePrice(100)).toBe('$100');
      expect(formatPackagePrice(1000)).toBe('$1,000');
      expect(formatPackagePrice(1234.56)).toBe('$1,234.56'); // preserves decimals
    });

    it('should handle null and undefined prices', () => {
      expect(formatPackagePrice(null)).toBe('N/A');
      expect(formatPackagePrice(undefined)).toBe('N/A');
    });

    it('should handle zero price', () => {
      expect(formatPackagePrice(0)).toBe('$0');
    });
  });

  describe('calculatePackageValue', () => {
    it('should calculate total value correctly', () => {
      const value = calculatePackageValue(mockPackage);
      expect(value).toBe(1000); // 100 * 10
    });

    it('should return 0 for packages with null price', () => {
      const pkg = { ...mockPackage, price: null };
      const value = calculatePackageValue(pkg as Package);
      expect(value).toBe(0);
    });

    it('should return 0 for packages with null servings', () => {
      const pkg = { ...mockPackage, total_servings: null };
      const value = calculatePackageValue(pkg as Package);
      expect(value).toBe(0);
    });

    it('should handle zero values', () => {
      const pkg = { ...mockPackage, price: 0, total_servings: 5 };
      const value = calculatePackageValue(pkg);
      expect(value).toBe(0);
    });
  });

  describe('isPackageActive', () => {
    it('should return true for active packages', () => {
      expect(isPackageActive(mockPackage)).toBe(true);
    });

    it('should return false for inactive packages', () => {
      const pkg = { ...mockPackage, is_active: false };
      expect(isPackageActive(pkg)).toBe(false);
    });

    it('should handle null/undefined is_active', () => {
      const pkg = { ...mockPackage, is_active: null as any };
      expect(isPackageActive(pkg)).toBe(false);
    });
  });

  describe('getPackageDisplayName', () => {
    it('should return package name when available', () => {
      expect(getPackageDisplayName(mockPackage)).toBe('Test Package');
    });

    it('should return default name for packages without name', () => {
      const pkg = { ...mockPackage, package_name: null as any };
      expect(getPackageDisplayName(pkg)).toBe('Unnamed Package');
    });

    it('should handle empty string names', () => {
      const pkg = { ...mockPackage, package_name: '' };
      expect(getPackageDisplayName(pkg)).toBe('Unnamed Package');
    });
  });

  describe('sortPackagesByName', () => {
    const packages: Package[] = [
      { ...mockPackage, package_id: '3', package_name: 'Zebra Package' },
      { ...mockPackage, package_id: '1', package_name: 'Alpha Package' },
      { ...mockPackage, package_id: '2', package_name: 'Beta Package' },
    ];

    it('should sort packages by name alphabetically', () => {
      const sorted = sortPackagesByName(packages);
      expect(sorted.map(p => p.package_name)).toEqual([
        'Alpha Package',
        'Beta Package',
        'Zebra Package'
      ]);
    });

    it('should not mutate original array', () => {
      const original = [...packages];
      sortPackagesByName(packages);
      expect(packages).toEqual(original);
    });

    it('should handle packages with null names', () => {
      const packagesWithNull = [
        { ...mockPackage, package_id: '1', package_name: 'Beta' },
        { ...mockPackage, package_id: '2', package_name: null as any },
        { ...mockPackage, package_id: '3', package_name: 'Alpha' },
      ];

      const sorted = sortPackagesByName(packagesWithNull);
      expect(sorted[0].package_name).toBeNull();
      expect(sorted[1].package_name).toBe('Alpha');
      expect(sorted[2].package_name).toBe('Beta');
    });
  });

  describe('sortPackagesByPrice', () => {
    const packages: Package[] = [
      { ...mockPackage, package_id: '1', price: 300 },
      { ...mockPackage, package_id: '2', price: 100 },
      { ...mockPackage, package_id: '3', price: 200 },
    ];

    it('should sort packages by price in ascending order', () => {
      const sorted = sortPackagesByPrice(packages);
      expect(sorted.map(p => p.price)).toEqual([100, 200, 300]);
    });

    it('should not mutate original array', () => {
      const original = [...packages];
      sortPackagesByPrice(packages);
      expect(packages).toEqual(original);
    });

    it('should handle packages with null prices', () => {
      const packagesWithNull = [
        { ...mockPackage, package_id: '1', price: 200 },
        { ...mockPackage, package_id: '2', price: null },
        { ...mockPackage, package_id: '3', price: 100 },
      ];

      const sorted = sortPackagesByPrice(packagesWithNull);
      expect(sorted.map(p => p.price)).toEqual([null, 100, 200]);
    });
  });

  describe('filterActivePackages', () => {
    const packages: Package[] = [
      { ...mockPackage, package_id: '1', is_active: true },
      { ...mockPackage, package_id: '2', is_active: false },
      { ...mockPackage, package_id: '3', is_active: true },
    ];

    it('should return only active packages', () => {
      const active = filterActivePackages(packages);
      expect(active).toHaveLength(2);
      expect(active.every(p => p.is_active)).toBe(true);
    });

    it('should return empty array when no active packages', () => {
      const inactivePackages = packages.map(p => ({ ...p, is_active: false }));
      const active = filterActivePackages(inactivePackages);
      expect(active).toHaveLength(0);
    });

    it('should handle packages with null is_active', () => {
      const packagesWithNull = [
        { ...mockPackage, package_id: '1', is_active: true },
        { ...mockPackage, package_id: '2', is_active: null as any },
        { ...mockPackage, package_id: '3', is_active: undefined as any },
      ];

      const active = filterActivePackages(packagesWithNull);
      expect(active).toHaveLength(1);
      expect(active[0].package_id).toBe('1');
    });
  });
}); 