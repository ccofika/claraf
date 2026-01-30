import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoBlock from '../../../components/KnowledgeBase/blocks/VideoBlock';

describe('VideoBlock', () => {
  it('renders YouTube embed correctly', () => {
    const content = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    const { container } = render(
      <VideoBlock block={{ type: 'video', properties: {} }} content={content} />
    );
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('youtube.com/embed');
  });

  it('renders Vimeo embed correctly', () => {
    const content = { url: 'https://vimeo.com/123456789' };
    const { container } = render(
      <VideoBlock block={{ type: 'video', properties: {} }} content={content} />
    );
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
  });

  it('renders caption when provided', () => {
    const content = { url: 'https://youtube.com/watch?v=test', caption: 'My video caption' };
    render(<VideoBlock block={{ type: 'video', properties: {} }} content={content} />);
    expect(screen.getByText('My video caption')).toBeInTheDocument();
  });

  it('renders URL input in edit mode', () => {
    render(
      <VideoBlock block={{ type: 'video', properties: {} }} content={{}} isEditing={true} />
    );
    expect(screen.getByPlaceholderText(/paste a video url/i)).toBeInTheDocument();
  });

  it('shows placeholder when no URL provided', () => {
    render(
      <VideoBlock block={{ type: 'video', properties: {} }} content={{}} />
    );
    expect(screen.getByText(/add a video/i)).toBeInTheDocument();
  });
});
