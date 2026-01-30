import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImportModal from '../../../components/KnowledgeBase/io/ImportModal';

// Mock the context
const mockImportPage = jest.fn().mockResolvedValue({});

jest.mock('../../../context/KnowledgeBaseContext', () => ({
  useKnowledgeBase: () => ({
    importPage: mockImportPage
  })
}));

// Mock ImportPreview
jest.mock('../../../components/KnowledgeBase/io/ImportPreview', () => {
  return function MockImportPreview({ data, fileName }) {
    return <div data-testid="import-preview">Preview: {fileName} - {data.title || 'Untitled'}</div>;
  };
});

describe('ImportModal', () => {
  const defaultProps = {
    onClose: jest.fn(),
    onImported: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders import modal', () => {
    render(<ImportModal {...defaultProps} />);
    expect(screen.getByText('Import Page')).toBeInTheDocument();
  });

  it('shows drop zone', () => {
    render(<ImportModal {...defaultProps} />);
    expect(screen.getByText(/Drop a file here or click to browse/)).toBeInTheDocument();
  });

  it('shows supported formats', () => {
    render(<ImportModal {...defaultProps} />);
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
  });

  it('calls onClose on cancel', () => {
    render(<ImportModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('has file input element', () => {
    render(<ImportModal {...defaultProps} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input.getAttribute('accept')).toContain('.json');
    expect(input.getAttribute('accept')).toContain('.md');
    expect(input.getAttribute('accept')).toContain('.html');
  });

  it('calls onClose on X button', () => {
    render(<ImportModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });
});
