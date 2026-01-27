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
  divider: DividerBlock
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

  return (
    <div className="group relative">
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
