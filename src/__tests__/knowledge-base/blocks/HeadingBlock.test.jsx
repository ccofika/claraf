import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeadingBlock from '../../../components/KnowledgeBase/blocks/HeadingBlock';

describe('HeadingBlock', () => {
  it('renders heading 1 correctly', () => {
    render(<HeadingBlock block={{ type: 'heading_1' }} content="Main Title" />);
    const heading = screen.getByText('Main Title');
    expect(heading.tagName).toBe('H1');
  });

  it('renders heading 2 correctly', () => {
    render(<HeadingBlock block={{ type: 'heading_2' }} content="Sub Title" />);
    const heading = screen.getByText('Sub Title');
    expect(heading.tagName).toBe('H2');
  });

  it('renders heading 3 correctly', () => {
    render(<HeadingBlock block={{ type: 'heading_3' }} content="Small Heading" />);
    const heading = screen.getByText('Small Heading');
    expect(heading.tagName).toBe('H3');
  });

  it('returns null for empty content', () => {
    const { container } = render(<HeadingBlock block={{ type: 'heading_1' }} content="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders input in editing mode', () => {
    render(<HeadingBlock block={{ type: 'heading_1' }} content="Edit Me" isEditing={true} />);
    const input = screen.getByPlaceholderText('Heading 1');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Edit Me');
  });

  it('calls onUpdate when editing', () => {
    const onUpdate = jest.fn();
    render(
      <HeadingBlock block={{ type: 'heading_2' }} content="Old" isEditing={true} onUpdate={onUpdate} />
    );
    const input = screen.getByPlaceholderText('Heading 2');
    fireEvent.change(input, { target: { value: 'New' } });
    expect(onUpdate).toHaveBeenCalledWith('New');
  });
});
