import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VersionHistory from '../../../components/KnowledgeBase/history/VersionHistory';

const mockVersions = [
  {
    _id: 'v3',
    version: 3,
    changesSummary: 'Changed: content',
    createdBy: { name: 'John', email: 'john@test.com' },
    createdAt: new Date().toISOString()
  },
  {
    _id: 'v2',
    version: 2,
    changesSummary: 'Changed: title, content',
    createdBy: { name: 'Jane', email: 'jane@test.com' },
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: 'v1',
    version: 1,
    changesSummary: 'Initial version',
    createdBy: { name: 'John', email: 'john@test.com' },
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

describe('VersionHistory', () => {
  const defaultProps = {
    pageId: 'page1',
    versions: mockVersions,
    onFetchVersions: jest.fn(),
    onRestoreVersion: jest.fn().mockResolvedValue({}),
    onFetchVersion: jest.fn().mockResolvedValue({
      title: 'Test Page',
      blocks: [{ id: 'b1', type: 'paragraph', defaultContent: 'Hello' }]
    }),
    onClose: jest.fn()
  };

  it('renders version history panel', () => {
    render(<VersionHistory {...defaultProps} />);
    expect(screen.getByText('Version History')).toBeInTheDocument();
  });

  it('displays all versions', () => {
    render(<VersionHistory {...defaultProps} />);
    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('marks first version as Current', () => {
    render(<VersionHistory {...defaultProps} />);
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('shows changes summary', () => {
    render(<VersionHistory {...defaultProps} />);
    expect(screen.getByText('Changed: content')).toBeInTheDocument();
    expect(screen.getByText('Changed: title, content')).toBeInTheDocument();
  });

  it('shows restore buttons for non-current versions', () => {
    render(<VersionHistory {...defaultProps} />);
    const restoreButtons = screen.getAllByText('Restore');
    expect(restoreButtons.length).toBe(2); // v2 and v1
  });

  it('shows version detail when clicked', async () => {
    render(<VersionHistory {...defaultProps} />);
    fireEvent.click(screen.getByText('v2'));

    await waitFor(() => {
      expect(defaultProps.onFetchVersion).toHaveBeenCalledWith('page1', 2);
    });
  });

  it('calls onFetchVersions on mount', () => {
    render(<VersionHistory {...defaultProps} />);
    expect(defaultProps.onFetchVersions).toHaveBeenCalledWith('page1');
  });

  it('shows empty state when no versions', () => {
    render(<VersionHistory {...defaultProps} versions={[]} />);
    expect(screen.getByText('No versions yet')).toBeInTheDocument();
  });

  it('shows restore confirmation when Restore clicked', () => {
    render(<VersionHistory {...defaultProps} />);
    const restoreButtons = screen.getAllByText('Restore');
    fireEvent.click(restoreButtons[0]);
    expect(screen.getByText(/restore version/i)).toBeInTheDocument();
  });

  it('closes on X button', () => {
    render(<VersionHistory {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });
});
