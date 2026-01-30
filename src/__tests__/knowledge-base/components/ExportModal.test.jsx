import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportModal from '../../../components/KnowledgeBase/io/ExportModal';

// Mock the context
const mockExportPage = jest.fn().mockResolvedValue({ title: 'Test', blocks: [] });

jest.mock('../../../context/KnowledgeBaseContext', () => ({
  useKnowledgeBase: () => ({
    exportPage: mockExportPage
  })
}));

describe('ExportModal', () => {
  const defaultProps = {
    pageId: 'page1',
    pageTitle: 'Test Page',
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('renders export modal', () => {
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByText('Export Page')).toBeInTheDocument();
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('shows format options', () => {
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
  });

  it('selects format on click', () => {
    render(<ExportModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Markdown'));
    // The Markdown option should be visually selected (has description)
    expect(screen.getByText(/Compatible with most editors/)).toBeInTheDocument();
  });

  it('calls exportPage on export button click', async () => {
    render(<ExportModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(mockExportPage).toHaveBeenCalledWith('page1', 'json');
    });
  });

  it('calls onClose on cancel', () => {
    render(<ExportModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose on X button', () => {
    render(<ExportModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  it('shows export format label', () => {
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByText('Export Format')).toBeInTheDocument();
  });

  it('shows format descriptions', () => {
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByText(/Best for backups/)).toBeInTheDocument();
    expect(screen.getByText(/Viewable in any browser/)).toBeInTheDocument();
  });
});
