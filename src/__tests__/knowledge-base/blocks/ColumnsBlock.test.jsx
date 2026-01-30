import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ColumnsBlock from '../../../components/KnowledgeBase/blocks/ColumnsBlock';

// Mock BlockRenderer to avoid deep dependency chain
jest.mock('../../../components/KnowledgeBase/BlockRenderer', () => {
  return function MockBlockRenderer({ block }) {
    return <div data-testid={`block-${block.id}`}>{block.type}: {typeof block.defaultContent === 'string' ? block.defaultContent : ''}</div>;
  };
});

describe('ColumnsBlock', () => {
  const defaultContent = {
    columns: [
      { id: 'col1', width: 50, blocks: [] },
      { id: 'col2', width: 50, blocks: [] }
    ]
  };

  it('renders columns in view mode', () => {
    render(<ColumnsBlock block={{ type: 'columns', properties: {} }} content={defaultContent} />);
    // Should show empty column placeholders
    const emptyLabels = screen.getAllByText('Empty column');
    expect(emptyLabels.length).toBe(2);
  });

  it('renders blocks inside columns', () => {
    const content = {
      columns: [
        { id: 'col1', width: 50, blocks: [{ id: 'b1', type: 'paragraph', defaultContent: 'Left' }] },
        { id: 'col2', width: 50, blocks: [{ id: 'b2', type: 'paragraph', defaultContent: 'Right' }] }
      ]
    };
    render(<ColumnsBlock block={{ type: 'columns', properties: {} }} content={content} />);
    expect(screen.getByText(/Left/)).toBeInTheDocument();
    expect(screen.getByText(/Right/)).toBeInTheDocument();
  });

  it('shows edit mode with column count', () => {
    render(
      <ColumnsBlock
        block={{ type: 'columns', properties: {} }}
        content={defaultContent}
        isEditing={true}
      />
    );
    expect(screen.getByText(/2 columns/)).toBeInTheDocument();
  });

  it('shows layout presets in edit mode', () => {
    render(
      <ColumnsBlock
        block={{ type: 'columns', properties: {} }}
        content={defaultContent}
        isEditing={true}
      />
    );
    expect(screen.getByText('50/50')).toBeInTheDocument();
    expect(screen.getByText('70/30')).toBeInTheDocument();
    expect(screen.getByText('33/33/33')).toBeInTheDocument();
  });

  it('shows add column button in edit mode', () => {
    render(
      <ColumnsBlock
        block={{ type: 'columns', properties: {} }}
        content={defaultContent}
        isEditing={true}
      />
    );
    expect(screen.getByText('Add Column')).toBeInTheDocument();
  });

  it('calls onUpdate when layout preset clicked', () => {
    const onUpdate = jest.fn();
    render(
      <ColumnsBlock
        block={{ type: 'columns', properties: {} }}
        content={defaultContent}
        isEditing={true}
        onUpdate={onUpdate}
      />
    );
    fireEvent.click(screen.getByText('70/30'));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      columns: expect.arrayContaining([
        expect.objectContaining({ width: 70 }),
        expect.objectContaining({ width: 30 })
      ])
    }));
  });

  it('renders with default 2-column layout when content missing', () => {
    render(<ColumnsBlock block={{ type: 'columns', properties: {} }} content={{}} />);
    const emptyLabels = screen.getAllByText('Empty column');
    expect(emptyLabels.length).toBe(2);
  });
});
