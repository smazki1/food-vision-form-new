import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerUploadForm from '../CustomerUploadForm';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

// Mock hooks
vi.mock('@/hooks/useClientAuth', () => ({
  useClientAuth: () => ({
    clientId: 'test-client-id',
    authenticating: false,
    refreshClientAuth: vi.fn(),
    clientRecordStatus: 'found',
    errorState: null
  })
}));

vi.mock('@/hooks/useClientPackage', () => ({
  useClientPackage: () => ({
    remainingDishes: 5
  })
}));

vi.mock('../hooks/useCustomerFormSubmission', () => ({
  useCustomerFormSubmission: () => ({
    handleSubmit: vi.fn(),
    isSubmitting: false,
    showSuccessModal: false,
    handleCloseSuccessModal: vi.fn()
  })
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NewItemFormProvider>
          {children}
        </NewItemFormProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CustomerUploadForm', () => {
  it('renders upload form with correct title', () => {
    render(
      <TestWrapper>
        <CustomerUploadForm />
      </TestWrapper>
    );

    expect(screen.getByText('העלאת מנות חדשות')).toBeInTheDocument();
    expect(screen.getByText('העלו מנות חדשות לעיבוד במערכת')).toBeInTheDocument();
  });

  it('starts at step 2 (upload details) skipping restaurant details', () => {
    render(
      <TestWrapper>
        <CustomerUploadForm />
      </TestWrapper>
    );

    // Should not show restaurant details step content
    expect(screen.queryByText('פרטי מסעדה')).not.toBeInTheDocument();
    
    // Should show upload step content (using getAllByText since it appears multiple times)
    expect(screen.getAllByText('פרטי העלאה').length).toBeGreaterThan(0);
  });

  it('does not show client creation elements', () => {
    render(
      <TestWrapper>
        <CustomerUploadForm />
      </TestWrapper>
    );

    // Should not show any client creation UI
    expect(screen.queryByText('יצירת לקוח')).not.toBeInTheDocument();
    expect(screen.queryByText('פרטי התקשרות')).not.toBeInTheDocument();
  });

  it('renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <CustomerUploadForm />
        </TestWrapper>
      );
    }).not.toThrow();
  });
}); 