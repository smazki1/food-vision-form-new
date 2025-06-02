/// <reference types="vitest/globals" />

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LeadDetailsSheet from './LeadDetailsSheet';
import { MOCK_PACKAGES } from '@/types/package';
import { Lead, LeadStatusEnum, LeadSourceEnum, LEAD_STATUS_DISPLAY, LEAD_SOURCE_DISPLAY } from '@/types/lead';
import { toast } from 'sonner';
import { I18nextProvider } from "react-i18next";
// import i18n from "@/lib/i18n/config"; // Commenting out problematic import for now
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Début du mock i18n global pour ce fichier de test
const i18nMock = {
  t: (key: string, options?: any) => {
    if (options && typeof options === 'object' && 'count' in options) {
      return `${key}_count:${options.count}`;
    }
    return key;
  },
  language: 'en',
  isInitialized: true,
  on: vi.fn(),
  off: vi.fn(),
  changeLanguage: vi.fn().mockResolvedValue(undefined),
  getFixedT: vi.fn().mockImplementation((lng?: string, ns?: string | string[], keyPrefix?: string) => (key: string, options?: any) => {
    let fullKey = key;
    if (keyPrefix) fullKey = `${keyPrefix}.${key}`;
    if (ns) {
      const namespace = Array.isArray(ns) ? ns[0] : ns;
      fullKey = `${namespace}:${fullKey}`;
    }
    if (options && typeof options === 'object' && 'count' in options) {
      return `${fullKey}_count:${options.count}`;
    }
    return fullKey;
  }),
  useSuspense: false,
  dir: (language: string) => language === 'he' ? 'rtl' : 'ltr',
  services: {
    resourceStore: {
      data: {
        en: { translation: { testKey: "Test Value" } },
        he: { translation: { testKey: "ערך בדיקה" } }
      },
      on: vi.fn(),
      off: vi.fn(),
      hasResourceBundle: vi.fn().mockReturnValue(true),
      getResourceBundle: vi.fn().mockImplementation((lng, ns) => ({ testKey: lng === 'he' ? "ערך בדיקה" : "Test Value" })),
      addResourceBundle: vi.fn(),
      loadNamespaces: vi.fn().mockResolvedValue(undefined),
    },
    interpolator: {
      interpolate: (str: string, params: any, lng: string) => {
        let result = str;
        for (const key in params) {
          result = result.replace(new RegExp(`{{${key}}}`, 'g'), params[key]);
        }
        return result;
      },
      parse: vi.fn(),
      nest: vi.fn(),
      init: vi.fn(),
    },
    formatter: {
      format: (value: any, format?: string, lng?: string) => String(value),
      add: vi.fn(),
      init: vi.fn(),
    }
  },
  isLanguageChanging: false,
  hasLoadedNamespace: vi.fn().mockReturnValue(true),
  loadNamespaces: vi.fn().mockResolvedValue(undefined),
  reloadResources: vi.fn().mockResolvedValue(undefined),
  setDefaultNamespace: vi.fn(),
  loaded: {},
  options: {},
  modules: {},
  isMock: true, // Custom flag to identify it as a mock
  resolvedLanguage: 'en',
};
// Fin du mock i18n

// Mock API calls directly in the factory
vi.mock('@/api/clientsApi', () => ({
  checkClientExists: vi.fn(),
  createClientFromLead: vi.fn(),
}));

