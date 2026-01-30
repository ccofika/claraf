import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ShareModal from '../../../components/KnowledgeBase/sharing/ShareModal';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('ShareModal', () => {
  const defaultProps = {
    page: { _id: 'p1', title: 'Test Page' },
    permissions: {
      visibility: 'workspace',
      users: [],
      shareLink: null
    },
    onUpdatePermissions: jest.fn().mockResolvedValue({}),
    onGenerateShareLink: jest.fn().mockResolvedValue({
      enabled: true,
      token: 'test-token-123'
    }),
    onRevokeShareLink: jest.fn(),
    onClose: jest.fn()
  };

  it('renders share modal', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByText('Share Page')).toBeInTheDocument();
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('shows visibility options', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
  });

  it('selects visibility option', () => {
    render(<ShareModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Public'));
    // Public should now be selected (visual change, hard to assert in unit test)
    expect(screen.getByText('Anyone with the link')).toBeInTheDocument();
  });

  it('shows generate share link button when no link exists', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByText('Generate share link')).toBeInTheDocument();
  });

  it('shows share link when it exists', () => {
    const propsWithLink = {
      ...defaultProps,
      permissions: {
        ...defaultProps.permissions,
        shareLink: {
          enabled: true,
          token: 'abc123'
        }
      }
    };
    render(<ShareModal {...propsWithLink} />);
    expect(screen.getByText(/shared\/abc123/)).toBeInTheDocument();
  });

  it('shows user invite section', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('adds user to permissions list', () => {
    render(<ShareModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('Enter email');
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
  });

  it('calls onClose on cancel', () => {
    render(<ShareModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onUpdatePermissions on save', async () => {
    render(<ShareModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Save'));
    expect(defaultProps.onUpdatePermissions).toHaveBeenCalled();
  });
});
