import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AudioBlock from '../../../components/KnowledgeBase/blocks/AudioBlock';

describe('AudioBlock', () => {
  it('renders placeholder when no URL', () => {
    render(<AudioBlock block={{ type: 'audio', properties: {} }} content={{}} />);
    expect(screen.getByText(/add an audio file/i)).toBeInTheDocument();
  });

  it('renders player when URL provided', () => {
    const content = { url: 'https://example.com/audio.mp3', title: 'My Song' };
    render(<AudioBlock block={{ type: 'audio', properties: {} }} content={content} />);
    expect(screen.getByText('My Song')).toBeInTheDocument();
  });

  it('renders caption', () => {
    const content = { url: 'https://example.com/audio.mp3', caption: 'Podcast episode 1' };
    render(<AudioBlock block={{ type: 'audio', properties: {} }} content={content} />);
    expect(screen.getByText('Podcast episode 1')).toBeInTheDocument();
  });

  it('renders edit mode with URL input', () => {
    render(
      <AudioBlock
        block={{ type: 'audio', properties: {} }}
        content={{ url: '' }}
        isEditing={true}
      />
    );
    expect(screen.getByPlaceholderText(/audio.mp3/)).toBeInTheDocument();
  });

  it('renders title input in edit mode', () => {
    render(
      <AudioBlock
        block={{ type: 'audio', properties: {} }}
        content={{ url: '', title: 'Test' }}
        isEditing={true}
      />
    );
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
  });

  it('calls onUpdate when URL changes', () => {
    const onUpdate = jest.fn();
    render(
      <AudioBlock
        block={{ type: 'audio', properties: {} }}
        content={{ url: '' }}
        isEditing={true}
        onUpdate={onUpdate}
      />
    );
    const input = screen.getByPlaceholderText(/audio.mp3/);
    fireEvent.change(input, { target: { value: 'https://example.com/new.mp3' } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com/new.mp3' }));
  });
});
