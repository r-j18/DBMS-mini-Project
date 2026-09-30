import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No matching entries exist for the current filter criteria.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900/50 my-2">
      <div className="text-slate-400 dark:text-slate-500 mb-2">
        {icon || <Inbox size={28} strokeWidth={1.5} />}
      </div>
      <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-3 px-3 py-1.5 text-xs font-medium bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
