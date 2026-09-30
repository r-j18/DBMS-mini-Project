import React, { useEffect, useState } from 'react';
import {
  Code2,
  Play,
  Clock,
  Database,
  Terminal,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCode,
} from 'lucide-react';
import { api } from '../services/api';
import { QueryDefinition, QueryResult } from '../types';
import { SqlBlock } from '../components/common/SqlBlock';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/Toast';

export const QueryExplorerPage: React.FC = () => {
  const [queries, setQueries] = useState<QueryDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Joins' | 'Aggregates' | 'Subqueries'>('All');

  // Query execution state map: [queryId] -> QueryResult
  const [results, setResults] = useState<Record<number, QueryResult>>({});
  const [runningMap, setRunningMap] = useState<Record<number, boolean>>({});

  // SQL Console state
  const [customSql, setCustomSql] = useState('SELECT criminal_id, name, age, crime, investigation_status FROM CRIMINAL ORDER BY age DESC;');
  const [consoleResult, setConsoleResult] = useState<QueryResult | null>(null);
  const [consoleError, setConsoleError] = useState<string | null>(null);
  const [consoleRunning, setConsoleRunning] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const data = await api.getQueries();
      setQueries(data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPredefined = async (id: number) => {
    try {
      setRunningMap((prev) => ({ ...prev, [id]: true }));
      const res = await api.runQuery(id);
      setResults((prev) => ({ ...prev, [id]: res }));
    } catch (err: any) {
      showToast('error', `Query ${id} failed: ${err.message}`);
    } finally {
      setRunningMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRunAll = async () => {
    for (const q of queries) {
      await handleRunPredefined(q.id);
    }
    showToast('success', 'All 10 project report queries executed successfully');
  };

  const handleRunConsole = async () => {
    if (!customSql.trim()) {
      setConsoleError('Please enter a SQL query');
      return;
    }
    try {
      setConsoleRunning(true);
      setConsoleError(null);
      setConsoleResult(null);
      const res = await api.runSqlConsole(customSql);
      setConsoleResult(res);
      showToast('success', `Query returned ${res.rowCount} rows in ${res.executionTimeMs}ms`);
    } catch (err: any) {
      setConsoleError(err.message || 'Query execution failed');
      showToast('error', 'Execution rejected or failed');
    } finally {
      setConsoleRunning(false);
    }
  };

  const filteredQueries = queries.filter((q) => {
    if (activeTab === 'All') return true;
    return q.category === activeTab;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Query Explorer (Viva & Evaluation Mode)
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              10 Report Queries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hand-written SQL queries from the project report with live execution, performance metrics, and verified schema results
          </p>
        </div>

        <button
          onClick={handleRunAll}
          className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white transition-fast shrink-0"
        >
          <Play size={12} fill="currentColor" />
          <span>Run all 10 queries</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        {(['All', 'Joins', 'Aggregates', 'Subqueries'] as const).map((tab) => {
          const count =
            tab === 'All'
              ? queries.length
              : queries.filter((q) => q.category === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 font-medium border-b-2 transition-fast flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab}</span>
              <span className="font-mono text-[11px] text-slate-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Query Cards List */}
      <div className="space-y-4">
        {filteredQueries.map((q) => {
          const isRunning = runningMap[q.id] || false;
          const result = results[q.id];

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4 space-y-3"
            >
              {/* Query Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      Query #{q.id}
                    </span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-medium ${
                        q.category === 'Joins'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : q.category === 'Aggregates'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      {q.category.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {q.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {q.description}
                  </p>
                </div>

                <button
                  onClick={() => handleRunPredefined(q.id)}
                  disabled={isRunning}
                  className="h-7 px-3 flex items-center gap-1.5 text-xs font-medium bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded hover:bg-slate-700 dark:hover:bg-white disabled:opacity-50 transition-fast shrink-0"
                >
                  <Play size={11} fill="currentColor" />
                  <span>{isRunning ? 'Running...' : 'Run'}</span>
                </button>
              </div>

              {/* Monospace SQL with Syntax Highlight & Copy Button */}
              <SqlBlock sql={q.sql} />

              {/* Live Result View */}
              {result && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 size={13} />
                        <span>Returned {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                        <Clock size={12} />
                        <span>{result.executionTimeMs} ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-x-auto max-h-60">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 font-mono text-[11px]">
                          {result.columns.map((col) => (
                            <th key={col} className="px-3 py-2 text-slate-600 dark:text-slate-300 font-semibold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                        {result.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            {result.columns.map((col) => (
                              <td key={col} className="px-3 py-1.5 text-slate-800 dark:text-slate-200">
                                {row[col] !== null && row[col] !== undefined ? (
                                  String(row[col])
                                ) : (
                                  <span className="text-slate-400 italic font-sans text-xs">NULL</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Read-Only SQL Console Section */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-slate-700 dark:text-slate-300" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Read-Only SQL Console
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900 font-mono">
                SELECT ONLY • 500 ROW CAP
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute custom queries directly against MySQL. Modifying statements (INSERT, UPDATE, DELETE, DROP), multiple statements, and comments are rejected.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                setCustomSql(
                  "SELECT p.branch, COUNT(c.criminal_id) AS total_cases FROM POLICE p LEFT JOIN CRIMINAL c ON p.police_id = c.investigating_officer GROUP BY p.branch ORDER BY total_cases DESC;"
                )
              }
              className="text-[11px] px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cases by Branch
            </button>
            <button
              onClick={() =>
                setCustomSql(
                  "SELECT crime, COUNT(*) AS count, ROUND(AVG(age), 1) AS avg_age FROM CRIMINAL GROUP BY crime ORDER BY count DESC;"
                )
              }
              className="text-[11px] px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Crimes Stats
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            rows={4}
            value={customSql}
            onChange={(e) => setCustomSql(e.target.value)}
            placeholder="Type a SELECT query here (e.g. SELECT * FROM POLICE;)"
            className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Transaction: READ ONLY • Connection: crm_readonly
          </span>

          <button
            onClick={handleRunConsole}
            disabled={consoleRunning}
            className="h-8 px-4 flex items-center gap-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 transition-fast"
          >
            <Play size={12} fill="currentColor" />
            <span>{consoleRunning ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>

        {/* Console Error */}
        {consoleError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="font-mono text-[11px]">{consoleError}</div>
          </div>
        )}

        {/* Console Results */}
        {consoleResult && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Query Results
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  ({consoleResult.rowCount} rows
                  {consoleResult.capped ? ' - capped at 500' : ''} in{' '}
                  {consoleResult.executionTimeMs}ms)
                </span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded overflow-x-auto max-h-72">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 font-mono text-[11px]">
                    {consoleResult.columns.map((col) => (
                      <th key={col} className="px-3 py-2 text-slate-600 dark:text-slate-300 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {consoleResult.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      {consoleResult.columns.map((col) => (
                        <td key={col} className="px-3 py-1.5 text-slate-800 dark:text-slate-200">
                          {row[col] !== null && row[col] !== undefined ? (
                            String(row[col])
                          ) : (
                            <span className="text-slate-400 italic font-sans text-xs">NULL</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
