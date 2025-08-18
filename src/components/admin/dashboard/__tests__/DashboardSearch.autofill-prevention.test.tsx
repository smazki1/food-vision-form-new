import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase client queries used by DashboardSearch
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ or: () => ({ limit: () => ({ data: [] }) }) }),
    }),
  },
}));

import { DashboardSearch } from '@/components/admin/dashboard/DashboardSearch';

describe('DashboardSearch - input autofill prevention', () => {
  it('renders input with autofill-prevention attributes and empty value', async () => {
    render(
      <MemoryRouter>
        <DashboardSearch />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('חיפוש... (Ctrl+K)') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('name', 'dashboard-global-search');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('inputmode', 'search');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input.value).toBe('');

    // Open command dialog and ensure typing works in the CommandInput
    await userEvent.click(input);
    // The CommandInput will appear with placeholder and should accept typing handled internally
    expect(screen.getByPlaceholderText('חיפוש לקוחות, לידים, הגשות...')).toBeInTheDocument();
  });
});


