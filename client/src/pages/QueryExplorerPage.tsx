import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Clock,
  Terminal,
  AlertCircle,
  CheckCircle2,
  FolderArchive,
} from 'lucide-react';
import { api } from '../services/api';
import { QueryDefinition, QueryResult } from '../types';
import { SqlBlock } from '../components/common/SqlBlock';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/Toast';

export const QueryExplorerPage: React.FC = () => {
  const { role } = useAuth();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D9D0BE] dark:border-[#2E323B]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-typewriter text-base font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
              SQL QUERY EXPLORER & EVALUATION CONSOLE
            </h2>
            <span className="px-2 py-0.5 rounded-xs font-typewriter text-[11px] font-bold bg-[#E6DFCD] dark:bg-[#2C303A] text-[#B3261E] dark:text-red-400">
              10 REPORT BENCHMARKS
            </span>
          </div>
          <p className="text-xs text-[#7A7A7A] mt-0.5">
            Hand-written SQL queries from the project report with live execution, performance metrics, and verified schema results
          </p>
        </div>

        <button
          onClick={handleRunAll}
          className="h-8 px-3 flex items-center gap-1.5 font-typewriter text-xs font-bold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs transition-fast shrink-0 shadow-paper"
        >
          <Play size={12} fill="currentColor" />
          <span>RUN ALL 10 QUERIES</span>
        </button>
      </div>

      {/* Category Tabs styled like folder tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#D9D0BE] dark:border-[#2E323B] text-xs font-typewriter">
        {(['All', 'Joins', 'Aggregates', 'Subqueries'] as const).map((tab) => {
          const count =
            tab === 'All'
              ? queries.length
              : queries.filter((q) => q.category === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 font-bold rounded-t-xs border-t border-l border-r transition-fast flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-[#F6F0E0] dark:bg-[#1F2228] border-[#D9D0BE] dark:border-[#2E323B] text-[#B3261E] dark:text-red-400 shadow-folder'
                  : 'bg-transparent border-transparent text-[#7A7A7A] hover:text-[#1F1F1F]'
              }`}
            >
              <span>{tab.toUpperCase()}</span>
              <span className="font-mono text-[10px] text-[#7A7A7A]">({count})</span>
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
              className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-4 space-y-3"
            >
              {/* Query Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 border-b border-[#D9D0BE] dark:border-[#2E323B]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-typewriter text-xs font-bold px-1.5 py-0.5 rounded-xs bg-[#E6DFCD] dark:bg-[#2C303A] text-[#1F1F1F] dark:text-[#E2DFD8]">
                      QUERY #{q.id}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-xs font-typewriter font-bold uppercase tracking-wider ${
                        q.category === 'Joins'
                          ? 'bg-blue-100 text-[#1E40AF] dark:bg-blue-950 dark:text-blue-300'
                          : q.category === 'Aggregates'
                          ? 'bg-amber-100 text-[#B45309] dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      {q.category}
                    </span>
                    <h3 className="font-typewriter font-bold text-sm text-[#1F1F1F] dark:text-[#E2DFD8]">
                      {q.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#4B4B4B] dark:text-[#A09D95] mt-1 font-sans">
                    {q.description}
                  </p>
                </div>

                <button
                  onClick={() => handleRunPredefined(q.id)}
                  disabled={isRunning}
                  className="h-7 px-3 flex items-center gap-1.5 font-typewriter text-xs font-bold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs disabled:opacity-50 transition-fast shrink-0 shadow-paper"
                >
                  <Play size={11} fill="currentColor" />
                  <span>{isRunning ? 'RUNNING...' : 'EXECUTE'}</span>
                </button>
              </div>

              {/* Monospace SQL with Syntax Highlight & Copy Button on clean plain surface */}
              <SqlBlock sql={q.sql} />

              {/* Live Result View */}
              {result && (
                <div className="pt-2 border-t border-[#D9D0BE] dark:border-[#2E323B] space-y-2">
                  <div className="flex items-center justify-between text-xs font-typewriter">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle2 size={13} />
                        <span>RETURNED {result.rowCount} {result.rowCount === 1 ? 'ROW' : 'ROWS'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#7A7A7A] font-mono text-[11px]">
                        <Clock size={12} />
                        <span>{result.executionTimeMs} ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs bg-[#EFE9DC] dark:bg-[#16181C] overflow-x-auto max-h-60">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-[#E6DFCD] dark:bg-[#1A1C20] border-b border-[#D9D0BE] dark:border-[#2E323B] sticky top-0 font-mono text-[11px]">
                          {result.columns.map((col) => (
                            <th key={col} className="px-3 py-2 text-[#1F1F1F] dark:text-[#E2DFD8] font-bold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D9D0BE] dark:divide-[#2E323B]/60 font-mono text-[11px]">
                        {result.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-[#F6F0E0]/80 dark:hover:bg-[#1F2228]">
                            {result.columns.map((col) => (
                              <td key={col} className="px-3 py-1.5 text-[#1F1F1F] dark:text-[#E2DFD8]">
                                {row[col] !== null && row[col] !== undefined ? (
                                  String(row[col])
                                ) : (
                                  <span className="text-[#7A7A7A] italic font-sans text-xs">NULL</span>
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

      
      {role === 'admin' && (
      <>
      {/* Read-Only SQL Console Section */}
      <div className="p-5 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D9D0BE] dark:border-[#2E323B]">
          <div>
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-[#B08D3C]" />
              <h3 className="font-typewriter text-sm font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
                READ-ONLY SQL CONSOLE
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#B08D3C]/20 text-[#8C6C26] dark:text-[#D4B26F] font-typewriter font-bold">
                SELECT ONLY • 500 ROW CAP
              </span>
            </div>
            <p className="text-xs text-[#7A7A7A] mt-0.5">
              Execute ad-hoc SELECT queries directly against MySQL. Multi-statements, comments, and modifying statements are strictly blocked.
            </p>
          </div>

          <div className="flex items-center gap-1.5 font-typewriter text-[11px]">
            <button
              onClick={() =>
                setCustomSql(
                  "SELECT p.branch, COUNT(c.criminal_id) AS total_cases FROM POLICE p LEFT JOIN CRIMINAL c ON p.police_id = c.investigating_officer GROUP BY p.branch ORDER BY total_cases DESC;"
                )
              }
              className="px-2 py-1 border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC]"
            >
              Cases by Branch
            </button>
            <button
              onClick={() =>
                setCustomSql(
                  "SELECT crime, COUNT(*) AS count, ROUND(AVG(age), 1) AS avg_age FROM CRIMINAL GROUP BY crime ORDER BY count DESC;"
                )
              }
              className="px-2 py-1 border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC]"
            >
              Crime Stats
            </button>
          </div>
        </div>

        {/* Textarea on plain surface */}
        <div className="relative">
          <textarea
            rows={4}
            value={customSql}
            onChange={(e) => setCustomSql(e.target.value)}
            placeholder="Type a SELECT query here (e.g. SELECT * FROM POLICE;)"
            className="w-full p-3 font-mono text-xs bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:ring-1 focus:ring-[#B08D3C]"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#7A7A7A] font-typewriter">
            Transaction: READ ONLY • Security: crm_readonly
          </span>

          <button
            onClick={handleRunConsole}
            disabled={consoleRunning}
            className="h-8 px-4 flex items-center gap-1.5 font-typewriter text-xs font-bold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs disabled:opacity-50 transition-fast shadow-paper"
          >
            <Play size={12} fill="currentColor" />
            <span>{consoleRunning ? 'EXECUTING...' : 'RUN QUERY'}</span>
          </button>
        </div>

        {/* Console Error */}
        {consoleError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-[#B3261E]/40 rounded-xs text-xs text-[#B3261E] dark:text-red-400 flex items-start gap-2 font-mono">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div className="text-[11px]">{consoleError}</div>
          </div>
        )}

        {/* Console Results */}
        {consoleResult && (
          <div className="pt-2 border-t border-[#D9D0BE] dark:border-[#2E323B] space-y-2">
            <div className="flex items-center justify-between text-xs font-typewriter">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
                  QUERY RESULTS
                </span>
                <span className="font-mono text-[11px] text-[#7A7A7A]">
                  ({consoleResult.rowCount} rows
                  {consoleResult.capped ? ' - capped at 500' : ''} in{' '}
                  {consoleResult.executionTimeMs}ms)
                </span>
              </div>
            </div>

            <div className="border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs bg-[#EFE9DC] dark:bg-[#16181C] overflow-x-auto max-h-72">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#E6DFCD] dark:bg-[#1A1C20] border-b border-[#D9D0BE] dark:border-[#2E323B] sticky top-0 font-mono text-[11px]">
                    {consoleResult.columns.map((col) => (
                      <th key={col} className="px-3 py-2 text-[#1F1F1F] dark:text-[#E2DFD8] font-bold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D0BE] dark:divide-[#2E323B]/60 font-mono text-[11px]">
                  {consoleResult.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F6F0E0]/80 dark:hover:bg-[#1F2228]">
                      {consoleResult.columns.map((col) => (
                        <td key={col} className="px-3 py-1.5 text-[#1F1F1F] dark:text-[#E2DFD8]">
                          {row[col] !== null && row[col] !== undefined ? (
                            String(row[col])
                          ) : (
                            <span className="text-[#7A7A7A] italic font-sans text-xs">NULL</span>
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
      </>
      )}
    </div>
  );
};