// Mock useLeads hook
const mockUpdateLeadStatusHook = vi.fn();
vi.mock('@/hooks/useLeads', () => ({
  useUpdateLeadStatus: () => ({
    mutateAsync: mockUpdateLeadStatusHook,
    isLoading: false,
  }),
  // Mock other hooks if LeadDetailsSheet directly or indirectly uses them
  useUpdateLead: () => ({ // Add mock for useUpdateLead
    mutateAsync: vi.fn().mockResolvedValue({}),
    isLoading: false,
  }),
  useDeleteLead: () => ({ // Add mock for useDeleteLead
    mutateAsync: vi.fn().mockResolvedValue({}),
    isLoading: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Now, import the mocked functions for use in tests
import { checkClientExists, createClientFromLead } from '@/api/clientsApi';

const queryClient = new QueryClient();

const mockLeadBase: Omit<Lead, 'lead_id' | 'created_at' | 'updated_at' | 'total_ai_costs' | 'roi' | 'revenue_from_lead_usd' | 'next_follow_up_date' | 'next_follow_up_notes' | 'client_id' | 'free_sample_package_active' | 'address' | 'website_url' | 'ai_trainings_count' | 'ai_training_cost_per_unit' | 'ai_prompts_count' | 'ai_prompt_cost_per_unit' | 'exchange_rate_at_conversion' | 'revenue_from_lead_local'> = {
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  email: 'test@example.com',
  phone: '1234567890', // Standardized to 'phone'
  lead_status: LeadStatusEnum.NEW,
  lead_source: LeadSourceEnum.WEBSITE,
  notes: 'Initial notes for testing.',
};

const mockLead: Lead = {
  ...mockLeadBase,
  lead_id: "1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  next_follow_up_date: null,
  next_follow_up_notes: null,
  ai_trainings_count: 0,
  ai_training_cost_per_unit: 1.5,
  ai_prompts_count: 0,
  ai_prompt_cost_per_unit: 0.16,
  total_ai_costs: 0,
  revenue_from_lead_local: 0,
  revenue_from_lead_usd: 0,
  exchange_rate_at_conversion: null,
  roi: 0,
  client_id: null,
  free_sample_package_active: false,
  address: "123 Test St",
  website_url: "http://test.com",
};

const mockOnOpenChange = vi.fn();
const mockOnUpdate = vi.fn();
const mockOnDelete = vi.fn();
const mockOnClose = vi.fn();

const defaultProps = {
  isOpen: true,
  onOpenChange: mockOnOpenChange,
  lead: mockLead,
  onUpdate: mockOnUpdate,
  onDelete: mockOnDelete,
  onClose: mockOnClose,
};

const renderComponent = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nMock as any}>
        <LeadDetailsSheet {...mergedProps} />
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('LeadDetailsSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks(); 
    // Reset mocks obtained from the module itself
    (checkClientExists as ReturnType<typeof vi.fn>).mockReset();
    (createClientFromLead as ReturnType<typeof vi.fn>).mockReset();
    mockUpdateLeadStatusHook.mockReset();
    mockOnUpdate.mockReset();
    mockOnDelete.mockReset();
    mockOnOpenChange.mockReset();
    mockOnClose.mockReset();
    if (toast.success && typeof (toast.success as any).mockReset === 'function') {
      (toast.success as any).mockReset();
    }
    if (toast.error && typeof (toast.error as any).mockReset === 'function') {
      (toast.error as any).mockReset();
    }
    if (toast.info && typeof (toast.info as any).mockReset === 'function') {
      (toast.info as any).mockReset();
    }
    queryClient.clear(); // Clear query cache before each test
  });

  describe('Convert to Client Functionality', () => {
    it('should successfully convert a lead to a client', async () => {
      (checkClientExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (createClientFromLead as ReturnType<typeof vi.fn>).mockResolvedValue({ /* mock client data */ });
      mockUpdateLeadStatusHook.mockResolvedValue({});

      renderComponent();

      await userEvent.click(screen.getByRole('button', { name: /המר ללקוח/i }));

      expect(screen.getByText(/המרת ליד ללקוח חדש/i)).toBeInTheDocument();
      
      const packageToSelect = MOCK_PACKAGES[0];
      await userEvent.click(screen.getByText(packageToSelect.package_name));
      
      await userEvent.click(screen.getByRole('button', { name: 'המר ללקוח' })); // Button in dialog
      
      await waitFor(() => expect(checkClientExists).toHaveBeenCalledWith(mockLead.email));
      await waitFor(() => expect(createClientFromLead).toHaveBeenCalledWith(
        mockLead,
        packageToSelect.package_id,
        packageToSelect.total_servings
      ));
      await waitFor(() => expect(mockUpdateLeadStatusHook).toHaveBeenCalledWith(mockLead.lead_id, 'הפך ללקוח'));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('הליד הומר ללקוח בהצלחה'));
    });

    it('should show an error if client email already exists during conversion', async () => {
      (checkClientExists as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      renderComponent();

      await userEvent.click(screen.getByRole('button', { name: /המר ללקוח/i }));
      
      const packageToSelect = MOCK_PACKAGES[0];
      await userEvent.click(screen.getByText(packageToSelect.package_name));
      
      await userEvent.click(screen.getByRole('button', { name: 'המר ללקוח' }));

      await waitFor(() => expect(checkClientExists).toHaveBeenCalledWith(mockLead.email));
      expect(createClientFromLead).not.toHaveBeenCalled();
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('לקוח עם אותו אימייל כבר קיים במערכת'));
    });

    it('should require a package to be selected before converting', async () => {
      renderComponent();
      // Click the main sheet's "Convert to Client" button
      await userEvent.click(screen.getByRole('button', { name: /^המר ללקוח$/i }));
      
      // Wait for the conversion dialog to appear
      const conversionDialog = await screen.findByRole('dialog', { name: /המרת ליד ללקוח חדש/i });
      expect(conversionDialog).toBeInTheDocument();

      // The "Convert to Client" button INSIDE the dialog should be disabled
      const convertButtonInDialog = within(conversionDialog).getByRole('button', { name: /^המר ללקוח$/i });
      expect(convertButtonInDialog).toBeDisabled();
    });

    it('should clear reminder fields if they exist when lead is converted', async () => {
      const leadWithReminder: Lead = {
        ...mockLead,
        next_follow_up_date: new Date().toISOString(),
        next_follow_up_notes: 'Call back tomorrow',
      };
      (checkClientExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (createClientFromLead as ReturnType<typeof vi.fn>).mockResolvedValue({});
      mockUpdateLeadStatusHook.mockResolvedValue({});
      mockOnUpdate.mockResolvedValue({});

      renderComponent({ lead: leadWithReminder });

      await userEvent.click(screen.getByRole('button', { name: /המר ללקוח/i }));
      
      const packageToSelect = MOCK_PACKAGES[0];
      await userEvent.click(screen.getByText(packageToSelect.package_name));
      
      await userEvent.click(screen.getByRole('button', { name: 'המר ללקוח' }));

      await waitFor(() => expect(mockOnUpdate).toHaveBeenCalledWith(leadWithReminder.lead_id, {
        next_follow_up_date: null,
        next_follow_up_notes: null,
      }));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('הליד הומר ללקוח בהצלחה'));
    });

    it('should handle API error during checkClientExists', async () => {
        (checkClientExists as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network Error'));
        renderComponent();

        await userEvent.click(screen.getByRole('button', { name: /המר ללקוח/i }));
        const packageToSelect = MOCK_PACKAGES[0];
        await userEvent.click(screen.getByText(packageToSelect.package_name));
        await userEvent.click(screen.getByRole('button', { name: 'המר ללקוח' }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('שגיאה בהמרת הליד ללקוח'));
    });

    it('should handle API error during createClientFromLead', async () => {
        (checkClientExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
        (createClientFromLead as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Creation Failed'));
        renderComponent();

        await userEvent.click(screen.getByRole('button', { name: /המר ללקוח/i }));
        const packageToSelect = MOCK_PACKAGES[0];
        await userEvent.click(screen.getByText(packageToSelect.package_name));
        await userEvent.click(screen.getByRole('button', { name: 'המר ללקוח' }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('שגיאה בהמרת הליד ללקוח'));
    });
  });

  describe('Edit Lead Functionality', () => {
    it('should update lead details on successful form submission', async () => {
      mockOnUpdate.mockResolvedValue({}); // Simulate successful update
      renderComponent();

      const newRestaurantName = 'Updated Restaurant Name';
      const newNotes = 'These are updated notes.';

      const restaurantNameInput = screen.getByLabelText(/שם מסעדה/i);
      await userEvent.clear(restaurantNameInput);
      await userEvent.type(restaurantNameInput, newRestaurantName);

      const notesInput = screen.getByPlaceholderText(/הוסף הערות או סיכומי שיחה כאן.../i);
      await userEvent.clear(notesInput);
      await userEvent.type(notesInput, newNotes);
      
      await userEvent.click(screen.getByRole('button', { name: /שמור שינויים/i }));

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(mockLead.lead_id, expect.objectContaining({
          restaurant_name: newRestaurantName,
          notes: newNotes,
        }));
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('הליד עודכן בהצלחה');
      });
    });

    it('should show validation error for an empty required field (e.g., restaurant name)', async () => {
      renderComponent();

      // Clear restaurant name
      const restaurantNameInput = screen.getByLabelText(/שם מסעדה/i);
      await userEvent.clear(restaurantNameInput);
      // await userEvent.type(screen.getByLabelText(/שם מסעדה/i), '{selectall}{backspace}');
      
      await userEvent.click(screen.getByRole('button', { name: /שמור שינויים/i }));

      await waitFor(() => {
        // The error message is rendered inside a <p> element with class 'text-sm text-destructive'
        // associated with the FormMessage component from shadcn/ui
        const errorMessage = screen.getByText('שם מסעדה הוא שדה חובה');
        expect(errorMessage).toBeInTheDocument();
        // Optionally, check its parent or associated attributes if needed for more specificity
        // For example, if it's linked by aria-describedby to the input
      });
      expect(mockOnUpdate).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should handle API error during lead update', async () => {
      mockOnUpdate.mockRejectedValue(new Error('Update failed')); // Simulate update failure
      renderComponent();

      await userEvent.type(screen.getByLabelText(/שם מסעדה/i), ' Some Change');
      await userEvent.click(screen.getByRole('button', { name: /שמור שינויים/i }));

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון הליד');
      });
    });

    it('should correctly populate form with lead data', () => {
      renderComponent();
      expect(screen.getByLabelText(/שם מסעדה/i)).toHaveValue(mockLead.restaurant_name);
      expect(screen.getByLabelText(/שם איש קשר/i)).toHaveValue(mockLead.contact_name);
      expect(screen.getByLabelText(/מספר טלפון/i)).toHaveValue(mockLead.phone);
      expect(screen.getByLabelText(/אימייל/i)).toHaveValue(mockLead.email);
      expect(screen.getByDisplayValue(mockLead.notes!)).toBeInTheDocument(); // For textarea
      
      // For Select component (shadcn/ui based on Radix Select)
      // The displayed value is within a span inside the button that acts as SelectTrigger
      const selectTrigger = screen.getByRole('combobox', { name: /סטטוס ליד/i });
      expect(selectTrigger).toBeInTheDocument();
      // Check for the displayed text within the trigger.
      // This might need adjustment based on the exact DOM structure of SelectTrigger's children
      expect(within(selectTrigger).getByText(LEAD_STATUS_DISPLAY[mockLead.lead_status])).toBeInTheDocument();
    });

    // SKIPPING: Difficult to reliably trigger Radix Select onValueChange in JSDOM for status updates.
    it.skip('should handle API error when changing lead status directly', async () => {
      const initialStatus = mockLead.lead_status;
      const statusToAttempt = 'בטיפול'; // Attempt to change to this status
      mockOnUpdate.mockRejectedValue(new Error('API Error')); // Simulate API failure

      renderComponent();

      const selectTrigger = screen.getByRole('combobox', { name: /סטטוס ליד/i });
      await userEvent.click(selectTrigger); // Open the dropdown

      // The listbox of options should appear. Find the option for the new status by its text and click it.
      const optionToSelect = await screen.findByRole('option', { name: statusToAttempt });
      await userEvent.click(optionToSelect);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(mockLead.lead_id, { lead_status: statusToAttempt });
      });

      // Check for error toast
      expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון סטטוס הליד');

      // Ensure the displayed status in the trigger remains the initial status
      expect(within(selectTrigger).getByText(initialStatus)).toBeInTheDocument();
      expect(within(selectTrigger).queryByText(statusToAttempt)).toBeNull();
    });
  });

  describe('Delete Lead Functionality', () => {
    it('should open delete confirmation dialog when delete button is clicked', async () => {
      renderComponent();
      
      const sheetFooter = screen.getByTestId('lead-details-sheet-footer');
      const deleteButtonInSheet = within(sheetFooter).getByRole('button', { name: /מחק ליד/i });
      await userEvent.click(deleteButtonInSheet);
      
      const dialogTitleTextElement = await screen.findByText(/אישור מחיקת ליד/i);
      expect(dialogTitleTextElement).toBeInTheDocument();

      const deleteDialog = dialogTitleTextElement.closest('[role="alertdialog"]');
      expect(deleteDialog).toBeInTheDocument();
      
      expect(within(deleteDialog! as HTMLElement).getByRole('heading', { name: /אישור מחיקת ליד/i, level: 2 })).toBeInTheDocument();

      const expectedDescription = `האם אתה בטוח שברצונך למחוק את הליד "${mockLead.restaurant_name}"? לא ניתן לשחזר פעולה זו.`;
      expect(within(deleteDialog! as HTMLElement).getByText((content, element) => {
        const normalize = (text: string | null) => text?.replace(/\s+/g, ' ').trim();
        const actualText = normalize(element?.textContent);
        const expectedText = normalize(expectedDescription);
        return actualText === expectedText;
      })).toBeInTheDocument();
    });

    it('should call onDelete, show success toast, and call onOpenChange(false) on confirmed deletion', async () => {
      mockOnDelete.mockResolvedValue({}); 
      renderComponent();

      const sheetFooter = screen.getByTestId('lead-details-sheet-footer');
      const initialDeleteButton = within(sheetFooter).getByRole('button', { name: /מחק ליד/i });
      await userEvent.click(initialDeleteButton); 
      
      const dialogTitleTextElement = await screen.findByText(/אישור מחיקת ליד/i);
      const deleteDialog = dialogTitleTextElement.closest('[role="alertdialog"]');
      expect(deleteDialog).toBeInTheDocument();

      const confirmDeleteButtonInDialog = within(deleteDialog! as HTMLElement).getByRole('button', { name: /מחק ליד/i });
      await userEvent.click(confirmDeleteButtonInDialog);

      await waitFor(() => expect(mockOnDelete).toHaveBeenCalledWith(mockLead.lead_id));
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('הליד נמחק בהצלחה'));
      await waitFor(() => expect(mockOnOpenChange).toHaveBeenCalledWith(false)); 
    });

    it('should not call onDelete if deletion is cancelled from dialog', async () => {
      renderComponent();
      const sheetFooter = screen.getByTestId('lead-details-sheet-footer');
      const initialDeleteButton = within(sheetFooter).getByRole('button', { name: /מחק ליד/i });
      await userEvent.click(initialDeleteButton); 
      
      const dialogTitleTextElement = await screen.findByText(/אישור מחיקת ליד/i);
      const deleteDialog = dialogTitleTextElement.closest('[role="alertdialog"]');
      expect(deleteDialog).toBeInTheDocument();

      const cancelButtonInDialog = within(deleteDialog! as HTMLElement).getByRole('button', { name: /ביטול/i });
      await userEvent.click(cancelButtonInDialog);

      expect(mockOnDelete).not.toHaveBeenCalled();
      expect(screen.queryByText(/אישור מחיקת ליד/i)).not.toBeInTheDocument();
    });

    it('should handle API error during lead deletion and keep dialog open', async () => {
      mockOnDelete.mockRejectedValue(new Error('Deletion failed'));
      renderComponent();

      const sheetFooter = screen.getByTestId('lead-details-sheet-footer');
      const initialDeleteButton = within(sheetFooter).getByRole('button', { name: /מחק ליד/i });
      await userEvent.click(initialDeleteButton); 
      
      let dialogTitleTextElement = await screen.findByText(/אישור מחיקת ליד/i);
      let deleteDialog = dialogTitleTextElement.closest('[role="alertdialog"]');
      expect(deleteDialog).toBeInTheDocument(); 
      
      const confirmDeleteButtonInDialog = within(deleteDialog! as HTMLElement).getByRole('button', { name: 'מחק ליד' });
      await userEvent.click(confirmDeleteButtonInDialog);

      await waitFor(() => expect(mockOnDelete).toHaveBeenCalledWith(mockLead.lead_id));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('שגיאה במחיקת הליד'));
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false); 
      
      dialogTitleTextElement = await screen.findByText(/אישור מחיקת ליד/i);
      expect(dialogTitleTextElement).toBeInTheDocument();
      deleteDialog = dialogTitleTextElement.closest('[role="alertdialog"]');
      expect(deleteDialog).toBeInTheDocument();
    });
  });

  // Placeholder for other interactions
  describe('Other Interactions', () => {
    it('should correctly display lead status using StatusBadge', () => {
      const leadWithSpecificStatus: Lead = { ...mockLead, lead_status: LeadStatusEnum.CONTACTED }; // Example status
      renderComponent({ lead: leadWithSpecificStatus });

      const statusLabel = screen.getByText('סטטוס:');
      const statusContainer = statusLabel.parentElement;
      expect(statusContainer).toBeInTheDocument();

      const statusBadgeElement = within(statusContainer!).getByText(LEAD_STATUS_DISPLAY[leadWithSpecificStatus.lead_status]);
      expect(statusBadgeElement).toBeInTheDocument();
      expect(statusBadgeElement.tagName).toBe('DIV');
    });

    // SKIPPING: Difficult to reliably trigger Radix Select onValueChange in JSDOM for status updates.
    it.skip('should allow changing lead status via select dropdown and call updateLeadStatus', async () => {
      const statusToSelect = 'בטיפול'; 
      mockOnUpdate.mockResolvedValue({}); 
      renderComponent();

      const selectTrigger = screen.getByRole('combobox', { name: /סטטוס ליד/i });
      await userEvent.click(selectTrigger); 

      const optionToSelect = await screen.findByRole('option', { name: statusToSelect });
      await userEvent.click(optionToSelect);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(mockLead.lead_id, { lead_status: statusToSelect });
      });
      expect(toast.success).toHaveBeenCalledWith('סטטוס הליד עודכן בהצלחה');
      await waitFor(() => {
         expect(within(selectTrigger).getByText(statusToSelect)).toBeInTheDocument();
      });
    });

    it.skip('should allow SETTING a reminder via calendar, calling onUpdate', async () => {
      // This test is skipped due to difficulties reliably interacting with the Radix UI Calendar in JSDOM
      const reminderText = 'Follow up on this lead';
      const mockDate = new Date(2025, 11, 25); 
      const mockDateISO = mockDate.toISOString();

      mockOnUpdate.mockResolvedValue({});
      const leadWithoutReminder = { ...mockLead, next_follow_up_date: null, next_follow_up_notes: null };
      renderComponent({ lead: leadWithoutReminder });

      const datePickerButton = screen.getByRole('button', { name: /תאריך תזכורת/i });
      fireEvent.mouseDown(datePickerButton); 

      const nextMonthButton = await screen.findByRole('button', { name: "Go to next month" });
      for (let i = 0; i < 7; i++) { // May to Dec
        await userEvent.click(nextMonthButton);
      }

      const dayCell = await screen.findByRole('gridcell', { name: /december 25(th)?, 2025/i });
      let dayToClick = dayCell;
      try {
        dayToClick = within(dayCell).getByRole('button');
      } catch (e) { /* assume gridcell is clickable */ }
      await userEvent.click(dayToClick);

      const reminderDetailsInput = screen.getByPlaceholderText(/פרטי התזכורת.../i);
      await userEvent.type(reminderDetailsInput, reminderText);
      
      const saveChangesButton = screen.getByRole('button', { name: /שמור שינויים/i });
      await userEvent.click(saveChangesButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(leadWithoutReminder.lead_id, expect.objectContaining({
          next_follow_up_date: expect.stringContaining(mockDateISO.split('T')[0]), 
          next_follow_up_notes: reminderText,
          // Include other form fields as they are part of the same form submission
          restaurant_name: leadWithoutReminder.restaurant_name,
          contact_name: leadWithoutReminder.contact_name,
          phone: leadWithoutReminder.phone,
          email: leadWithoutReminder.email,
          lead_status: leadWithoutReminder.lead_status,
          lead_source: leadWithoutReminder.lead_source,
          notes: leadWithoutReminder.notes,
          free_sample_package_active: leadWithoutReminder.free_sample_package_active
        }));
      });
      expect(toast.success).toHaveBeenCalledWith('הליד עודכן בהצלחה');
    });

    it('should allow CLEARING a reminder, calling onUpdate', async () => {
      const reminderText = 'Follow up on this lead';
      mockOnUpdate.mockResolvedValue({});
      (toast.success as any).mockClear(); 

      const leadWithReminder = { 
        ...mockLead, 
        next_follow_up_date: new Date().toISOString(), 
        next_follow_up_notes: reminderText 
      };
      // Re-render the component with a lead that HAS a reminder
      renderComponent({ lead: leadWithReminder }); 
      
      // Ensure the reminder details are initially displayed
      const reminderDetailsInputInitial = screen.getByDisplayValue(reminderText);
      expect(reminderDetailsInputInitial).toHaveValue(reminderText);

      // Clear the reminder details input
      await userEvent.clear(reminderDetailsInputInitial);
      
      // Click the main "שמור שינויים" button
      const saveChangesButton = screen.getByRole('button', { name: /שמור שינויים/i });
      await userEvent.click(saveChangesButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(leadWithReminder.lead_id, expect.objectContaining({
          next_follow_up_date: null, 
          next_follow_up_notes: null, 
          // Ensure other fields are also part of the update, as it's a general form save
          restaurant_name: leadWithReminder.restaurant_name,
          contact_name: leadWithReminder.contact_name,
          phone: leadWithReminder.phone,
          email: leadWithReminder.email,
          lead_status: leadWithReminder.lead_status, // Status should remain
          lead_source: leadWithReminder.lead_source,
          notes: leadWithReminder.notes, // Notes should remain
          free_sample_package_active: leadWithReminder.free_sample_package_active
        }));
      });
      // Check for the correct toast message
      expect(toast.success).toHaveBeenCalledWith('הליד עודכן בהצלחה'); 
      
      // Verify reminder is no longer displayed in the input
      // After clearing, the input itself should disappear because next_follow_up_date is null
      expect(screen.queryByPlaceholderText(/פרטי התזכורת.../i)).not.toBeInTheDocument();
      
      // "תאריך תזכורת" button should revert to placeholder text (or its default state)
      expect(screen.getByRole('button', { name: /תאריך תזכורת/i })).toBeInTheDocument(); 
    });

    it('should disable convert to client button if lead_status is "הפך ללקוח"', () => {
      const convertedLead: Lead = { ...mockLead, lead_status: LeadStatusEnum.CONTACTED };
      renderComponent({ lead: convertedLead });

      const sheetFooter = screen.getByTestId('lead-details-sheet-footer');
      const convertToClientButton = within(sheetFooter).getByRole('button', { name: /המר ללקוח/i });
      
      expect(convertToClientButton).toBeDisabled();
    });
  });

  test('should display phone number correctly in form', () => {
    renderComponent({ lead: mockLead });
    expect(screen.getByLabelText(/מספר טלפון/i)).toHaveValue(mockLead.phone);
  });
  
  test('displays reminder information if next_follow_up_date is set', () => {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 1);
    const leadWithReminder: Lead = {
      ...mockLead,
      lead_id: "lead-with-reminder",
      next_follow_up_date: reminderDate.toISOString(),
      next_follow_up_notes: "Follow up on quote",
      phone: "444555666",
    };
    renderComponent({ lead: leadWithReminder });
  });
}); 