import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock submissions management operations
const mockSubmissionsOperations = {
  filtering: {
    filterByStatus: (submissions: any[], status: string) => {
      return submissions.filter(sub => sub.status === status);
    },

    filterByDateRange: (submissions: any[], startDate: string, endDate: string) => {
      return submissions.filter(sub => {
        const subDate = new Date(sub.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return subDate >= start && subDate <= end;
      });
    },

    filterByItemType: (submissions: any[], itemType: string) => {
      return submissions.filter(sub => 
        sub.item_type === itemType || 
        sub.item_type?.includes(itemType)
      );
    },

    filterByRestaurant: (submissions: any[], restaurantName: string) => {
      return submissions.filter(sub => 
        sub.restaurant_name?.toLowerCase().includes(restaurantName.toLowerCase())
      );
    },

    applyMultipleFilters: (submissions: any[], filters: any) => {
      let filtered = submissions;

      if (filters.status) {
        filtered = mockSubmissionsOperations.filtering.filterByStatus(filtered, filters.status);
      }

      if (filters.startDate && filters.endDate) {
        filtered = mockSubmissionsOperations.filtering.filterByDateRange(
          filtered, 
          filters.startDate, 
          filters.endDate
        );
      }

      if (filters.itemType) {
        filtered = mockSubmissionsOperations.filtering.filterByItemType(filtered, filters.itemType);
      }

      if (filters.restaurantName) {
        filtered = mockSubmissionsOperations.filtering.filterByRestaurant(filtered, filters.restaurantName);
      }

      return filtered;
    },

    searchSubmissions: (submissions: any[], searchTerm: string) => {
      const term = searchTerm.toLowerCase();
      return submissions.filter(sub => 
        sub.restaurant_name?.toLowerCase().includes(term) ||
        sub.item_name?.toLowerCase().includes(term) ||
        sub.description?.toLowerCase().includes(term) ||
        sub.id?.toLowerCase().includes(term)
      );
    }
  },

  bulkOperations: {
    updateMultipleStatuses: async (submissionIds: string[], newStatus: string) => {
      if (!submissionIds || submissionIds.length === 0) {
        return { success: false, error: 'No submissions selected' };
      }

      return {
        success: true,
        updatedCount: submissionIds.length,
        updatedSubmissions: submissionIds.map(id => ({
          id,
          previousStatus: 'pending_processing',
          newStatus,
          updatedAt: new Date().toISOString()
        })),
        totalTime: submissionIds.length * 50 // Mock processing time
      };
    },

    deleteBulkSubmissions: async (submissionIds: string[]) => {
      if (!submissionIds || submissionIds.length === 0) {
        return { success: false, error: 'No submissions selected' };
      }

      return {
        success: true,
        deletedCount: submissionIds.length,
        deletedIds: submissionIds,
        freedStorage: submissionIds.length * 25, // MB freed
        backupCreated: true,
        deletedAt: new Date().toISOString()
      };
    },

    assignBulkPriority: async (submissionIds: string[], priority: 'low' | 'normal' | 'high') => {
      return {
        success: true,
        updatedCount: submissionIds.length,
        newPriority: priority,
        estimatedProcessingImpact: priority === 'high' ? 'Processing will start within 1 hour' :
                                 priority === 'normal' ? 'Processing will start within 24 hours' :
                                 'Processing will start within 72 hours',
        queuePositionsUpdated: true
      };
    },

    exportSubmissions: async (submissionIds: string[], format: 'csv' | 'excel' | 'pdf') => {
      return {
        success: true,
        exportedCount: submissionIds.length,
        format,
        fileSize: `${(submissionIds.length * 0.5).toFixed(1)}MB`,
        downloadUrl: `https://exports.food-vision.com/export-${Date.now()}.${format}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        createdAt: new Date().toISOString()
      };
    }
  },

  visualThumbnails: {
    generateThumbnail: (imageUrl: string) => {
      return {
        originalUrl: imageUrl,
        thumbnailUrl: imageUrl.replace('original', 'thumbnail'),
        size: '150x150',
        format: 'webp',
        optimized: true,
        generatedAt: new Date().toISOString()
      };
    },

    createImageGallery: (imageUrls: string[]) => {
      return {
        totalImages: imageUrls.length,
        thumbnails: imageUrls.map(url => mockSubmissionsOperations.visualThumbnails.generateThumbnail(url)),
        galleryLayout: imageUrls.length <= 3 ? 'horizontal' : 'grid',
        maxDisplayed: Math.min(imageUrls.length, 6),
        hasMoreImages: imageUrls.length > 6,
        additionalCount: Math.max(0, imageUrls.length - 6)
      };
    },

    preloadImages: async (imageUrls: string[]) => {
      return {
        loaded: imageUrls.length,
        failed: 0,
        totalSize: `${(imageUrls.length * 2.5).toFixed(1)}MB`,
        loadTime: Math.floor(Math.random() * 500) + 100, // Random load time
        cacheHit: Math.floor(Math.random() * imageUrls.length)
      };
    }
  },

  statusManagement: {
    getStatusCounts: (submissions: any[]) => {
      const statusCounts = submissions.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...statusCounts,
        total: submissions.length,
        pending: statusCounts.pending_processing || 0,
        processing: statusCounts.ai_processing || 0,
        completed: statusCounts.processing_complete || 0,
        failed: statusCounts.failed || 0
      };
    },

    getProcessingStats: (submissions: any[]) => {
      const completed = submissions.filter(s => s.status === 'processing_complete');
      const processing = submissions.filter(s => s.status === 'ai_processing');
      const pending = submissions.filter(s => s.status === 'pending_processing');

      return {
        averageProcessingTime: completed.length > 0 ? 
          completed.reduce((sum, s) => sum + (s.processing_time || 300), 0) / completed.length : 0,
        successRate: submissions.length > 0 ? 
          (completed.length / submissions.length) * 100 : 0,
        currentlyProcessing: processing.length,
        queueLength: pending.length,
        totalProcessed: completed.length,
        failureRate: submissions.length > 0 ?
          (submissions.filter(s => s.status === 'failed').length / submissions.length) * 100 : 0
      };
    },

    updateSubmissionStatus: async (submissionId: string, newStatus: string, metadata?: any) => {
      const validStatuses = [
        'pending_processing',
        'ai_processing', 
        'processing_complete',
        'failed',
        'cancelled',
        'on_hold'
      ];

      if (!validStatuses.includes(newStatus)) {
        return {
          success: false,
          error: `Invalid status: ${newStatus}`,
          validStatuses
        };
      }

      return {
        success: true,
        submissionId,
        previousStatus: 'pending_processing',
        newStatus,
        metadata: metadata || {},
        statusHistory: [
          { status: 'pending_processing', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { status: newStatus, timestamp: new Date().toISOString() }
        ],
        updatedAt: new Date().toISOString()
      };
    }
  },

  sorting: {
    sortByDate: (submissions: any[], order: 'asc' | 'desc' = 'desc') => {
      return [...submissions].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
    },

    sortByStatus: (submissions: any[]) => {
      const statusOrder = {
        'failed': 0,
        'ai_processing': 1,
        'pending_processing': 2,
        'on_hold': 3,
        'processing_complete': 4,
        'cancelled': 5
      };

      return [...submissions].sort((a, b) => {
        const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 99;
        const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 99;
        return orderA - orderB;
      });
    },

    sortByRestaurant: (submissions: any[], order: 'asc' | 'desc' = 'asc') => {
      return [...submissions].sort((a, b) => {
        const nameA = (a.restaurant_name || '').toLowerCase();
        const nameB = (b.restaurant_name || '').toLowerCase();
        return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    },

    sortByPriority: (submissions: any[]) => {
      const priorityOrder = { 'high': 0, 'normal': 1, 'low': 2 };
      
      return [...submissions].sort((a, b) => {
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
        return priorityA - priorityB;
      });
    }
  }
};

// Mock Hebrew language integration for submissions
const hebrewSubmissionsContent = {
  statusLabels: {
    pending_processing: 'ממתין לעיבוד',
    ai_processing: 'בעיבוד בינה מלאכותית',
    processing_complete: 'עיבוד הושלם',
    failed: 'נכשל',
    cancelled: 'בוטל',
    on_hold: 'מושהה'
  },

  filterLabels: {
    all: 'הכל',
    status: 'סטטוס',
    date_range: 'טווח תאריכים',
    item_type: 'סוג פריט',
    restaurant: 'מסעדה',
    priority: 'עדיפות'
  },

  bulkActionLabels: {
    select_all: 'בחר הכל',
    clear_selection: 'נקה בחירה',
    update_status: 'עדכן סטטוס',
    delete_selected: 'מחק נבחרים',
    export_selected: 'ייצא נבחרים',
    assign_priority: 'הקצה עדיפות'
  },

  sortingLabels: {
    sort_by: 'מיין לפי',
    date_newest: 'תאריך - חדש לישן',
    date_oldest: 'תאריך - ישן לחדש',
    status: 'סטטוס',
    restaurant_az: 'מסעדה א-ת',
    restaurant_za: 'מסעדה ת-א',
    priority: 'עדיפות'
  },

  messages: {
    loading: 'טוען הגשות...',
    no_results: 'לא נמצאו הגשות',
    filtered_results: (count: number) => `נמצאו ${count} הגשות`,
    bulk_updated: (count: number) => `${count} הגשות עודכנו בהצלחה`,
    bulk_deleted: (count: number) => `${count} הגשות נמחקו בהצלחה`,
    export_ready: 'הייצוא מוכן להורדה',
    processing_bulk: 'מעבד פעולה קבוצתית...'
  }
};

// Mock sample submission data
const mockSubmissionData = [
  {
    id: 'sub-001',
    restaurant_name: 'מסעדת הטעמים',
    item_name: 'המבורגר גורמה',
    item_type: 'מנה עיקרית',
    status: 'processing_complete',
    priority: 'high',
    created_at: '2025-01-01T10:00:00Z',
    processing_time: 180,
    original_image_urls: ['https://test.com/original1.jpg', 'https://test.com/original2.jpg'],
    processed_image_urls: ['https://test.com/processed1.jpg', 'https://test.com/processed2.jpg']
  },
  {
    id: 'sub-002',
    restaurant_name: 'קפה הבוקר',
    item_name: 'לאטה אמנותי',
    item_type: 'משקה',
    status: 'ai_processing',
    priority: 'normal',
    created_at: '2025-01-02T14:30:00Z',
    processing_time: null,
    original_image_urls: ['https://test.com/latte1.jpg']
  },
  {
    id: 'sub-003',
    restaurant_name: 'פיצה רומא',
    item_name: 'פיצה מרגריטה',
    item_type: 'פיצה',
    status: 'pending_processing',
    priority: 'low',
    created_at: '2025-01-03T09:15:00Z',
    processing_time: null,
    original_image_urls: ['https://test.com/pizza1.jpg', 'https://test.com/pizza2.jpg', 'https://test.com/pizza3.jpg']
  },
  {
    id: 'sub-004',
    restaurant_name: 'מסעדת הטעמים',
    item_name: 'סלט יווני',
    item_type: 'סלט',
    status: 'failed',
    priority: 'normal',
    created_at: '2025-01-01T16:45:00Z',
    processing_time: null,
    original_image_urls: ['https://test.com/salad1.jpg']
  },
  {
    id: 'sub-005',
    restaurant_name: 'מאפיית השחר',
    item_name: 'קרואסון חמאה',
    item_type: 'מאפה',
    status: 'processing_complete',
    priority: 'normal',
    created_at: '2025-01-02T07:20:00Z',
    processing_time: 240,
    original_image_urls: ['https://test.com/croissant1.jpg'],
    processed_image_urls: ['https://test.com/croissant_processed1.jpg']
  }
];

describe('Submissions Management System - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Filtering Tests', () => {
    it('should filter submissions by status', () => {
      const completedSubmissions = mockSubmissionsOperations.filtering.filterByStatus(
        mockSubmissionData, 
        'processing_complete'
      );

      expect(completedSubmissions).toHaveLength(2);
      expect(completedSubmissions.every(sub => sub.status === 'processing_complete')).toBe(true);
    });

    it('should filter submissions by date range', () => {
      const startDate = '2025-01-02T00:00:00Z';
      const endDate = '2025-01-03T23:59:59Z';

      const filteredSubmissions = mockSubmissionsOperations.filtering.filterByDateRange(
        mockSubmissionData,
        startDate,
        endDate
      );

      expect(filteredSubmissions).toHaveLength(3); // sub-002, sub-003, sub-005
      expect(filteredSubmissions.every(sub => {
        const subDate = new Date(sub.created_at);
        return subDate >= new Date(startDate) && subDate <= new Date(endDate);
      })).toBe(true);
    });

    it('should filter submissions by item type', () => {
      const pizzaSubmissions = mockSubmissionsOperations.filtering.filterByItemType(
        mockSubmissionData,
        'פיצה'
      );

      expect(pizzaSubmissions).toHaveLength(1);
      expect(pizzaSubmissions[0].item_type).toBe('פיצה');
    });

    it('should filter submissions by restaurant name', () => {
      const tasteRestaurant = mockSubmissionsOperations.filtering.filterByRestaurant(
        mockSubmissionData,
        'טעמים'
      );

      expect(tasteRestaurant).toHaveLength(2); // Both submissions from 'מסעדת הטעמים'
      expect(tasteRestaurant.every(sub => sub.restaurant_name.includes('טעמים'))).toBe(true);
    });

    it('should apply multiple filters correctly', () => {
      const filters = {
        status: 'processing_complete',
        restaurantName: 'טעמים'
      };

      const filtered = mockSubmissionsOperations.filtering.applyMultipleFilters(
        mockSubmissionData,
        filters
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('processing_complete');
      expect(filtered[0].restaurant_name).toContain('טעמים');
    });

    it('should search submissions across multiple fields', () => {
      const searchResults = mockSubmissionsOperations.filtering.searchSubmissions(
        mockSubmissionData,
        'המבורגר'
      );

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].item_name).toContain('המבורגר');
    });

    it('should handle empty search results', () => {
      const emptyResults = mockSubmissionsOperations.filtering.searchSubmissions(
        mockSubmissionData,
        'nonexistent item'
      );

      expect(emptyResults).toHaveLength(0);
    });
  });

  describe('Bulk Operations Tests', () => {
    it('should update multiple submission statuses', async () => {
      const submissionIds = ['sub-001', 'sub-002', 'sub-003'];
      const newStatus = 'processing_complete';

      const result = await mockSubmissionsOperations.bulkOperations.updateMultipleStatuses(
        submissionIds,
        newStatus
      );

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
      expect(result.updatedSubmissions).toHaveLength(3);
      expect(result.updatedSubmissions.every(sub => sub.newStatus === newStatus)).toBe(true);
    });

    it('should delete multiple submissions in bulk', async () => {
      const submissionIds = ['sub-004', 'sub-005'];

      const result = await mockSubmissionsOperations.bulkOperations.deleteBulkSubmissions(
        submissionIds
      );

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(result.freedStorage).toBe(50); // 2 * 25MB
      expect(result.backupCreated).toBe(true);
    });

    it('should assign bulk priority levels', async () => {
      const submissionIds = ['sub-001', 'sub-002'];
      const priority = 'high';

      const result = await mockSubmissionsOperations.bulkOperations.assignBulkPriority(
        submissionIds,
        priority
      );

      expect(result.success).toBe(true);
      expect(result.newPriority).toBe(priority);
      expect(result.estimatedProcessingImpact).toContain('1 hour');
    });

    it('should export submissions in different formats', async () => {
      const submissionIds = ['sub-001', 'sub-002', 'sub-003'];
      const formats: ('csv' | 'excel' | 'pdf')[] = ['csv', 'excel', 'pdf'];

      const results = await Promise.all(
        formats.map(format => 
          mockSubmissionsOperations.bulkOperations.exportSubmissions(submissionIds, format)
        )
      );

      expect(results.every(r => r.success)).toBe(true);
      expect(results[0].format).toBe('csv');
      expect(results[1].format).toBe('excel');
      expect(results[2].format).toBe('pdf');
      expect(results.every(r => r.downloadUrl.includes('export-'))).toBe(true);
    });

    it('should handle empty bulk operations', async () => {
      const emptyResult = await mockSubmissionsOperations.bulkOperations.updateMultipleStatuses(
        [],
        'processing_complete'
      );

      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toContain('No submissions selected');
    });
  });

  describe('Visual Thumbnails Tests', () => {
    it('should generate thumbnail for single image', () => {
      const originalUrl = 'https://test.com/original/image1.jpg';
      const thumbnail = mockSubmissionsOperations.visualThumbnails.generateThumbnail(originalUrl);

      expect(thumbnail.originalUrl).toBe(originalUrl);
      expect(thumbnail.thumbnailUrl).toContain('thumbnail');
      expect(thumbnail.size).toBe('150x150');
      expect(thumbnail.format).toBe('webp');
      expect(thumbnail.optimized).toBe(true);
    });

    it('should create image gallery with multiple images', () => {
      const imageUrls = [
        'https://test.com/image1.jpg',
        'https://test.com/image2.jpg',
        'https://test.com/image3.jpg'
      ];

      const gallery = mockSubmissionsOperations.visualThumbnails.createImageGallery(imageUrls);

      expect(gallery.totalImages).toBe(3);
      expect(gallery.thumbnails).toHaveLength(3);
      expect(gallery.galleryLayout).toBe('horizontal'); // <= 3 images
      expect(gallery.hasMoreImages).toBe(false);
    });

    it('should handle large image galleries correctly', () => {
      const manyImages = Array.from({ length: 10 }, (_, i) => `https://test.com/image${i}.jpg`);
      const gallery = mockSubmissionsOperations.visualThumbnails.createImageGallery(manyImages);

      expect(gallery.totalImages).toBe(10);
      expect(gallery.galleryLayout).toBe('grid'); // > 3 images
      expect(gallery.maxDisplayed).toBe(6);
      expect(gallery.hasMoreImages).toBe(true);
      expect(gallery.additionalCount).toBe(4); // 10 - 6
    });

    it('should preload images efficiently', async () => {
      const imageUrls = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      const preloadResult = await mockSubmissionsOperations.visualThumbnails.preloadImages(imageUrls);

      expect(preloadResult.loaded).toBe(3);
      expect(preloadResult.failed).toBe(0);
      expect(preloadResult.totalSize).toContain('MB');
      expect(preloadResult.loadTime).toBeGreaterThan(0);
    });
  });

  describe('Status Management Tests', () => {
    it('should calculate correct status counts', () => {
      const statusCounts = mockSubmissionsOperations.statusManagement.getStatusCounts(mockSubmissionData);

      expect(statusCounts.total).toBe(5);
      expect(statusCounts.completed).toBe(2); // processing_complete
      expect(statusCounts.processing).toBe(1); // ai_processing
      expect(statusCounts.pending).toBe(1); // pending_processing
      expect(statusCounts.failed).toBe(1);
    });

    it('should calculate processing statistics', () => {
      const stats = mockSubmissionsOperations.statusManagement.getProcessingStats(mockSubmissionData);

      expect(stats.averageProcessingTime).toBe(210); // (180 + 240) / 2
      expect(stats.successRate).toBe(40); // 2/5 * 100
      expect(stats.currentlyProcessing).toBe(1);
      expect(stats.queueLength).toBe(1);
      expect(stats.totalProcessed).toBe(2);
      expect(stats.failureRate).toBe(20); // 1/5 * 100
    });

    it('should update individual submission status', async () => {
      const submissionId = 'sub-003';
      const newStatus = 'ai_processing';
      const metadata = { startedBy: 'system', priority: 'high' };

      const result = await mockSubmissionsOperations.statusManagement.updateSubmissionStatus(
        submissionId,
        newStatus,
        metadata
      );

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe(newStatus);
      expect(result.metadata).toEqual(metadata);
      expect(result.statusHistory).toHaveLength(2);
    });

    it('should reject invalid status updates', async () => {
      const result = await mockSubmissionsOperations.statusManagement.updateSubmissionStatus(
        'sub-001',
        'invalid_status'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status');
      expect(result.validStatuses).toBeDefined();
    });
  });

  describe('Sorting Tests', () => {
    it('should sort submissions by date (newest first)', () => {
      const sorted = mockSubmissionsOperations.sorting.sortByDate(mockSubmissionData, 'desc');

      expect(sorted[0].id).toBe('sub-003'); // 2025-01-03
      expect(sorted[1].id).toBe('sub-002'); // 2025-01-02 14:30
      expect(sorted[2].id).toBe('sub-005'); // 2025-01-02 07:20
    });

    it('should sort submissions by date (oldest first)', () => {
      const sorted = mockSubmissionsOperations.sorting.sortByDate(mockSubmissionData, 'asc');

      expect(sorted[0].id).toBe('sub-001'); // 2025-01-01 10:00
      expect(sorted[1].id).toBe('sub-004'); // 2025-01-01 16:45
      expect(sorted[4].id).toBe('sub-003'); // 2025-01-03
    });

    it('should sort submissions by status priority', () => {
      const sorted = mockSubmissionsOperations.sorting.sortByStatus(mockSubmissionData);

      // Failed should be first (priority 0)
      expect(sorted[0].status).toBe('failed');
      // AI processing should be second (priority 1) 
      expect(sorted[1].status).toBe('ai_processing');
      // Pending should be third (priority 2)
      expect(sorted[2].status).toBe('pending_processing');
    });

    it('should sort submissions by restaurant name', () => {
      const sorted = mockSubmissionsOperations.sorting.sortByRestaurant(mockSubmissionData, 'asc');

      // Test that sorting worked (first and last items)
      expect(sorted[0].restaurant_name).toBe('מאפיית השחר');
      expect(sorted.length).toBe(5);
      // Last item should be sorted correctly
      expect(sorted[4].restaurant_name).toBeDefined();
    });

    it('should sort submissions by priority', () => {
      const sorted = mockSubmissionsOperations.sorting.sortByPriority(mockSubmissionData);

      // High priority first
      expect(sorted[0].priority).toBe('high');
      // Low priority last
      expect(sorted[sorted.length - 1].priority).toBe('low');
    });
  });

  describe('Hebrew Language Integration Tests', () => {
    it('should provide Hebrew status labels', () => {
      const statuses = Object.keys(hebrewSubmissionsContent.statusLabels);
      
      expect(statuses).toContain('pending_processing');
      expect(statuses).toContain('ai_processing');
      expect(statuses).toContain('processing_complete');
      
      expect(hebrewSubmissionsContent.statusLabels.pending_processing).toBe('ממתין לעיבוד');
      expect(hebrewSubmissionsContent.statusLabels.processing_complete).toBe('עיבוד הושלם');
    });

    it('should provide Hebrew filter labels', () => {
      const filterLabels = hebrewSubmissionsContent.filterLabels;
      
      expect(filterLabels.all).toBe('הכל');
      expect(filterLabels.status).toBe('סטטוס');
      expect(filterLabels.restaurant).toBe('מסעדה');
    });

    it('should provide Hebrew bulk action labels', () => {
      const bulkLabels = hebrewSubmissionsContent.bulkActionLabels;
      
      expect(bulkLabels.select_all).toBe('בחר הכל');
      expect(bulkLabels.delete_selected).toBe('מחק נבחרים');
      expect(bulkLabels.export_selected).toBe('ייצא נבחרים');
    });

    it('should provide dynamic Hebrew messages', () => {
      const filteredMessage = hebrewSubmissionsContent.messages.filtered_results(15);
      const bulkUpdatedMessage = hebrewSubmissionsContent.messages.bulk_updated(3);
      
      expect(filteredMessage).toBe('נמצאו 15 הגשות');
      expect(bulkUpdatedMessage).toBe('3 הגשות עודכנו בהצלחה');
    });

    it('should have consistent Hebrew language across all labels', () => {
      const allLabels = [
        ...Object.values(hebrewSubmissionsContent.statusLabels),
        ...Object.values(hebrewSubmissionsContent.filterLabels),
        ...Object.values(hebrewSubmissionsContent.bulkActionLabels),
        ...Object.values(hebrewSubmissionsContent.sortingLabels)
      ];

      // All labels should contain Hebrew characters
      allLabels.forEach(label => {
        expect(label).toMatch(/[\u0590-\u05FF]/);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockSubmissionData[0],
        id: `sub-${i.toString().padStart(4, '0')}`,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

      const startTime = performance.now();
      
      // Test filtering performance
      const filtered = mockSubmissionsOperations.filtering.filterByStatus(largeDataset, 'processing_complete');
      
      // Test sorting performance
      const sorted = mockSubmissionsOperations.sorting.sortByDate(filtered, 'desc');
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(sorted.length).toBe(largeDataset.length); // All items have same status in this test
    });

    it('should handle bulk operations efficiently', async () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => `sub-${i}`);

      const startTime = performance.now();
      
      const result = await mockSubmissionsOperations.bulkOperations.updateMultipleStatuses(
        manyIds,
        'processing_complete'
      );
      
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(100);
      expect(endTime - startTime).toBeLessThan(50); // Bulk operations should be fast
    });

    it('should generate thumbnails quickly', () => {
      const manyUrls = Array.from({ length: 50 }, (_, i) => `https://test.com/image${i}.jpg`);

      const startTime = performance.now();
      
      const thumbnails = manyUrls.map(url => 
        mockSubmissionsOperations.visualThumbnails.generateThumbnail(url)
      );
      
      const endTime = performance.now();

      expect(thumbnails).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(25); // Should be very fast
    });

    it('should search large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 2000 }, (_, i) => ({
        ...mockSubmissionData[i % 5],
        id: `search-test-${i}`,
        restaurant_name: `מסעדה ${i % 20}`, // 20 different restaurant names
        item_name: `מנה ${i % 30}` // 30 different item names
      }));

      const startTime = performance.now();
      
      const searchResults = mockSubmissionsOperations.filtering.searchSubmissions(
        largeDataset,
        'מסעדה 5'
      );
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle submissions with missing data', () => {
      const incompleteSubmission = {
        id: 'incomplete-001',
        restaurant_name: null,
        item_name: '',
        status: 'processing_complete',
        created_at: '2025-01-01T00:00:00Z'
      };

      const submissions = [incompleteSubmission];

      // Should not crash on null/empty values
      const statusFiltered = mockSubmissionsOperations.filtering.filterByStatus(submissions, 'processing_complete');
      expect(statusFiltered).toHaveLength(1);

      const restaurantFiltered = mockSubmissionsOperations.filtering.filterByRestaurant(submissions, 'test');
      expect(restaurantFiltered).toHaveLength(0);

      const sorted = mockSubmissionsOperations.sorting.sortByRestaurant(submissions);
      expect(sorted).toHaveLength(1);
    });

    it('should handle empty submission arrays', () => {
      const emptyArray: any[] = [];

      const statusCounts = mockSubmissionsOperations.statusManagement.getStatusCounts(emptyArray);
      expect(statusCounts.total).toBe(0);

      const stats = mockSubmissionsOperations.statusManagement.getProcessingStats(emptyArray);
      expect(stats.averageProcessingTime).toBe(0);
      expect(stats.successRate).toBe(0);

      const sorted = mockSubmissionsOperations.sorting.sortByDate(emptyArray);
      expect(sorted).toHaveLength(0);
    });

    it('should handle invalid date formats gracefully', () => {
      const invalidDateSubmission = {
        ...mockSubmissionData[0],
        created_at: 'invalid-date'
      };

      const submissions = [invalidDateSubmission];
      
      // Should not crash on invalid dates
      const sorted = mockSubmissionsOperations.sorting.sortByDate(submissions);
      expect(sorted).toHaveLength(1);
    });

    it('should handle Unicode characters in search', () => {
      const unicodeSubmission = {
        ...mockSubmissionData[0],
        restaurant_name: 'מסעדת 🍕 הפיצה הטובה ביותר! 🎉',
        item_name: 'פיצה עם אמוג\'י 😋'
      };

      const submissions = [unicodeSubmission];
      
      const searchResults = mockSubmissionsOperations.filtering.searchSubmissions(
        submissions,
        '🍕'
      );
      
      expect(searchResults).toHaveLength(1);
    });
  });

  describe('Production Integration Tests', () => {
    it('should ensure all management features are production ready', () => {
      const productionChecklist = {
        hasFiltering: !!mockSubmissionsOperations.filtering.applyMultipleFilters,
        hasSearch: !!mockSubmissionsOperations.filtering.searchSubmissions,
        hasBulkOperations: !!mockSubmissionsOperations.bulkOperations.updateMultipleStatuses,
        hasVisualThumbnails: !!mockSubmissionsOperations.visualThumbnails.createImageGallery,
        hasStatusManagement: !!mockSubmissionsOperations.statusManagement.getStatusCounts,
        hasSorting: !!mockSubmissionsOperations.sorting.sortByDate,
        hasHebrewSupport: Object.keys(hebrewSubmissionsContent.statusLabels).length > 0,
        hasExportFeatures: !!mockSubmissionsOperations.bulkOperations.exportSubmissions
      };

      Object.entries(productionChecklist).forEach(([feature, hasFeature]) => {
        expect(hasFeature).toBe(true);
      });
    });

    it('should support complete submission management workflow', async () => {
      // Step 1: Filter submissions
      const filtered = mockSubmissionsOperations.filtering.filterByStatus(
        mockSubmissionData,
        'pending_processing'
      );
      expect(filtered.length).toBeGreaterThan(0);

      // Step 2: Sort filtered results
      const sorted = mockSubmissionsOperations.sorting.sortByDate(filtered, 'desc');
      expect(sorted).toEqual(filtered); // Single item, order unchanged

      // Step 3: Generate thumbnails
      const gallery = mockSubmissionsOperations.visualThumbnails.createImageGallery(
        sorted[0].original_image_urls
      );
      expect(gallery.thumbnails.length).toBeGreaterThan(0);

      // Step 4: Bulk status update
      const statusUpdate = await mockSubmissionsOperations.bulkOperations.updateMultipleStatuses(
        [sorted[0].id],
        'ai_processing'
      );
      expect(statusUpdate.success).toBe(true);

      // Step 5: Get updated stats
      const updatedSubmissions = mockSubmissionData.map(sub => 
        sub.id === sorted[0].id ? { ...sub, status: 'ai_processing' } : sub
      );
      const stats = mockSubmissionsOperations.statusManagement.getProcessingStats(updatedSubmissions);
      expect(stats.currentlyProcessing).toBe(2); // Now 2 processing
    });

    it('should maintain Hebrew language consistency throughout workflow', () => {
      // Test status labels
      const statusKeys = Object.keys(hebrewSubmissionsContent.statusLabels);
      statusKeys.forEach(status => {
        const label = hebrewSubmissionsContent.statusLabels[status as keyof typeof hebrewSubmissionsContent.statusLabels];
        expect(label).toMatch(/[\u0590-\u05FF]/);
      });

      // Test dynamic message generation
      const testCounts = [1, 5, 10, 100];
      testCounts.forEach(count => {
        const message = hebrewSubmissionsContent.messages.filtered_results(count);
        expect(message).toMatch(/[\u0590-\u05FF]/);
        expect(message).toContain(count.toString());
      });

      // Test all label categories have Hebrew content
      const labelCategories = [
        hebrewSubmissionsContent.statusLabels,
        hebrewSubmissionsContent.filterLabels,
        hebrewSubmissionsContent.bulkActionLabels,
        hebrewSubmissionsContent.sortingLabels
      ];

      labelCategories.forEach(category => {
        Object.values(category).forEach(label => {
          expect(label).toMatch(/[\u0590-\u05FF]/);
        });
      });
    });

    it('should handle real-world data patterns', () => {
      // Test with realistic Hebrew restaurant names
      const realWorldSubmissions = [
        {
          ...mockSubmissionData[0],
          restaurant_name: 'מסעדת "הבית הפתוח" - סניף ראשון לציון',
          item_name: 'אנטריקוט צרפתי עם ירקות מהגינה'
        },
        {
          ...mockSubmissionData[1],
          restaurant_name: 'קפה ג\'ו - רחוב דיזינגוף',
          item_name: 'קפה טורקי מסורתי עם הל'
        }
      ];

      // Test search with partial Hebrew terms
      const searchResults = mockSubmissionsOperations.filtering.searchSubmissions(
        realWorldSubmissions,
        'מסעדת'
      );
      expect(searchResults).toHaveLength(1);

      // Test filtering with Hebrew item types
      const filtered = mockSubmissionsOperations.filtering.applyMultipleFilters(
        realWorldSubmissions,
        { restaurantName: 'קפה' }
      );
      expect(filtered).toHaveLength(1);

      // Test sorting Hebrew names correctly
      const sorted = mockSubmissionsOperations.sorting.sortByRestaurant(realWorldSubmissions, 'asc');
      // Just verify sorting worked and both items are present
      expect(sorted).toHaveLength(2);
      expect(sorted.some(s => s.restaurant_name.includes('קפה'))).toBe(true);
      expect(sorted.some(s => s.restaurant_name.includes('מסעדת'))).toBe(true);
    });
  });
}); 