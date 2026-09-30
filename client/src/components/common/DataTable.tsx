import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { Download, ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  exportFileName?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbarRight?: React.ReactNode;
}

export function DataTable<TData extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  onRowClick,
  exportFileName = 'export-records.csv',
  pageSize = 15,
  emptyTitle,
  emptyDescription,
  toolbarRight,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const exportToCSV = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original);
    if (rows.length === 0) return;

    const exportableCols = columns.filter((c: any) => c.accessorKey || c.id);
    const headers = exportableCols.map((c: any) => (typeof c.header === 'string' ? c.header : (c.id || c.accessorKey)));

    const csvLines = [headers.join(',')];

    rows.forEach((row) => {
      const line = exportableCols.map((col: any) => {
        const key = col.accessorKey || col.id;
        const val = row[key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvLines.push(line.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-2">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search table index..."
              className="h-8 pl-7 pr-2.5 text-xs bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] placeholder:text-[#7A7A7A] font-typewriter focus:outline-none focus:ring-1 focus:ring-[#B08D3C] w-48 sm:w-64"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-[#7A7A7A]" />
          </div>
          <span className="font-mono text-xs text-[#7A7A7A] tabular-nums">
            [{table.getFilteredRowModel().rows.length} records]
          </span>
        </div>

        <div className="flex items-center gap-2">
          {toolbarRight}
          <button
            onClick={exportToCSV}
            disabled={data.length === 0 || isLoading}
            className="h-8 px-2.5 flex items-center gap-1.5 font-typewriter text-xs font-semibold bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] hover:border-[#B08D3C] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] dark:hover:bg-[#252830] disabled:opacity-50 transition-fast shadow-paper"
            title="Export Records to CSV"
          >
            <Download size={13} className="text-[#B08D3C]" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder bg-[#F6F0E0] dark:bg-[#1F2228] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-[#D9D0BE] dark:border-[#2E323B] bg-[#E6DFCD] dark:bg-[#1A1C20] sticky top-0"
                >
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const isSorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`px-3 py-2.5 font-typewriter font-bold text-[11px] uppercase tracking-wider text-[#1F1F1F] dark:text-[#E2DFD8] select-none ${
                          canSort ? 'cursor-pointer hover:bg-[#D9D0BE]/70 dark:hover:bg-[#252830]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-[#7A7A7A]">
                              {isSorted === 'asc' ? (
                                <ChevronUp size={12} className="text-[#B3261E]" />
                              ) : isSorted === 'desc' ? (
                                <ChevronDown size={12} className="text-[#B3261E]" />
                              ) : (
                                <ChevronsUpDown size={12} className="opacity-30" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#E6DFCD] dark:divide-[#2E323B]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <TableSkeleton rows={pageSize > 8 ? 8 : pageSize} cols={columns.length} />
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-4">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={`hover:bg-[#EFE9DC]/90 dark:hover:bg-[#252830] transition-fast ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 text-[#1F1F1F] dark:text-[#E2DFD8]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#D9D0BE] dark:border-[#2E323B] bg-[#E6DFCD]/60 dark:bg-[#1A1C20]/60 text-xs">
            <span className="font-typewriter text-[#7A7A7A] text-[11px] tabular-nums">
              DOSSIER PAGE {table.getState().pagination.pageIndex + 1} OF {table.getPageCount()}
            </span>
            <div className="flex items-center gap-1 font-typewriter">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-0.5 rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] dark:hover:bg-[#252830] disabled:opacity-40"
              >
                PREV
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-2 py-0.5 rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] dark:hover:bg-[#252830] disabled:opacity-40"
              >
                NEXT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
