import React from 'react';
import { Badge } from '../../../components/ui/badge';

const QualityScoreBadge = ({ score }) => {
  if (score === null || score === undefined) {
    return <Badge variant="outline" className="text-xs">Not graded</Badge>;
  }

  let color = 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-300';
  if (score >= 80) color = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
  else if (score >= 60) color = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
  else if (score >= 40) color = 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
  else color = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {score}%
    </span>
  );
};

export default QualityScoreBadge;
