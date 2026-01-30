import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonBlock from '../../../components/KnowledgeBase/blocks/ButtonBlock';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('ButtonBlock', () => {
  it('renders button with label', () => {
    const content = { label: 'Click Me', action: 'link', url: 'https://example.com' };
    render(<ButtonBlock block={{ type: 'button', properties: { style: 'primary' } }} content={content} />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders as link when action is link', () => {
    const content = { label: 'Visit', action: 'link', url: 'https://example.com' };
    render(<ButtonBlock block={{ type: 'button', properties: { style: 'primary' } }} content={content} />);
    const button = screen.getByText('Visit');
    expect(button).toBeInTheDocument();
  });

  it('copies text when action is copy', async () => {
    const content = { label: 'Copy Code', action: 'copy', copyText: 'npm install' };
    render(<ButtonBlock block={{ type: 'button', properties: { style: 'primary' } }} content={content} />);
    const button = screen.getByText('Copy Code');
    fireEvent.click(button);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('npm install');
  });

  it('renders different styles', () => {
    const content = { label: 'Test', action: 'link', url: '#' };
    const { rerender } = render(
      <ButtonBlock block={{ type: 'button', properties: { style: 'primary' } }} content={content} />
    );
    expect(screen.getByText('Test')).toBeInTheDocument();

    rerender(
      <ButtonBlock block={{ type: 'button', properties: { style: 'outline' } }} content={content} />
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders edit mode with inputs', () => {
    render(
      <ButtonBlock
        block={{ type: 'button', properties: { style: 'primary' } }}
        content={{ label: 'Test' }}
        isEditing={true}
      />
    );
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
  });
});
