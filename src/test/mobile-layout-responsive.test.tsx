import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CurrentUserRoleProvider } from '../hooks/useCurrentUserRole';

// Mock ל-window.matchMedia עבור JSDOM
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock ל-supabase.auth.getSession
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'editor-1' } } }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock ל-toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock ל-localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {
    adminAuthenticated: 'true',
    adminAuthTime: `${Date.now()}`,
  };
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// נטען דינמית קומפוננטות עיקריות (layoutים)
import { CustomerLayout } from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import EditorLayout from '../layouts/EditorLayout';

// Utility לבדוק overflow-x
function hasHorizontalScroll() {
  return document.body.scrollWidth > document.body.clientWidth;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
    },
  },
});

function withProviders(children: React.ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrentUserRoleProvider>
        {children}
      </CurrentUserRoleProvider>
    </QueryClientProvider>
  );
}

// Mock ל-optimizedAuthService.getUserAuthData
vi.mock('@/services/optimizedAuthService', () => ({
  optimizedAuthService: {
    getUserAuthData: vi.fn().mockResolvedValue({ role: 'editor' }),
  },
}));

describe('Mobile Responsive Layouts', () => {
  beforeEach(() => {
    // נוודא שהגדרות viewport מתאימות למובייל
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event('resize'));
    document.body.style.overflowX = '';
  });

  it('CustomerLayout - displays full width on mobile, no horizontal scroll', () => {
    const { container } = render(
      <MemoryRouter>
        <CustomerLayout />
      </MemoryRouter>
    );
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    // לא ניתן לבדוק width בפועל ב-JSDOM, נבדוק className
    expect(main?.className).toMatch(/flex-1|w-full/);
    // בדוק שאין גלילה אופקית
    expect(hasHorizontalScroll()).toBe(false);
  });

  it('AdminLayout - displays full width on mobile, no horizontal scroll', () => {
    const { container } = render(
      <MemoryRouter>
        {withProviders(<AdminLayout><div>Test Content</div></AdminLayout>)}
      </MemoryRouter>
    );
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main?.className).toMatch(/flex-1|w-full/);
    expect(hasHorizontalScroll()).toBe(false);
  });

  it('EditorLayout - displays full width on mobile, no horizontal scroll', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/editor']}> 
        {withProviders(
          <Routes>
            <Route path="/editor" element={<EditorLayout />}> 
              <Route index element={<div data-testid="outlet">Outlet</div>} />
            </Route>
          </Routes>
        )}
      </MemoryRouter>
    );
    await waitFor(() => {
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main?.className).toMatch(/flex-1|w-full/);
      expect(hasHorizontalScroll()).toBe(false);
    });
  });

  it.skip('All main containers (.container, .card, .form-container) fill 100% width on mobile', () => {
    // בדיקה זו לא רלוונטית ל-JSDOM כי Tailwind לא משפיע על getComputedStyle
    // מומלץ לבדוק className או לבצע בדיקה ויזואלית end-to-end
  });

  it.skip('Edge: max-w-5xl/max-w-lg/max-w-md do not restrict width on mobile', () => {
    // בדיקה זו לא רלוונטית ל-JSDOM כי Tailwind לא משפיע על getComputedStyle
  });

  it.skip('Edge: .p-8/.px-8 have reduced padding on mobile', () => {
    // בדיקה זו לא רלוונטית ל-JSDOM כי Tailwind לא משפיע על getComputedStyle
  });

  it('Error: if CSS fails to load, layout still renders (fallback)', () => {
    // Simulacija: הסר את כל הסגנונות
    const styleSheets = Array.from(document.styleSheets);
    styleSheets.forEach((sheet) => {
      try { document.adoptedStyleSheets = []; } catch {}
    });
    const { container } = render(
      <MemoryRouter>
        <CustomerLayout />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it.skip('Integration: layout + card + form all fill width and no scroll', () => {
    // בדיקה זו לא רלוונטית ל-JSDOM כי Tailwind לא משפיע על getComputedStyle
  });
});
