import React, { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Download, Filter, RotateCcw, ShieldCheck, Database, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogEntry } from '../types';
import { DataTable } from '../components/common/DataTable';
import { useToast } from '../components/common/Toast';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadAuditLogs(1);
  }, [actionFilter, tableFilter, startDate, endDate]);

  const loadAuditLogs = async (page = pagination.page) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page,
        limit: pagination.limit,
      };
      if (userFilter.trim()) params.user = userFilter.trim();
      if (actionFilter) params.action = actionFilter;
      if (tableFilter) params.table = tableFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getAuditLogs(params);
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to retrieve audit log');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const query = new URLSearchParams({ export: 'csv' });
    if (userFilter.trim()) query.append('user', userFilter.trim());
    if (actionFilter) query.append('action', actionFilter);
    if (tableFilter) query.append('table', tableFilter);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    // Trigger direct download
    const url = `/api/audit-log?${query.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'crms_audit_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('info', 'Exporting audit trail to CSV...');
  };

  const handleClearFilters = () => {
    setUserFilter('');
    setActionFilter('');
    setTableFilter('');
    setStartDate('');
    setEndDate('');
  };

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        accessorKey: 'log_id',
        header: 'Log #',
        cell: (info) => (
          <span className="font-mono text-xs font-bold text-[#B08D3C]">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Timestamp',
        cell: (info) => (
          <span className="font-mono text-[11px] text-[#7A7A7A] whitespace-nowrap">
            {new Date(info.getValue() as string).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'username',
        header: 'Actor',
        cell: ({ row }) => (
          <div className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
            {row.original.username || 'ANONYMOUS'}
            {row.original.user_id && (
              <span className="text-[10px] text-[#7A7A7A] ml-1 font-mono">
                (ID: {row.original.user_id})
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action Event',
        cell: (info) => {
          const action = (info.getValue() as string) || '';
          let badgeClass = 'bg-[#FAF7F0] border-[#D8D2C2] text-[#1F1F1F]';
          if (action.includes('FAILED') || action === 'DELETE') {
            badgeClass = 'bg-red-50 dark:bg-red-950/40 border-[#B3261E] text-[#B3261E]';
          } else if (action === 'LOGIN' || action === 'CREATE') {
            badgeClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-[#386641] text-[#386641]';
          } else if (action === 'SQL_RUN') {
            badgeClass = 'bg-amber-50 dark:bg-amber-950/40 border-[#B08D3C] text-[#B08D3C]';
          } else if (action === 'UPDATE') {
            badgeClass = 'bg-blue-50 dark:bg-blue-950/40 border-[#1F2D3D] text-[#1F2D3D] dark:text-[#8C9AA8]';
          }

          return (
            <span
              className={`inline-block px-1.5 py-0.5 border font-mono text-[10px] font-bold rounded-xs uppercase tracking-wider ${badgeClass}`}
            >
              {action}
            </span>
          );
        },
      },
      {
        accessorKey: 'table_name',
        header: 'Target Entity',
        cell: ({ row }) => {
          const table = row.original.table_name;
          const recId = row.original.record_id;
          return table ? (
            <span className="font-mono text-xs font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
              {table} {recId ? `[#${recId}]` : ''}
            </span>
          ) : (
            <span className="font-mono text-xs text-[#7A7A7A]">SYSTEM</span>
          );
        },
      },
      {
        accessorKey: 'detail',
        header: 'Activity Particulars & Query Audit',
        cell: (info) => {
          const detail = info.getValue() as string | null;
          return (
            <div className="font-mono text-[11px] text-[#6B685F] dark:text-[#A09D95] max-w-md truncate" title={detail || ''}>
              {detail || '—'}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D8D2C2] dark:border-[#383C45]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-typewriter text-lg font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wide">
              Central Bureau Audit Trail & Incident Log
            </h2>
            <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#1F2D3D] text-[#EFE9DC] font-bold uppercase">
              IMMUTABLE RECORD
            </span>
          </div>
          <p className="font-typewriter text-xs text-[#6B685F] dark:text-[#A09D95] mt-1">
            Forensic logging of all authentication events, CRUD operations, and SQL console executions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAuditLogs(1)}
            className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-typewriter border border-[#D8D2C2] dark:border-[#383C45] bg-[#FAF7F0] dark:bg-[#252830] text-[#1F1F1F] dark:text-[#E2DFD8] hover:border-[#B08D3C] rounded-xs transition-fast"
            title="Reload Audit Entries"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">REFRESH</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="h-8 px-3 flex items-center gap-1.5 text-xs font-typewriter font-bold bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] rounded-xs shadow-paper transition-fast"
          >
            <Download size={13} className="text-[#B08D3C]" />
            <span>EXPORT CSV ARCHIVE</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-[#FAF7F0] dark:bg-[#1E2024] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-typewriter font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
          <Filter size={13} className="text-[#B08D3C]" />
          <span>Audit Query Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* User Search */}
          <input
            type="text"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs(1)}
            placeholder="Filter by username / ID..."
            className="px-2.5 py-1.5 bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] placeholder:text-[#A09D95] focus:outline-none focus:border-[#B08D3C]"
          />

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
          >
            <option value="">All Action Types</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="SQL_RUN">SQL_RUN</option>
          </select>

          {/* Target Table */}
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
          >
            <option value="">All Entities</option>
            <option value="POLICE">POLICE</option>
            <option value="CRIMINAL">CRIMINAL</option>
            <option value="COURT_RECORD">COURT_RECORD</option>
            <option value="JAIL">JAIL</option>
            <option value="USERS">USERS</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
            title="Start Date"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
            title="End Date"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => loadAuditLogs(1)}
            className="px-3 py-1 bg-[#1F2D3D] text-[#EFE9DC] text-xs font-typewriter font-bold rounded-xs"
          >
            APPLY FILTERS
          </button>
          <button
            onClick={handleClearFilters}
            className="text-xs font-typewriter text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Dense Audit Log DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        emptyTitle="No audit logs recorded for the selected query filters."
      />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#FAF7F0] dark:bg-[#1E2024] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs">
        <span className="text-[#6B685F] dark:text-[#A09D95]">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} total audit records)
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => loadAuditLogs(pagination.page - 1)}
            className="px-2.5 py-1 border border-[#D8D2C2] dark:border-[#383C45] rounded-xs disabled:opacity-40"
          >
            PREV
          </button>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadAuditLogs(pagination.page + 1)}
            className="px-2.5 py-1 border border-[#D8D2C2] dark:border-[#383C45] rounded-xs disabled:opacity-40"
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
};
