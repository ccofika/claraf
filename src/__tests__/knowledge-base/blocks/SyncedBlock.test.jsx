import React from 'react';
import { render, screen } from '@testing-library/react';
import SyncedBlock from '../../../components/KnowledgeBase/blocks/SyncedBlock';

// Mock the KnowledgeBase context
jest.mock('../../../context/KnowledgeBaseContext', () => ({
  useKnowledgeBase: () => ({
    pages: [
      {
        _id: 'page1',
        title: 'Source Page',
        icon: null,
        slug: 'source-page',
        blocks: [
          { id: 'block1', type: 'paragraph', defaultContent: 'Synced content here' }
        ]
      }
    ]
  })
}));

describe('SyncedBlock', () => {
  it('renders placeholder when not configured', () => {
    render(<SyncedBlock block={{ type: 'synced_block', properties: {} }} content={{}} />);
    expect(screen.getByText(/no synced block configured/i)).toBeInTheDocument();
  });

  it('renders synced content when source exists', () => {
    const content = { sourcePageId: 'page1', sourceBlockId: 'block1' };
    render(<SyncedBlock block={{ type: 'synced_block', properties: {} }} content={content} />);
    expect(screen.getByText('Synced content here')).toBeInTheDocument();
  });

  it('shows synced label indicator', () => {
    const content = { sourcePageId: 'page1', sourceBlockId: 'block1' };
    render(<SyncedBlock block={{ type: 'synced_block', properties: {} }} content={content} />);
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('renders edit mode with page selector', () => {
    render(
      <SyncedBlock
        block={{ type: 'synced_block', properties: {} }}
        content={{}}
        isEditing={true}
      />
    );
    expect(screen.getByText('Synced Block')).toBeInTheDocument();
    expect(screen.getByText('Source Page', { selector: 'label' })).toBeInTheDocument();
  });

  it('shows error when source page not found', () => {
    const content = { sourcePageId: 'nonexistent', sourceBlockId: 'block1' };
    render(<SyncedBlock block={{ type: 'synced_block', properties: {} }} content={content} />);
    expect(screen.getByText('Source page not found')).toBeInTheDocument();
  });
});
