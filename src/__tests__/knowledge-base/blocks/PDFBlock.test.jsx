import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PDFBlock from '../../../components/KnowledgeBase/blocks/PDFBlock';

describe('PDFBlock', () => {
  it('renders placeholder when no URL', () => {
    render(<PDFBlock block={{ type: 'pdf', properties: {} }} content={{}} />);
    expect(screen.getByText(/add a pdf document/i)).toBeInTheDocument();
  });

  it('renders PDF viewer when URL provided', () => {
    const content = { url: 'https://example.com/doc.pdf', title: 'My Document' };
    render(<PDFBlock block={{ type: 'pdf', properties: {} }} content={content} />);
    expect(screen.getByText('My Document')).toBeInTheDocument();
  });

  it('renders download link', () => {
    const content = { url: 'https://example.com/doc.pdf', title: 'Doc' };
    render(<PDFBlock block={{ type: 'pdf', properties: {} }} content={content} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders edit mode with URL input', () => {
    render(
      <PDFBlock
        block={{ type: 'pdf', properties: {} }}
        content={{ url: '' }}
        isEditing={true}
      />
    );
    expect(screen.getByPlaceholderText(/document.pdf/)).toBeInTheDocument();
  });

  it('renders height input in edit mode', () => {
    render(
      <PDFBlock
        block={{ type: 'pdf', properties: {} }}
        content={{ url: '', height: 600 }}
        isEditing={true}
      />
    );
    expect(screen.getByDisplayValue('600')).toBeInTheDocument();
  });

  it('calls onUpdate when URL changes', () => {
    const onUpdate = jest.fn();
    render(
      <PDFBlock
        block={{ type: 'pdf', properties: {} }}
        content={{ url: '' }}
        isEditing={true}
        onUpdate={onUpdate}
      />
    );
    const input = screen.getByPlaceholderText(/document.pdf/);
    fireEvent.change(input, { target: { value: 'https://example.com/new.pdf' } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com/new.pdf' }));
  });
});
