import React from 'react';
import { render, screen } from '@testing-library/react';
import BreadcrumbsBlock from '../../../components/KnowledgeBase/blocks/BreadcrumbsBlock';

// Mock the KnowledgeBase context
jest.mock('../../../context/KnowledgeBaseContext', () => ({
  useKnowledgeBase: () => ({
    pages: [
      {
        _id: 'page1',
        title: 'Parent Page',
        icon: null,
        slug: 'parent-page',
        children: [
          { _id: 'page2', title: 'Child Page', icon: null, slug: 'child-page', parentPage: 'page1' }
        ]
      }
    ],
    currentPage: { _id: 'page2', title: 'Child Page', slug: 'child-page', parentPage: 'page1' }
  })
}));

describe('BreadcrumbsBlock', () => {
  it('renders breadcrumb navigation', () => {
    render(<BreadcrumbsBlock block={{ type: 'breadcrumbs', properties: {} }} content={{}} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows current page in breadcrumb', () => {
    render(<BreadcrumbsBlock block={{ type: 'breadcrumbs', properties: {} }} content={{}} />);
    expect(screen.getByText('Child Page')).toBeInTheDocument();
  });

  it('renders edit mode with preview', () => {
    render(
      <BreadcrumbsBlock
        block={{ type: 'breadcrumbs', properties: {} }}
        content={{}}
        isEditing={true}
      />
    );
    expect(screen.getByText('Breadcrumbs Block')).toBeInTheDocument();
    expect(screen.getByText(/auto-generated/i)).toBeInTheDocument();
  });

  it('shows Knowledge Base home link', () => {
    render(<BreadcrumbsBlock block={{ type: 'breadcrumbs', properties: {} }} content={{}} />);
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/knowledge-base')).toBe(true);
  });
});
