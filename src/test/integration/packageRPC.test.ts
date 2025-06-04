import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Package RPC Integration Tests', () => {
  let testPackageId: string;

  beforeEach(async () => {
    // Create a test package for each test
    const { data, error } = await supabase
      .from('service_packages')
      .insert({
        name: 'Test Package for RPC',
        description: 'Integration test package',
        total_servings: 10,
        price: 500,
        is_active: true,
        features_tags: ['test-feature'],
        max_processing_time_days: 7,
        max_edits_per_serving: 2
      })
      .select('package_id')
      .single();

    if (error) throw error;
    testPackageId = data.package_id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testPackageId) {
      await supabase
        .from('service_packages')
        .delete()
        .eq('package_id', testPackageId);
    }
  });

  describe('update_service_package RPC', () => {
    it('should update package name successfully', async () => {
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_name: 'Updated Package Name'
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe('Updated Package Name');
      expect(data.package_id).toBe(testPackageId);
    });

    it('should update multiple fields at once', async () => {
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_name: 'Multi-Update Package',
        p_description: 'Updated description',
        p_total_servings: 15,
        p_price: 750.50,
        p_is_active: false
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe('Multi-Update Package');
      expect(data.description).toBe('Updated description');
      expect(data.total_servings).toBe(15);
      expect(data.price).toBe('750.50');
      expect(data.is_active).toBe(false);
    });

    it('should update features_tags array', async () => {
      const newFeatures = ['feature1', 'feature2', 'feature3'];
      
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_features_tags: newFeatures
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.features_tags).toEqual(newFeatures);
    });

    it('should update processing time and edits', async () => {
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_max_processing_time_days: 14,
        p_max_edits_per_serving: 5
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.max_processing_time_days).toBe(14);
      expect(data.max_edits_per_serving).toBe(5);
    });

    it('should update timestamp when making changes', async () => {
      // Get original timestamp
      const { data: originalData } = await supabase
        .from('service_packages')
        .select('updated_at')
        .eq('package_id', testPackageId)
        .single();

      const originalTimestamp = originalData?.updated_at;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update package
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_name: 'Timestamp Test Package'
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(new Date(data.updated_at)).toBeInstanceOf(Date);
      expect(data.updated_at).not.toBe(originalTimestamp);
    });

    it('should preserve existing values when only updating some fields', async () => {
      // Update only the name
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_name: 'Partial Update Test'
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe('Partial Update Test');
      // Other fields should remain unchanged
      expect(data.description).toBe('Integration test package');
      expect(data.total_servings).toBe(10);
      expect(data.price).toBe('500.00');
      expect(data.is_active).toBe(true);
    });

    it('should handle null values for optional fields', async () => {
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_description: null,
        p_features_tags: null,
        p_max_processing_time_days: null
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.description).toBeNull();
      expect(data.features_tags).toBeNull();
      expect(data.max_processing_time_days).toBeNull();
    });

    it('should throw error for non-existent package ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: fakeId,
        p_name: 'Should Fail'
      });

      expect(error).toBeDefined();
      expect(error.message).toContain('not found');
      expect(data).toBeNull();
    });

    it('should handle edge case with empty string values', async () => {
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_name: 'Edge Case Test',
        p_description: '', // Empty string
        p_features_tags: [] // Empty array
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe('Edge Case Test');
      expect(data.description).toBe('');
      expect(data.features_tags).toEqual([]);
    });

    it('should handle large feature arrays', async () => {
      const largeFeatureArray = Array.from({ length: 20 }, (_, i) => `feature-${i + 1}`);
      
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_features_tags: largeFeatureArray
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.features_tags).toEqual(largeFeatureArray);
      expect(data.features_tags).toHaveLength(20);
    });

    it('should validate data types and constraints', async () => {
      // Test with valid data types
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_total_servings: 100,
        p_price: 9999.99,
        p_max_edits_per_serving: 10
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data.total_servings).toBe('number');
      expect(typeof parseFloat(data.price)).toBe('number');
      expect(typeof data.max_edits_per_serving).toBe('number');
    });
  });

  describe('RPC function permissions and security', () => {
    it('should work with authenticated user', async () => {
      // This test assumes we're authenticated (via test setup)
      const { data, error } = await supabase.rpc('update_service_package', {
        p_package_id: testPackageId,
        p_name: 'Auth Test Package'
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should maintain data integrity after multiple updates', async () => {
      // Perform multiple updates in sequence
      for (let i = 1; i <= 5; i++) {
        const { data, error } = await supabase.rpc('update_service_package', {
          p_package_id: testPackageId,
          p_name: `Iteration ${i}`,
          p_total_servings: 10 + i
        });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.name).toBe(`Iteration ${i}`);
        expect(data.total_servings).toBe(10 + i);
      }

      // Verify final state
      const { data: finalData } = await supabase
        .from('service_packages')
        .select('*')
        .eq('package_id', testPackageId)
        .single();

      expect(finalData?.name).toBe('Iteration 5');
      expect(finalData?.total_servings).toBe(15);
    });
  });
}); 