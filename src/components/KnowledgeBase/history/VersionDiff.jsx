import React from 'react';
import { Plus, Minus, ArrowRight } from 'lucide-react';

const VersionDiff = ({ before, after }) => {
  if (!before || !after) return null;

  const changes = [];

  // Title change
  if (before.title !== after.title) {
    changes.push({ field: 'Title', old: before.title, new: after.title });
  }

  // Icon change
  if (before.icon !== after.icon) {
    changes.push({ field: 'Icon', old: before.icon, new: after.icon });
  }

  // Block count change
  const beforeBlocks = before.blocks?.length || 0;
  const afterBlocks = after.blocks?.length || 0;
  if (beforeBlocks !== afterBlocks) {
    changes.push({
      field: 'Blocks',
      old: `${beforeBlocks} blocks`,
      new: `${afterBlocks} blocks`
    });
  }

  // Block content changes
  if (before.blocks && after.blocks) {
    const maxLen = Math.max(before.blocks.length, after.blocks.length);
    for (let i = 0; i < maxLen; i++) {
      const bBlock = before.blocks[i];
      const aBlock = after.blocks[i];

      if (!bBlock && aBlock) {
        changes.push({
          field: `Block ${i + 1}`,
          type: 'added',
          new: `${aBlock.type}: ${typeof aBlock.defaultContent === 'string' ? aBlock.defaultContent?.substring(0, 100) : '(structured)'}`
        });
      } else if (bBlock && !aBlock) {
        changes.push({
          field: `Block ${i + 1}`,
          type: 'removed',
          old: `${bBlock.type}: ${typeof bBlock.defaultContent === 'string' ? bBlock.defaultContent?.substring(0, 100) : '(structured)'}`
        });
      } else if (bBlock && aBlock) {
        const bContent = JSON.stringify(bBlock.defaultContent);
        const aContent = JSON.stringify(aBlock.defaultContent);
        if (bContent !== aContent || bBlock.type !== aBlock.type) {
          changes.push({
            field: `Block ${i + 1} (${aBlock.type})`,
            type: 'modified',
            old: typeof bBlock.defaultContent === 'string' ? bBlock.defaultContent?.substring(0, 80) : '(structured)',
            new: typeof aBlock.defaultContent === 'string' ? aBlock.defaultContent?.substring(0, 80) : '(structured)'
          });
        }
      }
    }
  }

  if (changes.length === 0) {
    return <p className="text-sm text-gray-400 italic">No differences found</p>;
  }

  return (
    <div className="space-y-2">
      {changes.map((change, idx) => (
        <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
            {change.field}
          </div>
          <div className="p-3 text-sm space-y-1">
            {change.type === 'added' ? (
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                <Plus className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{change.new}</span>
              </div>
            ) : change.type === 'removed' ? (
              <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                <Minus className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{change.old}</span>
              </div>
            ) : (
              <>
                {change.old && (
                  <div className="flex items-start gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                    <Minus className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="text-xs">{change.old}</span>
                  </div>
                )}
                {change.new && (
                  <div className="flex items-start gap-2 text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    <Plus className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="text-xs">{change.new}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VersionDiff;
