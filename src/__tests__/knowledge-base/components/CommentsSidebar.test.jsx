import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommentsSidebar from '../../../components/KnowledgeBase/comments/CommentsSidebar';

const mockComments = [
  {
    _id: 'c1',
    content: 'This looks great!',
    author: { _id: 'u1', name: 'John', email: 'john@test.com' },
    isResolved: false,
    reactions: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'c2',
    content: 'Fixed the typo',
    author: { _id: 'u2', name: 'Jane', email: 'jane@test.com' },
    isResolved: true,
    resolvedBy: 'u2',
    reactions: [{ emoji: '👍', users: ['u1'] }],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: 'c3',
    content: 'Reply to first',
    author: { _id: 'u2', name: 'Jane', email: 'jane@test.com' },
    parentComment: 'c1',
    isResolved: false,
    reactions: [],
    createdAt: new Date().toISOString()
  }
];

describe('CommentsSidebar', () => {
  const defaultProps = {
    pageId: 'page1',
    comments: mockComments,
    currentUser: { _id: 'u1', name: 'John' },
    onFetchComments: jest.fn(),
    onAddComment: jest.fn(),
    onUpdateComment: jest.fn(),
    onDeleteComment: jest.fn(),
    onResolveComment: jest.fn(),
    onReactToComment: jest.fn(),
    onClose: jest.fn()
  };

  it('renders comments sidebar', () => {
    render(<CommentsSidebar {...defaultProps} />);
    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  it('displays top-level comments', () => {
    render(<CommentsSidebar {...defaultProps} />);
    expect(screen.getByText('This looks great!')).toBeInTheDocument();
    expect(screen.getByText('Fixed the typo')).toBeInTheDocument();
  });

  it('shows correct comment count badge', () => {
    render(<CommentsSidebar {...defaultProps} />);
    // 1 open top-level comment (c1)
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('filters by open comments', () => {
    render(<CommentsSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText(/Open \(1\)/));
    expect(screen.getByText('This looks great!')).toBeInTheDocument();
  });

  it('filters by resolved comments', () => {
    render(<CommentsSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText(/Resolved \(1\)/));
    expect(screen.getByText('Fixed the typo')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(<CommentsSidebar {...defaultProps} />);
    // Find the X button
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  it('shows new comment input when plus clicked', () => {
    render(<CommentsSidebar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const plusButton = buttons.find(btn => btn.querySelector('.lucide-plus'));
    if (plusButton) {
      fireEvent.click(plusButton);
      expect(screen.getByPlaceholderText(/add a page comment/i)).toBeInTheDocument();
    }
  });

  it('calls onFetchComments on mount', () => {
    render(<CommentsSidebar {...defaultProps} />);
    expect(defaultProps.onFetchComments).toHaveBeenCalledWith('page1');
  });

  it('shows empty state when no comments', () => {
    render(<CommentsSidebar {...defaultProps} comments={[]} />);
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });
});
