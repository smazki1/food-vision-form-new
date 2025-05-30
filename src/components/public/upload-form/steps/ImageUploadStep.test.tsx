import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUploadStep from './ImageUploadStep';
import { NewItemFormProvider, useNewItemForm } from '@/contexts/NewItemFormContext';
import React from 'react';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

const mockSetExternalErrors = vi.fn();
const mockClearExternalErrors = vi.fn();

const renderWithFormProvider = (ui: React.ReactElement) => {
  return render(
    <NewItemFormProvider>
      {ui}
    </NewItemFormProvider>
  );
};

describe('ImageUploadStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:http://localhost/mock-object-url'); // Default mock value
  });

  it('renders the dropzone component', () => {
    renderWithFormProvider(<ImageUploadStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    expect(screen.getByText(/לחצו כאן להעלאת תמונות/i)).toBeInTheDocument();
    expect(screen.getByText(/או גררו תמונות לכאן/i)).toBeInTheDocument();
  });

  it('updates formData in context when files are added via dropzone', async () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <ImageUploadStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);

    const file1 = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    const file2 = new File(['(ノಠ益ಠ)ノ彡┻━┻'], 'tableflip.jpg', { type: 'image/jpeg' });

    const dropzone = screen.getByTestId('dropzone-area'); // Assuming the dropzone root has this test-id or a similar one

    // userEvent.upload is good for input type=file, for react-dropzone, direct fireEvent might be needed or a more complex setup
    // For react-dropzone, we typically need to dispatch 'drop' event with dataTransfer object.
    
    // Simulate dropping files
    const dataTransfer = {
      files: [file1, file2],
      items: [{ kind: 'file', type: file1.type, getAsFile: () => file1 }, { kind: 'file', type: file2.type, getAsFile: () => file2 }],
      types: ['Files'],
    };

    fireEvent.drop(dropzone, { dataTransfer });

    await waitFor(() => {
        expect(capturedFormData.referenceImages).toHaveLength(2);
        expect(capturedFormData.referenceImages[0].name).toBe('chucknorris.png');
        expect(capturedFormData.referenceImages[1].name).toBe('tableflip.jpg');
    });
  });

  it('displays uploaded image previews and allows removal', async () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <ImageUploadStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);

    const file = new File(['preview'], 'preview.png', { type: 'image/png' });
    const dropzone = screen.getByTestId('dropzone-area');
    fireEvent.drop(dropzone, { dataTransfer: { files: [file], items: [{ kind: 'file', type: file.type, getAsFile: () => file }], types: ['Files'] } });

    await waitFor(() => {
      expect(screen.getByAltText('תמונה 1')).toBeInTheDocument(); // Updated alt text
    });

    // Find and click the remove button (assuming it has a role or specific text/testid)
    // This selector will depend on how the remove button is implemented in ImagePreview
    const removeButton = await screen.findByRole('button', { name: /הסר/i }); // Or a more specific selector
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(capturedFormData.referenceImages).toHaveLength(0);
      expect(screen.queryByAltText('תמונה 1')).not.toBeInTheDocument(); // Updated alt text
    });
  });

  it('displays error message for referenceImages when passed in props', () => {
    const errors = { referenceImages: 'יש להעלות לפחות תמונה אחת' };
    renderWithFormProvider(<ImageUploadStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={errors} />);
    expect(screen.getByText(errors.referenceImages)).toBeInTheDocument();
  });
  
  it('pre-fills with existing images from context and allows adding more', async () => {
    const initialFile = new File(['initial'], 'initial.png', { type: 'image/png' });
    
    const WrapperComponent = ({children}: {children: React.ReactNode}) => {
      const { updateFormData } = useNewItemForm();
      React.useEffect(() => {
        updateFormData({ referenceImages: [initialFile] });
      }, [updateFormData]);
      return <>{children}</>;
    }

    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <ImageUploadStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };

    render(
      <NewItemFormProvider>
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      </NewItemFormProvider>
    );

    await waitFor(() => {
      expect(screen.getByAltText('תמונה 1')).toBeInTheDocument(); // Updated: Assuming initial file is the first image
      expect(capturedFormData.referenceImages).toHaveLength(1);
    });

    // Add a new file
    const newFile = new File(['new'], 'new.jpg', { type: 'image/jpeg' });
    const dropzone = screen.getByTestId('dropzone-area');
    fireEvent.drop(dropzone, { dataTransfer: { files: [newFile], items: [{ kind: 'file', type: newFile.type, getAsFile: () => newFile }], types: ['Files'] } });

    await waitFor(() => {
      expect(capturedFormData.referenceImages).toHaveLength(2);
      expect(screen.getByAltText('תמונה 2')).toBeInTheDocument(); // Updated: Assuming new file is the second image
    });
  });

}); 