import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ParagraphBlock from '../../../components/KnowledgeBase/blocks/ParagraphBlock';

describe('ParagraphBlock', () => {
  it('renders markdown content correctly', () => {
    render(<ParagraphBlock content="Hello **world**" />);
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('renders with empty content - returns null', () => {
    const { container } = render(<ParagraphBlock content="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null content', () => {
    const { container } = render(<ParagraphBlock content={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders links correctly', () => {
    render(<ParagraphBlock content="Check [this link](https://example.com)" />);
    const link = screen.getByRole('link', { name: 'this link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders inline code', () => {
    render(<ParagraphBlock content="Use `console.log()` for debugging" />);
    expect(screen.getByText('console.log()')).toBeInTheDocument();
  });

  it('renders editing mode with textarea', () => {
    render(<ParagraphBlock content="Edit me" isEditing={true} />);
    const textarea = screen.getByPlaceholderText('Write something...');
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe('Edit me');
  });

  it('calls onUpdate when editing', () => {
    const onUpdate = jest.fn();
    render(<ParagraphBlock content="Edit me" isEditing={true} onUpdate={onUpdate} />);
    const textarea = screen.getByPlaceholderText('Write something...');
    fireEvent.change(textarea, { target: { value: 'Updated' } });
    expect(onUpdate).toHaveBeenCalledWith('Updated');
  });

  it('supports bold and italic text', () => {
    render(<ParagraphBlock content="**bold** and *italic*" />);
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
  });
});
