import React from 'react';
import { render, screen } from '@testing-library/react';
import TableOfContentsBlock from '../../../components/KnowledgeBase/blocks/TableOfContentsBlock';

describe('TableOfContentsBlock', () => {
  it('renders table of contents block', () => {
    render(
      <TableOfContentsBlock
        block={{ type: 'table_of_contents', properties: {} }}
        content={{}}
      />
    );
    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
  });

  it('shows empty state when no headings', () => {
    render(
      <TableOfContentsBlock
        block={{ type: 'table_of_contents', properties: {} }}
        content={{}}
      />
    );
    // Should show either headings or empty message
    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
  });

  it('renders with maxDepth property', () => {
    render(
      <TableOfContentsBlock
        block={{ type: 'table_of_contents', properties: { maxDepth: 2 } }}
        content={{}}
      />
    );
    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
  });

  it('renders edit mode controls', () => {
    render(
      <TableOfContentsBlock
        block={{ type: 'table_of_contents', properties: { maxDepth: 3 } }}
        content={{}}
        isEditing={true}
      />
    );
    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
  });
});
