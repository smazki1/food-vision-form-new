import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UsersPage from '../UsersPage';

// Mock the Supabase clients
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

vi.mock('@/integrations/supabase/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: vi.fn(() => Promise.resolve({ 
          data: { users: [] }, 
          error: null 
        }))
      }
    }
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<UsersPage />, { wrapper: createWrapper() });
    
    expect(screen.getByText('טוען משתמשים...')).toBeInTheDocument();
  });

  it('renders users page content after loading', async () => {
    render(<UsersPage />, { wrapper: createWrapper() });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען משתמשים...')).not.toBeInTheDocument();
    });

    // Check that the main content is rendered
    expect(screen.getByText('ניהול משתמשים')).toBeInTheDocument();
    expect(screen.getByText('ניהול חשבונות משתמשים, יצירת לקוחות חדשים ועריכת פרטים')).toBeInTheDocument();
  });

  it('renders create new customer button after loading', async () => {
    render(<UsersPage />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.queryByText('טוען משתמשים...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('לקוח חדש')).toBeInTheDocument();
  });

  it('renders search and filter section after loading', async () => {
    render(<UsersPage />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.queryByText('טוען משתמשים...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('סינון וחיפוש')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('חיפוש לפי אימייל, שם מסעדה או איש קשר...')).toBeInTheDocument();
  });

  it('renders users table headers after loading', async () => {
    render(<UsersPage />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.queryByText('טוען משתמשים...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('פרטי משתמש')).toBeInTheDocument();
    expect(screen.getByText('תפקיד')).toBeInTheDocument();
    expect(screen.getByText('סטטוס')).toBeInTheDocument();
    expect(screen.getByText('פרטי לקוח')).toBeInTheDocument();
    expect(screen.getByText('תאריך הצטרפות')).toBeInTheDocument();
    expect(screen.getByText('פעולות')).toBeInTheDocument();
  });

  it('renders users table title after loading', async () => {
    render(<UsersPage />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.queryByText('טוען משתמשים...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('רשימת משתמשים')).toBeInTheDocument();
  });
}); 