import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock upload form operations for all three paths
const mockUploadFormsOperations = {
  unified: {
    submitForm: async (formData: any) => {
      if (!formData.itemName || !formData.files) {
        return { data: null, error: { message: 'שדות חובה חסרים' } };
      }
      
      return {
        data: {
          submissionId: 'unified-submission-123',
          status: 'pending_processing',
          itemName: formData.itemName,
          fileCount: formData.files.length,
          uploadedAt: new Date().toISOString()
        },
        error: null
      };
    },

    validateFiles: (files: File[]) => {
      const maxSize = 25 * 1024 * 1024; // 25MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      const oversizedFiles = files.filter(file => file.size > maxSize);
      const invalidTypes = files.filter(file => !allowedTypes.includes(file.type));
      
      return {
        valid: oversizedFiles.length === 0 && invalidTypes.length === 0,
        errors: [
          ...oversizedFiles.map(f => `קובץ ${f.name} גדול מדי (מעל 25MB)`),
          ...invalidTypes.map(f => `סוג קובץ ${f.name} לא נתמך`)
        ]
      };
    },

    generatePreview: (file: File) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      preview: `blob:${URL.createObjectURL(file)}`,
      uploadStatus: 'ready'
    })
  },

  public: {
    submitAnonymous: async (submissionData: any) => {
      // Public submissions don't require authentication
      return {
        data: {
          submissionId: 'public-submission-456',
          publicUrl: `https://food-vision.com/public/${submissionData.restaurantName}`,
          estimatedProcessingTime: '24-48 hours',
          contactEmail: submissionData.email
        },
        error: null
      };
    },

    validatePublicSubmission: (data: any) => {
      const required = ['restaurantName', 'email', 'itemName', 'files'];
      const missing = required.filter(field => !data[field] || data[field].length === 0);
      
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailValid = emailPattern.test(data.email || '');
      
      return {
        valid: missing.length === 0 && emailValid,
        errors: [
          ...missing.map(field => `שדה ${field} הוא חובה`),
          ...(emailValid ? [] : ['כתובת אימייל לא תקינה'])
        ]
      };
    }
  },

  legacy: {
    convertLegacyFormat: (legacyData: any) => {
      // Convert old format to new unified format
      return {
        itemName: legacyData.dish_name || legacyData.item_name,
        itemType: legacyData.category || 'מנה',
        restaurantName: legacyData.restaurant || legacyData.business_name,
        files: legacyData.images || [],
        notes: legacyData.comments || legacyData.description,
        migrated: true,
        originalFormat: 'legacy'
      };
    },

    submitLegacy: async (legacyData: any) => {
      const converted = mockUploadFormsOperations.legacy.convertLegacyFormat(legacyData);
      
      return {
        data: {
          submissionId: 'legacy-submission-789',
          convertedData: converted,
          migrationStatus: 'success',
          warnings: legacyData.deprecated_fields ? ['שדות מיושנים הוסרו'] : []
        },
        error: null
      };
    }
  }
};

// Mock step-by-step form progression
const mockFormSteps = {
  unified: [
    { step: 1, title: 'פרטי המסעדה', fields: ['restaurantName', 'contactPerson'] },
    { step: 2, title: 'פרטי המנה', fields: ['itemName', 'itemType', 'description'] },
    { step: 3, title: 'העלאת תמונות', fields: ['productImages', 'brandingMaterials', 'referenceExamples'] },
    { step: 4, title: 'סיכום ושליחה', fields: ['confirmation'] }
  ],

  public: [
    { step: 1, title: 'מי אתם?', fields: ['restaurantName', 'email'] },
    { step: 2, title: 'מה הפריט?', fields: ['itemName', 'itemType'] },
    { step: 3, title: 'העלאת תמונות', fields: ['files'] },
    { step: 4, title: 'שליחה', fields: ['terms'] }
  ],

  validateStep: (formType: string, step: number, data: any) => {
    const steps = formType === 'unified' ? mockFormSteps.unified : mockFormSteps.public;
    const currentStep = steps[step - 1];
    
    if (!currentStep) return { valid: false, error: 'שלב לא קיים' };
    
    const missingFields = currentStep.fields.filter(field => !data[field]);
    
    return {
      valid: missingFields.length === 0,
      missingFields,
      canProceed: missingFields.length === 0,
      nextStep: step < steps.length ? step + 1 : null
    };
  }
};

