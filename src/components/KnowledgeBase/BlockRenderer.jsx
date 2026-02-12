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
// Notion-like: paragraphs/lists have tight spacing, structural blocks have generous spacing
const blockSpacing = {
  paragraph:            'mb-1',
  heading_1:            '',
  heading_2:            '',
  heading_3:            '',
  bulleted_list:        'my-1',
  numbered_list:        'my-1',
  toggle:               'my-2',
  callout:              'my-4',
  quote:                'my-3',
  code:                 'my-4',
  image:                'my-5',
  table:                'my-4',
  divider:              '',
  video:                'my-5',
  embed:                'my-5',
  bookmark:             'my-3',
  file:                 'my-3',
  equation:             'my-3',
  button:               'my-3',
  table_of_contents:    'my-4',
  audio:                'my-5',
  pdf:                  'my-5',
  breadcrumbs:          'my-2',
  synced_block:         'my-2',
  columns:              'my-5',
  collapsible_heading:  'my-3'
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
