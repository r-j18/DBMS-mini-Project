import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface SqlBlockProps {
  sql: string;
  className?: string;
}

export const SqlBlock: React.FC<SqlBlockProps> = ({ sql, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple, deterministic SQL syntax keyword highlighter
  const highlightSql = (code: string) => {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'INNER JOIN', 'JOIN', 'ON',
      'GROUP BY', 'ORDER BY', 'ASC', 'DESC', 'COUNT', 'AVG', 'ROUND',
      'DISTINCT', 'IN', 'AND', 'OR', 'AS', 'LIMIT', 'OFFSET', 'UNION',
      'IS NULL', 'IS NOT NULL', 'HAVING'
    ];

    // Tokenize strings, numbers, keywords
    const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    const parts = code.split(regex);

    return parts.map((part, i) => {
      const upper = part.toUpperCase();
      if (keywords.includes(upper)) {
        return (
          <span key={i} className="text-blue-700 dark:text-blue-400 font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={`relative group border border-slate-200 dark:border-slate-800 rounded bg-slate-50/70 dark:bg-slate-950 p-3 text-xs font-mono overflow-x-auto ${className}`}>
      <div className="absolute right-2 top-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 shadow-none transition-fast text-[11px]"
          title="Copy SQL"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-sans">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="font-sans">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="text-slate-800 dark:text-slate-200 leading-relaxed pr-16 whitespace-pre-wrap break-all">
        {highlightSql(sql)}
      </pre>
    </div>
  );
};
