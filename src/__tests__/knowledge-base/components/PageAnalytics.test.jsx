import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PageAnalytics from '../../../components/KnowledgeBase/analytics/PageAnalytics';

const mockAnalytics = [
  { date: new Date().toISOString(), views: 50, uniqueViewers: ['u1', 'u2', 'u3'], avgTimeOnPage: 120 },
  { date: new Date(Date.now() - 86400000).toISOString(), views: 30, uniqueViewers: ['u1', 'u2'], avgTimeOnPage: 90 },
  { date: new Date(Date.now() - 172800000).toISOString(), views: 20, uniqueViewers: ['u1'], avgTimeOnPage: 60 },
  { date: new Date(Date.now() - 259200000).toISOString(), views: 15, uniqueViewers: ['u1', 'u4'], avgTimeOnPage: 45 },
  { date: new Date(Date.now() - 345600000).toISOString(), views: 10, uniqueViewers: ['u1'], avgTimeOnPage: 30 },
  { date: new Date(Date.now() - 432000000).toISOString(), views: 8, uniqueViewers: ['u3'], avgTimeOnPage: 25 },
  { date: new Date(Date.now() - 518400000).toISOString(), views: 5, uniqueViewers: ['u2'], avgTimeOnPage: 20 },
];

describe('PageAnalytics', () => {
  const defaultProps = {
    pageId: 'page1',
    pageTitle: 'Test Page',
    onFetchAnalytics: jest.fn().mockResolvedValue(mockAnalytics),
    onClose: jest.fn()
  };

  it('renders analytics modal', async () => {
    render(<PageAnalytics {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Page Analytics')).toBeInTheDocument();
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
  });

  it('displays total views', async () => {
    render(<PageAnalytics {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Total Views')).toBeInTheDocument();
    });
  });

  it('displays unique viewers stat', async () => {
    render(<PageAnalytics {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Unique Viewers')).toBeInTheDocument();
    });
  });

  it('displays average time stat', async () => {
    render(<PageAnalytics {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Avg. Time')).toBeInTheDocument();
    });
  });

  it('calls onFetchAnalytics on mount', () => {
    render(<PageAnalytics {...defaultProps} />);
    expect(defaultProps.onFetchAnalytics).toHaveBeenCalledWith('page1', 30);
  });

  it('changes period on select change', async () => {
    render(<PageAnalytics {...defaultProps} />);

    await waitFor(() => {
      const select = screen.getByDisplayValue('Last 30 days');
      fireEvent.change(select, { target: { value: '7' } });
    });

    expect(defaultProps.onFetchAnalytics).toHaveBeenCalledWith('page1', 7);
  });

  it('shows loading state initially', () => {
    render(<PageAnalytics {...defaultProps} onFetchAnalytics={jest.fn(() => new Promise(() => {}))} />);
    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays daily breakdown table', async () => {
    render(<PageAnalytics {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Breakdown')).toBeInTheDocument();
    });
  });

  it('displays views chart section', async () => {
    render(<PageAnalytics {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Views \(Last 7 days\)/)).toBeInTheDocument();
    });
  });

  it('closes on X button', async () => {
    render(<PageAnalytics {...defaultProps} />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(defaultProps.onClose).toHaveBeenCalled();
      }
    });
  });
});