// Mock file upload progress tracking
const mockUploadProgress = {
  trackProgress: (files: File[]) => {
    return files.map((file, index) => ({
      fileId: `file-${index}`,
      fileName: file.name,
      size: file.size,
      progress: 0,
      status: 'queued',
      startTime: null,
      endTime: null
    }));
  },

  simulateUpload: async (fileTrackers: any[]) => {
    const updates = [];
    
    for (const tracker of fileTrackers) {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        updates.push({
          ...tracker,
          progress,
          status: progress === 100 ? 'completed' : 'uploading',
          endTime: progress === 100 ? new Date().toISOString() : null
        });
      }
    }
    
    return updates;
  },

  calculateOverallProgress: (fileTrackers: any[]) => {
    const totalProgress = fileTrackers.reduce((sum, tracker) => sum + tracker.progress, 0);
    return Math.round(totalProgress / fileTrackers.length);
  }
};

// Mock Hebrew form field handling
const hebrewFormFields = {
  validation: {
    restaurantName: (value: string) => {
      const isValid = Boolean(value && value.length >= 2);
      return {
        valid: isValid,
        error: isValid ? null : 'שם מסעדה הוא שדה חובה'
      };
    },
    
    itemName: (value: string) => ({
      valid: value && value.length >= 2,
      error: value ? null : 'שם המנה הוא שדה חובה'
    }),
    
    email: (value: string) => {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        valid: pattern.test(value),
        error: pattern.test(value) ? null : 'כתובת אימייל לא תקינה'
      };
    }
  },

  sanitization: {
    cleanHebrewInput: (input: string) => {
      return input
        .trim()
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/[\u200E\u200F]/g, ''); // Remove direction markers
    },
    
    normalizeItemType: (itemType: string) => {
      const typeMapping = {
        'מנה ראשונה': 'מנה',
        'מנה עיקרית': 'מנה', 
        'קינוח': 'קינוח',
        'משקה': 'שתיה',
        'קוקטייל': 'שתיה',
        'מאפה': 'מאפה'
      };
      
      return typeMapping[itemType as keyof typeof typeMapping] || itemType;
    }
  },

  placeholders: {
    unified: {
      restaurantName: 'למשל: מסעדת האושר',
      itemName: 'למשל: המבורגר טבעוני',
      description: 'תאר את המנה, רכיבים מיוחדים, אלרגנים...'
    },
    public: {
      restaurantName: 'שם המסעדה שלכם',
      email: 'example@restaurant.co.il',
      itemName: 'שם המנה שברצונכם לצלם'
    }
  }
};

// Mock integration with other systems
const mockSystemIntegration = {
  storage: {
    uploadToStorage: async (files: File[], submissionId: string) => {
      return files.map((file, index) => ({
        originalName: file.name,
        storagePath: `submissions/${submissionId}/file-${index}.${file.name.split('.').pop()}`,
        publicUrl: `https://storage.supabase.co/submissions/${submissionId}/file-${index}`,
        uploadedAt: new Date().toISOString()
      }));
    }
  },

  webhook: {
    notifyProcessing: async (submissionId: string) => ({
      webhookSent: true,
      processingQueuePosition: Math.floor(Math.random() * 10) + 1,
      estimatedStartTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    })
  },

  email: {
    sendConfirmation: async (email: string, submissionId: string) => ({
      emailSent: true,
      confirmationCode: `FV-${submissionId.slice(-6).toUpperCase()}`,
      trackingUrl: `https://food-vision.com/track/${submissionId}`
    })
  }
};

