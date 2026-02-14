import React from 'react';
import { useKnowledgeBase } from '../../context/KnowledgeBaseContext';

// Block Components
import ParagraphBlock from './blocks/ParagraphBlock';
import HeadingBlock from './blocks/HeadingBlock';
import ListBlock from './blocks/ListBlock';
import ToggleBlock from './blocks/ToggleBlock';
import CalloutBlock from './blocks/CalloutBlock';
import QuoteBlock from './blocks/QuoteBlock';
import CodeBlock from './blocks/CodeBlock';
import ImageBlock from './blocks/ImageBlock';
import TableBlock from './blocks/TableBlock';
import DividerBlock from './blocks/DividerBlock';
// New Block Components
import VideoBlock from './blocks/VideoBlock';
import EmbedBlock from './blocks/EmbedBlock';
import BookmarkBlock from './blocks/BookmarkBlock';
import FileBlock from './blocks/FileBlock';
import EquationBlock from './blocks/EquationBlock';
import ButtonBlock from './blocks/ButtonBlock';
import TableOfContentsBlock from './blocks/TableOfContentsBlock';
import AudioBlock from './blocks/AudioBlock';
import PDFBlock from './blocks/PDFBlock';
import BreadcrumbsBlock from './blocks/BreadcrumbsBlock';
import SyncedBlock from './blocks/SyncedBlock';
import ColumnsBlock from './blocks/ColumnsBlock';
import CollapsibleHeadingBlock from './blocks/CollapsibleHeadingBlock';

const blockComponents = {
  paragraph: ParagraphBlock,
  heading_1: HeadingBlock,
  heading_2: HeadingBlock,
  heading_3: HeadingBlock,
  bulleted_list: ListBlock,
  numbered_list: ListBlock,
  toggle: ToggleBlock,
  callout: CalloutBlock,
  quote: QuoteBlock,
  code: CodeBlock,
  image: ImageBlock,
  table: TableBlock,
  divider: DividerBlock,
  // New block types
  video: VideoBlock,
  embed: EmbedBlock,
  bookmark: BookmarkBlock,
  file: FileBlock,
  equation: EquationBlock,
  button: ButtonBlock,
  table_of_contents: TableOfContentsBlock,
  audio: AudioBlock,
  pdf: PDFBlock,
  breadcrumbs: BreadcrumbsBlock,
  synced_block: SyncedBlock,
  columns: ColumnsBlock,
  collapsible_heading: CollapsibleHeadingBlock
};

// Centralized vertical spacing per block type
// Text blocks: tight spacing. Structural/card blocks: generous spacing (16-24px).
// Based on reference design measurements (design13): 16px between paragraphs, 20-24px for structural blocks.
const blockSpacing = {
  paragraph:            'mb-1.5',
  heading_1:            '',
  heading_2:            '',
  heading_3:            '',
  bulleted_list:        'my-1.5',
  numbered_list:        'my-1.5',
  toggle:               'my-3.5',
  callout:              'my-5',
  quote:                'my-4',
  code:                 'my-5',
  image:                'my-6',
  table:                'my-5',
  divider:              '',
  video:                'my-6',
  embed:                'my-6',
  bookmark:             'my-4',
  file:                 'my-4',
  equation:             'my-4',
  button:               'my-4',
  table_of_contents:    'my-5',
  audio:                'my-6',
  pdf:                  'my-6',
  breadcrumbs:          'my-3',
  synced_block:         'my-3',
  columns:              'my-6',
  collapsible_heading:  'my-4'
};

const BlockRenderer = ({ block, isEditing = false, onUpdate }) => {
  const { resolveContent } = useKnowledgeBase();

  if (!block) return null;

  const BlockComponent = blockComponents[block.type];

  if (!BlockComponent) {
    console.warn(`Unknown block type: ${block.type}`);
    return (
      <div className="p-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded">
        Unknown block type: {block.type}
      </div>
    );
  }

  // Resolve dynamic content based on current dropdown selections
  const resolvedContent = resolveContent(block);
  const spacing = blockSpacing[block.type] || '';

  return (
    <div className={`group relative ${spacing}`}>
      <BlockComponent
        block={block}
        content={resolvedContent}
        isEditing={isEditing}
        onUpdate={onUpdate}
      />
    </div>
  );
};

export default BlockRenderer;
