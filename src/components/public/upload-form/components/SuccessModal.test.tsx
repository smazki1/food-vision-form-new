import { render, screen, fireEvent } from '@testing-library/react';
import SuccessModal from './SuccessModal';
import React from 'react';

// Mock Lucide icons - simplified
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    CheckCircle: (props: any) => <svg data-testid="check-icon" {...props} />,
    // X can be mocked generically if needed for other tests, or not at all if only this specific button matters
    X: (props: any) => <svg {...props} />, // Simple mock for X, no specific test-id needed here
    Plus: (props: any) => <svg {...props} />, // Mock for Plus icon
  };
});

describe('SuccessModal', () => {
  const mockOnClose = vi.fn();
  const mockOnNewSubmission = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<SuccessModal isOpen={false} onClose={mockOnClose} onNewSubmission={mockOnNewSubmission} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<SuccessModal isOpen={true} onClose={mockOnClose} onNewSubmission={mockOnNewSubmission} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.getByText('תודה רבה!')).toBeInTheDocument();
    expect(screen.getByText('הפרטים נשלחו בהצלחה. נחזור אליכם בהקדם עם התמונות המעוצבות.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'העלאת מנה נוספת' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'סגור' })).toBeInTheDocument();
  });

  it('calls onNewSubmission when "העלאת מנה נוספת" button is clicked', () => {
    render(<SuccessModal isOpen={true} onClose={mockOnClose} onNewSubmission={mockOnNewSubmission} />);
    fireEvent.click(screen.getByRole('button', { name: 'העלאת מנה נוספת' }));
    expect(mockOnNewSubmission).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when "סגור" button is clicked', () => {
    render(<SuccessModal isOpen={true} onClose={mockOnClose} onNewSubmission={mockOnNewSubmission} />);
    fireEvent.click(screen.getByRole('button', { name: 'סגור' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button (X icon) in the dialog is clicked', () => {
    render(<SuccessModal isOpen={true} onClose={mockOnClose} onNewSubmission={mockOnNewSubmission} />);
    // Use getByLabelText to find the button with the specific aria-label
    const closeButton = screen.getByLabelText('Close success modal'); 
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Optional: Test for accessibility attributes if Dialog from Radix UI is used (e.g., aria-modal, role)
  // it('has correct accessibility attributes when open', () => {
  //   render(<SuccessModal isOpen={true} onClose={mockOnClose} onNewSubmission={mockOnNewSubmission} />);
  //   const dialog = screen.getByRole('dialog');
  //   expect(dialog).toHaveAttribute('aria-modal', 'true');
  // });
}); 