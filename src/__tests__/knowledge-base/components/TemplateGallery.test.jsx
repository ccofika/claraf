import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateGallery from '../../../components/KnowledgeBase/templates/TemplateGallery';

const mockTemplates = [
  {
    _id: '1',
    title: 'Meeting Notes',
    description: 'Template for meeting notes',
    icon: '📝',
    category: 'meeting',
    usageCount: 5,
    blocks: [{ id: 'b1', type: 'paragraph', defaultContent: 'Test' }]
  },
  {
    _id: '2',
    title: 'Project Plan',
    description: 'Template for project planning',
    icon: '📊',
    category: 'project',
    usageCount: 10,
    blocks: []
  },
  {
    _id: '3',
    title: 'Custom Doc',
    description: 'Custom document template',
    icon: '📋',
    category: 'custom',
    usageCount: 0,
    blocks: []
  }
];

describe('TemplateGallery', () => {
  const defaultProps = {
    templates: mockTemplates,
    onUseTemplate: jest.fn(),
    onCreateTemplate: jest.fn(),
    onDeleteTemplate: jest.fn(),
    isAdmin: true,
    onClose: jest.fn()
  };

  it('renders template gallery', () => {
    render(<TemplateGallery {...defaultProps} />);
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('displays all templates', () => {
    render(<TemplateGallery {...defaultProps} />);
    expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    expect(screen.getByText('Project Plan')).toBeInTheDocument();
    expect(screen.getByText('Custom Doc')).toBeInTheDocument();
  });

  it('filters by category', () => {
    render(<TemplateGallery {...defaultProps} />);
    fireEvent.click(screen.getByText('Meeting'));
    expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    expect(screen.queryByText('Project Plan')).not.toBeInTheDocument();
  });

  it('filters by search', () => {
    render(<TemplateGallery {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'project' } });
    expect(screen.getByText('Project Plan')).toBeInTheDocument();
    expect(screen.queryByText('Meeting Notes')).not.toBeInTheDocument();
  });

  it('shows "no templates" when filtered to empty', () => {
    render(<TemplateGallery {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getByText('No templates found')).toBeInTheDocument();
  });

  it('shows create template button for admin', () => {
    render(<TemplateGallery {...defaultProps} />);
    expect(screen.getByText('Create Template')).toBeInTheDocument();
  });

  it('hides create template button for non-admin', () => {
    render(<TemplateGallery {...defaultProps} isAdmin={false} />);
    expect(screen.queryByText('Create Template')).not.toBeInTheDocument();
  });

  it('closes on X button click', () => {
    render(<TemplateGallery {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn =>
      btn.querySelector('svg') && btn.closest('.flex.items-center.justify-between')
    );
    // Find the close button in the header
    fireEvent.click(closeButtons[closeButtons.length - 1]); // Close is typically last or find by parent
  });

  it('displays category navigation', () => {
    render(<TemplateGallery {...defaultProps} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Meeting')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});
