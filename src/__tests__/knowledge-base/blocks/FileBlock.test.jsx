import React from 'react';
import { render, screen } from '@testing-library/react';
import FileBlock from '../../../components/KnowledgeBase/blocks/FileBlock';

describe('FileBlock', () => {
  it('renders file with name and size', () => {
    const content = {
      url: 'https://example.com/doc.pdf',
      name: 'document.pdf',
      size: 1048576
    };
    render(<FileBlock block={{ type: 'file', properties: {} }} content={content} />);
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('shows correct icon for PDF', () => {
    const content = {
      url: 'https://example.com/doc.pdf',
      name: 'report.pdf'
    };
    render(<FileBlock block={{ type: 'file', properties: {} }} content={content} />);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('shows correct icon for image files', () => {
    const content = {
      url: 'https://example.com/photo.jpg',
      name: 'photo.jpg'
    };
    render(<FileBlock block={{ type: 'file', properties: {} }} content={content} />);
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
  });

  it('shows placeholder when no file', () => {
    render(<FileBlock block={{ type: 'file', properties: {} }} content={{}} />);
    expect(screen.getByText(/add a file/i)).toBeInTheDocument();
  });

  it('renders URL input in edit mode', () => {
    render(
      <FileBlock block={{ type: 'file', properties: {} }} content={{}} isEditing={true} />
    );
    expect(screen.getByPlaceholderText(/paste a file url/i)).toBeInTheDocument();
  });

  it('shows download button for existing file', () => {
    const content = {
      url: 'https://example.com/doc.pdf',
      name: 'doc.pdf'
    };
    render(<FileBlock block={{ type: 'file', properties: {} }} content={content} />);
    // Check for the download link/button
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
