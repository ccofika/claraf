import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalloutBlock from '../../../components/KnowledgeBase/blocks/CalloutBlock';

describe('CalloutBlock', () => {
  const makeBlock = (variant = 'info') => ({
    type: 'callout',
    properties: { variant }
  });

  it('renders info variant correctly', () => {
    render(<CalloutBlock block={makeBlock('info')} content={{ text: 'Info message' }} />);
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('renders warning variant correctly', () => {
    render(<CalloutBlock block={makeBlock('warning')} content={{ text: 'Warning message' }} />);
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('renders error variant correctly', () => {
    render(<CalloutBlock block={makeBlock('error')} content={{ text: 'Error message' }} />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders success variant correctly', () => {
    render(<CalloutBlock block={makeBlock('success')} content={{ text: 'Success message' }} />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders tip variant correctly', () => {
    render(<CalloutBlock block={makeBlock('tip')} content={{ text: 'Tip message' }} />);
    expect(screen.getByText('Tip message')).toBeInTheDocument();
  });

  it('handles string content (not object)', () => {
    render(<CalloutBlock block={makeBlock('info')} content="Simple string" />);
    expect(screen.getByText('Simple string')).toBeInTheDocument();
  });

  it('returns null for empty content', () => {
    const { container } = render(<CalloutBlock block={makeBlock('info')} content={{ text: '' }} />);
    expect(container.firstChild).toBeNull();
  });

  it('defaults to info variant when no variant specified', () => {
    render(<CalloutBlock block={{ type: 'callout', properties: {} }} content={{ text: 'Default' }} />);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('renders editing mode with textarea', () => {
    render(<CalloutBlock block={makeBlock('info')} content={{ text: 'Edit me' }} isEditing={true} />);
    const textarea = screen.getByPlaceholderText('Callout content...');
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe('Edit me');
  });

  it('calls onUpdate when editing', () => {
    const onUpdate = jest.fn();
    render(
      <CalloutBlock block={makeBlock('info')} content={{ text: 'Old' }} isEditing={true} onUpdate={onUpdate} />
    );
    const textarea = screen.getByPlaceholderText('Callout content...');
    fireEvent.change(textarea, { target: { value: 'New' } });
    expect(onUpdate).toHaveBeenCalledWith({ text: 'New' });
  });
});