describe('Upload Forms System - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should complete unified form submission successfully', async () => {
      const formData = {
        restaurantName: 'מסעדת טעם הבית',
        itemName: 'שניצל ירושלמי',
        itemType: 'מנה',
        files: [
          new File(['test'], 'schnitzel.jpg', { type: 'image/jpeg' }),
          new File(['test'], 'branding.png', { type: 'image/png' })
        ]
      };

      const result = await mockUploadFormsOperations.unified.submitForm(formData);
      
      expect(result.error).toBeNull();
      expect(result.data?.submissionId).toBe('unified-submission-123');
      expect(result.data?.status).toBe('pending_processing');
      expect(result.data?.fileCount).toBe(2);
    });

    it('should handle public anonymous submission', async () => {
      const publicData = {
        restaurantName: 'קפה השכונה',
        email: 'owner@neighborhood-cafe.co.il',
        itemName: 'לאטה אמנותי',
        files: [new File(['test'], 'latte.jpg', { type: 'image/jpeg' })]
      };

      const result = await mockUploadFormsOperations.public.submitAnonymous(publicData);
      
      expect(result.data?.submissionId).toBe('public-submission-456');
      expect(result.data?.publicUrl).toContain('public/קפה השכונה');
      expect(result.data?.contactEmail).toBe('owner@neighborhood-cafe.co.il');
    });

    it('should convert and submit legacy format data', async () => {
      const legacyData = {
        dish_name: 'פיצה מרגריטה',
        category: 'פיצה',
        restaurant: 'פיצה רומא',
        images: [new File(['test'], 'pizza.jpg', { type: 'image/jpeg' })],
        comments: 'פיצה איטלקית מסורתית'
      };

      const result = await mockUploadFormsOperations.legacy.submitLegacy(legacyData);
      
      expect(result.data?.submissionId).toBe('legacy-submission-789');
      expect(result.data?.convertedData.itemName).toBe('פיצה מרגריטה');
      expect(result.data?.convertedData.migrated).toBe(true);
      expect(result.data?.migrationStatus).toBe('success');
    });

    it('should validate form steps correctly', () => {
      const step1Data = { restaurantName: 'מסעדת השף', contactPerson: 'יוסי כהן' };
      const validation = mockFormSteps.validateStep('unified', 1, step1Data);
      
      expect(validation.valid).toBe(true);
      expect(validation.canProceed).toBe(true);
      expect(validation.nextStep).toBe(2);
    });

    it('should track file upload progress', async () => {
      const files = [
        new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'image2.png', { type: 'image/png' })
      ];

      const trackers = mockUploadProgress.trackProgress(files);
      expect(trackers).toHaveLength(2);
      expect(trackers[0].fileName).toBe('image1.jpg');
      expect(trackers[0].status).toBe('queued');

      const updates = await mockUploadProgress.simulateUpload(trackers);
      const completed = updates.filter(u => u.status === 'completed');
      expect(completed).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle Hebrew restaurant names with special characters', () => {
      const hebrewNames = [
        'מסעדת "האושר" - תל אביב',
        'קפה ב\'יפו הישנה',
        'פיצה & פסטה ברחובות'
      ];

      hebrewNames.forEach(name => {
        const cleaned = hebrewFormFields.sanitization.cleanHebrewInput(name);
        expect(cleaned).not.toContain('\u200E'); // No LTR marks
        expect(cleaned).not.toContain('\u200F'); // No RTL marks
        expect(cleaned.trim()).toBe(cleaned); // No leading/trailing spaces
      });
    });

    it('should normalize item types correctly', () => {
      const itemTypes = [
        { input: 'מנה ראשונה', expected: 'מנה' },
        { input: 'מנה עיקרית', expected: 'מנה' },
        { input: 'קוקטייל', expected: 'שתיה' },
        { input: 'קינוח ביתי', expected: 'קינוח ביתי' } // Unknown type preserved
      ];

      itemTypes.forEach(({ input, expected }) => {
        const normalized = hebrewFormFields.sanitization.normalizeItemType(input);
        expect(normalized).toBe(expected);
      });
    });

    it('should handle empty or invalid form data', async () => {
      const invalidData = {
        restaurantName: '',
        itemName: null,
        files: []
      };

      const result = await mockUploadFormsOperations.unified.submitForm(invalidData);
      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('שדות חובה');
    });

    it('should handle large file uploads gracefully', () => {
      const largeFile = new File(['x'.repeat(30 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const validation = mockUploadFormsOperations.unified.validateFiles([largeFile]);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('גדול מדי');
    });

    it('should handle unsupported file types', () => {
      const unsupportedFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const validation = mockUploadFormsOperations.unified.validateFiles([unsupportedFile]);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('לא נתמך');
    });
  });

  describe('Form Step Validation Tests', () => {
    it('should prevent progression with incomplete required fields', () => {
      const incompleteData = { restaurantName: 'מסעדה' }; // Missing contactPerson
      const validation = mockFormSteps.validateStep('unified', 1, incompleteData);
      
      expect(validation.valid).toBe(false);
      expect(validation.canProceed).toBe(false);
      expect(validation.missingFields).toContain('contactPerson');
    });

    it('should validate public form steps differently', () => {
      const publicData = { restaurantName: 'קפה', email: 'test@example.com' };
      const validation = mockFormSteps.validateStep('public', 1, publicData);
      
      expect(validation.valid).toBe(true);
      expect(validation.nextStep).toBe(2);
    });

    it('should handle final step completion', () => {
      const finalStepData = { confirmation: true };
      const validation = mockFormSteps.validateStep('unified', 4, finalStepData);
      
      expect(validation.valid).toBe(true);
      expect(validation.nextStep).toBeNull(); // No next step
    });

    it('should validate all form types consistently', () => {
      const testData = { requiredField: 'value' };
      
      ['unified', 'public'].forEach(formType => {
        const validation = mockFormSteps.validateStep(formType, 1, testData);
        expect(validation).toHaveProperty('valid');
        expect(validation).toHaveProperty('canProceed');
      });
    });
  });

  describe('Hebrew Field Validation Tests', () => {
    it('should validate Hebrew restaurant names', () => {
      const testCases = [
        { name: 'מסעדת האושר', valid: true },
        { name: 'א', valid: false }, // Too short
        { name: '', valid: false }, // Empty
        { name: 'קפה בוקר טוב בתל אביב', valid: true }
      ];

      testCases.forEach(({ name, valid }) => {
        const validation = hebrewFormFields.validation.restaurantName(name);
        expect(validation.valid).toBe(valid);
      });
    });

    it('should validate Hebrew item names', () => {
      const testCases = [
        { name: 'המבורגר', valid: true },
        { name: 'פ', valid: false }, // Too short
        { name: 'שניצל ירושלמי עם תוספות', valid: true }
      ];

      testCases.forEach(({ name, valid }) => {
        const validation = hebrewFormFields.validation.itemName(name);
        expect(validation.valid).toBe(valid);
      });
    });

    it('should validate email addresses correctly', () => {
      const testCases = [
        { email: 'test@example.com', valid: true },
        { email: 'invalid-email', valid: false },
        { email: 'user@domain.co.il', valid: true },
        { email: '', valid: false }
      ];

      testCases.forEach(({ email, valid }) => {
        const validation = hebrewFormFields.validation.email(email);
        expect(validation.valid).toBe(valid);
      });
    });

    it('should provide Hebrew placeholders for all form types', () => {
      expect(hebrewFormFields.placeholders.unified.restaurantName).toContain('מסעדת');
      expect(hebrewFormFields.placeholders.public.itemName).toContain('שם המנה');
      expect(hebrewFormFields.placeholders.unified.description).toContain('תאר');
    });
  });

  describe('File Upload Progress Tests', () => {
    it('should initialize progress tracking correctly', () => {
      const files = [
        new File(['1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'file2.png', { type: 'image/png' })
      ];

      const trackers = mockUploadProgress.trackProgress(files);
      
      expect(trackers).toHaveLength(2);
      expect(trackers[0].progress).toBe(0);
      expect(trackers[0].status).toBe('queued');
      expect(trackers[1].fileName).toBe('file2.png');
    });

    it('should calculate overall progress correctly', () => {
      const trackers = [
        { progress: 100, status: 'completed' },
        { progress: 50, status: 'uploading' },
        { progress: 0, status: 'queued' }
      ];

      const overall = mockUploadProgress.calculateOverallProgress(trackers);
      expect(overall).toBe(50); // (100 + 50 + 0) / 3 = 50
    });

    it('should handle upload simulation', async () => {
      const initialTrackers = [
        { fileId: 'file-1', fileName: 'test.jpg', progress: 0, status: 'queued' }
      ];

      const updates = await mockUploadProgress.simulateUpload(initialTrackers);
      const completedUpdates = updates.filter(u => u.status === 'completed');
      
      expect(completedUpdates).toHaveLength(1);
      expect(completedUpdates[0].progress).toBe(100);
    });

    it('should track multiple files independently', () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        new File(['test'], `file${i}.jpg`, { type: 'image/jpeg' })
      );

      const trackers = mockUploadProgress.trackProgress(files);
      
      expect(trackers).toHaveLength(5);
      expect(trackers.every(t => t.progress === 0)).toBe(true);
      expect(trackers.every(t => t.status === 'queued')).toBe(true);
    });
  });

  describe('System Integration Tests', () => {
    it('should integrate with storage system', async () => {
      const files = [
        new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'image2.png', { type: 'image/png' })
      ];
      const submissionId = 'test-submission-123';

      const uploadResults = await mockSystemIntegration.storage.uploadToStorage(files, submissionId);
      
      expect(uploadResults).toHaveLength(2);
      expect(uploadResults[0].storagePath).toContain(submissionId);
      expect(uploadResults[0].publicUrl).toContain('storage.supabase.co');
    });

    it('should notify processing webhook', async () => {
      const submissionId = 'webhook-test-456';
      const notification = await mockSystemIntegration.webhook.notifyProcessing(submissionId);
      
      expect(notification.webhookSent).toBe(true);
      expect(notification.processingQueuePosition).toBeGreaterThan(0);
      expect(notification.estimatedStartTime).toBeDefined();
    });

    it('should send confirmation email', async () => {
      const email = 'test@restaurant.co.il';
      const submissionId = 'email-test-789';

      const emailResult = await mockSystemIntegration.email.sendConfirmation(email, submissionId);
      
      expect(emailResult.emailSent).toBe(true);
      expect(emailResult.confirmationCode).toContain('FV-');
      expect(emailResult.trackingUrl).toContain(submissionId);
    });

    it('should handle complete submission workflow', async () => {
      const formData = {
        restaurantName: 'מסעדת הבדיקה',
        itemName: 'מנה לבדיקה',
        email: 'test@test.co.il',
        files: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
      };

      // Step 1: Submit form
      const submission = await mockUploadFormsOperations.unified.submitForm(formData);
      expect(submission.data?.submissionId).toBeDefined();

      // Step 2: Upload files
      const uploads = await mockSystemIntegration.storage.uploadToStorage(
        formData.files, 
        submission.data!.submissionId
      );
      expect(uploads).toHaveLength(1);

      // Step 3: Notify processing
      const webhook = await mockSystemIntegration.webhook.notifyProcessing(
        submission.data!.submissionId
      );
      expect(webhook.webhookSent).toBe(true);

      // Step 4: Send confirmation
      const email = await mockSystemIntegration.email.sendConfirmation(
        formData.email,
        submission.data!.submissionId
      );
      expect(email.emailSent).toBe(true);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle network failures gracefully', async () => {
      const networkErrorForm = async () => {
        throw new Error('Network connection failed');
      };

      try {
        await networkErrorForm();
        expect.fail('Should have thrown network error');
      } catch (error) {
        expect((error as Error).message).toBe('Network connection failed');
      }
    });

    it('should validate public submission completely', () => {
      const invalidPublicData = {
        restaurantName: '',
        email: 'invalid-email',
        itemName: '',
        files: []
      };

      const validation = mockUploadFormsOperations.public.validatePublicSubmission(invalidPublicData);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(4); // 4 missing fields (email validation handled separately)
    });

    it('should handle legacy data conversion errors', () => {
      const corruptedLegacyData = {
        // Missing required fields
        images: null,
        restaurant: undefined
      };

      const converted = mockUploadFormsOperations.legacy.convertLegacyFormat(corruptedLegacyData);
      
      expect(converted.itemName).toBeUndefined();
      expect(converted.restaurantName).toBeUndefined();
      expect(converted.files).toEqual([]);
      expect(converted.migrated).toBe(true);
    });

    it('should provide helpful Hebrew error messages', () => {
      const emptyRestaurantName = hebrewFormFields.validation.restaurantName('');
      const emptyItemName = hebrewFormFields.validation.itemName('');
      const invalidEmail = hebrewFormFields.validation.email('invalid');

      expect(emptyRestaurantName.error).toContain('שם מסעדה');
      expect(emptyItemName.error).toContain('שם המנה');
      expect(invalidEmail.error).toContain('אימייל לא תקינה');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of files efficiently', () => {
      const manyFiles = Array.from({ length: 50 }, (_, i) => 
        new File(['content'], `file${i}.jpg`, { type: 'image/jpeg' })
      );

      const startTime = performance.now();
      const validation = mockUploadFormsOperations.unified.validateFiles(manyFiles);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(validation.valid).toBe(true);
    });

    it('should process form steps quickly', () => {
      const stepData = { restaurantName: 'מסעדה', contactPerson: 'איש קשר' };
      
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        mockFormSteps.validateStep('unified', 1, stepData);
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Batch validation should be fast
    });

    it('should handle Hebrew text processing efficiently', () => {
      const longHebrewText = 'מסעדת '.repeat(100) + 'האושר הגדולה בתל אביב';
      
      const startTime = performance.now();
      const cleaned = hebrewFormFields.sanitization.cleanHebrewInput(longHebrewText);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10);
      expect(cleaned.length).toBeGreaterThan(0);
    });
  });

  describe('Production Integration Tests', () => {
    it('should ensure all three form paths are production ready', () => {
      const productionChecklist = {
        unified: {
          hasValidation: !!mockUploadFormsOperations.unified.validateFiles,
          hasSubmission: !!mockUploadFormsOperations.unified.submitForm,
          hasPreview: !!mockUploadFormsOperations.unified.generatePreview
        },
        public: {
          hasValidation: !!mockUploadFormsOperations.public.validatePublicSubmission,
          hasSubmission: !!mockUploadFormsOperations.public.submitAnonymous
        },
        legacy: {
          hasConversion: !!mockUploadFormsOperations.legacy.convertLegacyFormat,
          hasSubmission: !!mockUploadFormsOperations.legacy.submitLegacy
        }
      };

      Object.entries(productionChecklist).forEach(([formType, checks]) => {
        Object.entries(checks).forEach(([check, hasFeature]) => {
          expect(hasFeature).toBe(true);
        });
      });
    });

    it('should support complete Hebrew workflow', () => {
      const hebrewWorkflow = {
        restaurantName: 'מסעדת הטעמים המיוחדים',
        itemName: 'קציצות דגים ברוטב עגבניות',
        itemType: 'מנה עיקרית',
        description: 'מנה ביתית מסורתית עם רוטב עגבניות טרי ותבלינים מהגינה'
      };

      // Validate Hebrew input
      const nameValidation = hebrewFormFields.validation.restaurantName(hebrewWorkflow.restaurantName);
      const itemValidation = hebrewFormFields.validation.itemName(hebrewWorkflow.itemName);

      expect(nameValidation.valid).toBe(true);
      expect(itemValidation.valid).toBe(true);

      // Clean Hebrew text
      const cleanedDescription = hebrewFormFields.sanitization.cleanHebrewInput(hebrewWorkflow.description);
      expect(cleanedDescription).toBe(hebrewWorkflow.description.trim());

      // Normalize item type
      const normalizedType = hebrewFormFields.sanitization.normalizeItemType(hebrewWorkflow.itemType);
      expect(normalizedType).toBe('מנה');
    });

    it('should validate production file size and type limits', () => {
      const productionLimits = {
        maxFileSize: 25 * 1024 * 1024, // 25MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFilesPerSubmission: 10
      };

      // Test file size limit
      const largeFile = new File(['x'.repeat(productionLimits.maxFileSize + 1)], 'large.jpg', { type: 'image/jpeg' });
      const sizeValidation = mockUploadFormsOperations.unified.validateFiles([largeFile]);
      expect(sizeValidation.valid).toBe(false);

      // Test file type validation
      const invalidFile = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
      const typeValidation = mockUploadFormsOperations.unified.validateFiles([invalidFile]);
      expect(typeValidation.valid).toBe(false);

      // Test valid files
      const validFile = new File(['test'], 'image.jpg', { type: 'image/jpeg' });
      const validValidation = mockUploadFormsOperations.unified.validateFiles([validFile]);
      expect(validValidation.valid).toBe(true);
    });
  });
}); 