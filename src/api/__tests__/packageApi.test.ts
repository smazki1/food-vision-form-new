
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { packagesAPI } from '../packagesAPI';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            {
              package_id: 'test-id',
              package_name: 'Test Package',
              description: 'Test Description',
              total_servings: 10,
              price: 249,
              is_active: true,
              max_processing_time_days: 5,
              max_edits_per_serving: 2,
              special_notes: 'Test notes',
              total_images: 50,
              created_at: '2023-01-01',
              updated_at: '2023-01-01'
            }
          ],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              package_id: 'new-test-id',
              package_name: 'New Test Package',
              description: 'New Test Description',
              total_servings: 15,
              price: 349,
              is_active: true,
              max_processing_time_days: 7,
              max_edits_per_serving: 3,
              special_notes: 'New test notes',
              total_images: 75,
              created_at: '2023-01-02',
              updated_at: '2023-01-02'
            },
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('packagesAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all packages', async () => {
    const packages = await packagesAPI.getAllPackages();
    expect(packages).toHaveLength(1);
    expect(packages[0].package_name).toBe('Test Package');
  });

  it('should create a new package', async () => {
    const newPackage = {
      package_name: 'New Test Package',
      description: 'New Test Description',
      total_servings: 15,
      price: 349,
      is_active: true,
      max_processing_time_days: 7,
      max_edits_per_serving: 3,
      special_notes: 'New test notes',
      total_images: 75
    };

    const result = await packagesAPI.createPackage(newPackage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.package.package_name).toBe('New Test Package');
    }
  });
});
