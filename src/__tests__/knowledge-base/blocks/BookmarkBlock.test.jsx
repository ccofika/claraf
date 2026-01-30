import React from 'react';
import { render, screen } from '@testing-library/react';
import BookmarkBlock from '../../../components/KnowledgeBase/blocks/BookmarkBlock';

describe('BookmarkBlock', () => {
  it('renders bookmark with title and description', () => {
    const content = {
      url: 'https://example.com',
      title: 'Example Site',
      description: 'A great website'
    };
    render(<BookmarkBlock block={{ type: 'bookmark', properties: {} }} content={content} />);
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('A great website')).toBeInTheDocument();
  });

  it('renders URL as link', () => {
    const content = { url: 'https://example.com', title: 'Example' };
    render(<BookmarkBlock block={{ type: 'bookmark', properties: {} }} content={content} />);
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('shows placeholder when no URL', () => {
    render(<BookmarkBlock block={{ type: 'bookmark', properties: {} }} content={{}} />);
    expect(screen.getByText(/add a bookmark/i)).toBeInTheDocument();
  });

  it('renders URL input in edit mode', () => {
    render(
      <BookmarkBlock block={{ type: 'bookmark', properties: {} }} content={{}} isEditing={true} />
    );
    expect(screen.getByPlaceholderText(/paste a url/i)).toBeInTheDocument();
  });
});
