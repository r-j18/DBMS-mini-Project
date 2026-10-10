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
  VisibilityState,
} from '@tanstack/react-table';
import {
  Download,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Filter,
  Columns3,
  X,
  RotateCcw,
} from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { useResponsive } from '../../hooks/useResponsive';

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
  mobileCardRenderer?: (row: TData) => React.ReactNode;
  filterSheetContent?: React.ReactNode;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  stickyFirstColumn?: boolean;
  defaultColumnVisibility?: VisibilityState;
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
  mobileCardRenderer,
  filterSheetContent,
  onResetFilters,
  hasActiveFilters = false,
  stickyFirstColumn = true,
  defaultColumnVisibility = {},
}: DataTableProps<TData>) {
  const { isMobile, isTablet } = useResponsive();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultColumnVisibility);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
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

    const visibleCols = table.getVisibleLeafColumns().filter((c: any) => c.accessorKey || c.id);
    const headers = visibleCols.map((c: any) =>
      typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id || c.accessorKey
    );

    const csvLines = [headers.join(',')];

    rows.forEach((row) => {
      const line = visibleCols.map((col: any) => {
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

  const paginatedRows = table.getRowModel().rows;
  const totalFilteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="w-full space-y-3">
      {/* Table / List Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5">
        {/* Search & Record Count */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search table index..."
              className="h-11 sm:h-8 pl-8 pr-2.5 text-base sm:text-xs bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] placeholder:text-[#7A7A7A] font-typewriter focus:outline-none focus:ring-1 focus:ring-[#B08D3C] w-full sm:w-64"
            />
            <Search size={14} className="absolute left-2.5 top-3.5 sm:top-2 text-[#7A7A7A]" />
          </div>

          <span className="font-mono text-xs text-[#7A7A7A] tabular-nums shrink-0">
            [{totalFilteredCount} records]
          </span>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 shrink-0">
          {/* Mobile Filter Button (Opens Bottom Sheet) */}
          {isMobile && filterSheetContent && (
            <button
              onClick={() => setShowFilterSheet(true)}
              className={`h-11 px-3 flex items-center gap-1.5 font-typewriter text-xs font-semibold rounded-xs border transition-colors shadow-paper ${
                hasActiveFilters
                  ? 'bg-[#B08D3C] text-[#1F1F1F] border-[#8C6C26] font-bold'
                  : 'bg-[#F6F0E0] dark:bg-[#1F2228] border-[#D9D0BE] dark:border-[#2E323B] text-[#1F1F1F] dark:text-[#E2DFD8]'
              }`}
              aria-label="Filter records"
            >
              <Filter size={14} className={hasActiveFilters ? 'text-[#1F1F1F]' : 'text-[#B08D3C]'} />
              <span>FILTERS {hasActiveFilters ? '●' : ''}</span>
            </button>
          )}

          {/* Columns Visibility Menu on Tablet/Desktop */}
          {!isMobile && (
            <div className="relative">
              <button
                onClick={() => setShowColumnsMenu((prev) => !prev)}
                className="h-8 px-2.5 flex items-center gap-1.5 font-typewriter text-xs font-semibold bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] hover:border-[#B08D3C] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] transition-colors shadow-paper"
                title="Select Visible Columns"
                aria-label="Toggle visible columns"
              >
                <Columns3 size={13} className="text-[#B08D3C]" />
                <span className="hidden sm:inline">COLUMNS</span>
              </button>

              {showColumnsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowColumnsMenu(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs shadow-2xl z-50 p-2 text-xs space-y-1.5 max-h-72 overflow-y-auto font-typewriter">
                    <div className="text-[10px] font-bold text-[#7A7A7A] uppercase pb-1 border-b border-[#D9D0BE] dark:border-[#2E323B]">
                      Visible Columns
                    </div>
                    {table.getAllLeafColumns().map((column) => {
                      if (typeof column.columnDef.header !== 'string') return null;
                      return (
                        <label
                          key={column.id}
                          className="flex items-center gap-2 px-1 py-1 hover:bg-[#EFE9DC] dark:hover:bg-[#252830] rounded cursor-pointer text-[#1F1F1F] dark:text-[#E2DFD8]"
                        >
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="accent-[#B08D3C] rounded-xs"
                          />
                          <span className="truncate">{column.columnDef.header}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {toolbarRight}

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            disabled={data.length === 0 || isLoading}
            className="h-11 sm:h-8 px-2.5 sm:px-3 flex items-center gap-1.5 font-typewriter text-xs font-semibold bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] hover:border-[#B08D3C] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] dark:hover:bg-[#252830] disabled:opacity-50 transition-colors shadow-paper shrink-0"
            title="Export Records to CSV"
            aria-label="Export records to CSV"
          >
            <Download size={14} className="text-[#B08D3C]" />
            <span className="hidden sm:inline">EXPORT CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>

      {/* MOBILE RECORD CARDS VIEW (< 768px when mobileCardRenderer is passed) */}
      {isMobile && mobileCardRenderer ? (
        <div className="space-y-2.5">
          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-[#F6F0E0]/80 dark:bg-[#1F2228]/80 border border-[#D9D0BE] dark:border-[#2E323B] rounded animate-pulse"
                />
              ))}
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="p-4 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder">
              <EmptyState title={emptyTitle} description={emptyDescription} />
            </div>
          ) : (
            paginatedRows.map((row) => (
              <div
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={`bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-3 sm:p-4 transition-colors ${
                  onRowClick ? 'cursor-pointer active:bg-[#EFE9DC] dark:active:bg-[#252830]' : ''
                }`}
              >
                {mobileCardRenderer(row.original)}
              </div>
            ))
          )}

          {/* Mobile Pagination Controls */}
          {!isLoading && table.getPageCount() > 1 && (
            <div className="flex items-center justify-between p-3 border border-[#D9D0BE] dark:border-[#2E323B] rounded bg-[#E6DFCD]/60 dark:bg-[#1A1C20]/60 text-xs">
              <span className="font-typewriter text-[#7A7A7A] text-[11px] tabular-nums">
                PAGE {table.getState().pagination.pageIndex + 1} OF {table.getPageCount()}
              </span>
              <div className="flex items-center gap-2 font-typewriter">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="min-h-[44px] px-3 rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] bg-[#F6F0E0] dark:bg-[#1F2228] text-[#1F1F1F] dark:text-[#E2DFD8] disabled:opacity-40"
                  aria-label="Previous page"
                >
                  PREV
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="min-h-[44px] px-3 rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] bg-[#F6F0E0] dark:bg-[#1F2228] text-[#1F1F1F] dark:text-[#E2DFD8] disabled:opacity-40"
                  aria-label="Next page"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TABLET & DESKTOP TABLE VIEW (or dense mobile table when mobileCardRenderer is omitted) */
        <div className="border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder bg-[#F6F0E0] dark:bg-[#1F2228] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-[#D9D0BE] dark:border-[#2E323B] bg-[#E6DFCD] dark:bg-[#1A1C20] sticky top-0 z-20"
                  >
                    {headerGroup.headers.map((header, idx) => {
                      const canSort = header.column.getCanSort();
                      const isSorted = header.column.getIsSorted();
                      const isFirst = stickyFirstColumn && idx === 0;

                      return (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={`px-3 py-2.5 font-typewriter font-bold text-[11px] uppercase tracking-wider text-[#1F1F1F] dark:text-[#E2DFD8] select-none whitespace-nowrap ${
                            canSort ? 'cursor-pointer hover:bg-[#D9D0BE]/70 dark:hover:bg-[#252830]' : ''
                          } ${
                            isFirst
                              ? 'sticky left-0 z-30 bg-[#E6DFCD] dark:bg-[#1A1C20] shadow-[2px_0_4px_rgba(0,0,0,0.06)]'
                              : ''
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
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="p-4">
                      <EmptyState title={emptyTitle} description={emptyDescription} />
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick && onRowClick(row.original)}
                      className={`group hover:bg-[#EFE9DC]/90 dark:hover:bg-[#252830] transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                      }`}
                    >
                      {row.getVisibleCells().map((cell, idx) => {
                        const isFirst = stickyFirstColumn && idx === 0;
                        return (
                          <td
                            key={cell.id}
                            className={`px-3 py-2 text-[#1F1F1F] dark:text-[#E2DFD8] whitespace-nowrap ${
                              isFirst
                                ? 'sticky left-0 z-10 bg-[#F6F0E0] dark:bg-[#1F2228] group-hover:bg-[#EFE9DC] dark:group-hover:bg-[#252830] shadow-[2px_0_4px_rgba(0,0,0,0.06)]'
                                : ''
                            }`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Desktop/Tablet Pagination Bar */}
          {!isLoading && table.getPageCount() > 1 && (
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-[#D9D0BE] dark:border-[#2E323B] bg-[#E6DFCD]/60 dark:bg-[#1A1C20]/60 text-xs">
              <span className="font-typewriter text-[#7A7A7A] text-[11px] tabular-nums">
                DOSSIER PAGE {table.getState().pagination.pageIndex + 1} OF {table.getPageCount()}
              </span>
              <div className="flex items-center gap-1.5 font-typewriter">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="min-h-[36px] sm:min-h-0 px-2.5 py-1 rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] dark:hover:bg-[#252830] disabled:opacity-40"
                  aria-label="Previous page"
                >
                  PREV
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="min-h-[36px] sm:min-h-0 px-2.5 py-1 rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] dark:hover:bg-[#252830] disabled:opacity-40"
                  aria-label="Next page"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MOBILE FILTERS BOTTOM SHEET */}
      {isMobile && showFilterSheet && (
        <div className="fixed inset-0 z-50 select-none" role="dialog" aria-modal="true" aria-label="Filter parameters">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setShowFilterSheet(false)}
            aria-hidden="true"
          />

          {/* Sheet sliding up */}
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-[#F6F0E0] dark:bg-[#1F2228] border-t-2 border-[#B08D3C] rounded-t-lg shadow-2xl flex flex-col z-50 pb-safe">
            {/* Sheet Header */}
            <div className="px-4 py-3 border-b border-[#D9D0BE] dark:border-[#2E323B] flex items-center justify-between bg-[#EFE9DC] dark:bg-[#17212D]">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-[#B08D3C]" />
                <span className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
                  Filter Records
                </span>
              </div>
              <button
                onClick={() => setShowFilterSheet(false)}
                className="w-10 h-10 flex items-center justify-center text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-[#E2DFD8]"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sheet Filter Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {filterSheetContent}
            </div>

            {/* Sheet Footer with Apply & Reset Buttons */}
            <div className="p-3 border-t border-[#D9D0BE] dark:border-[#2E323B] flex items-center gap-2 bg-[#FAF7F0] dark:bg-[#17212D]">
              {onResetFilters && (
                <button
                  type="button"
                  onClick={() => {
                    onResetFilters();
                    setShowFilterSheet(false);
                  }}
                  className="flex-1 min-h-[44px] px-3 flex items-center justify-center gap-1.5 font-typewriter text-xs border border-[#D9D0BE] dark:border-[#2E323B] text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-[#E2DFD8] rounded-xs"
                >
                  <RotateCcw size={13} />
                  <span>RESET</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilterSheet(false)}
                className="flex-1 min-h-[44px] px-4 font-typewriter text-xs font-bold bg-[#B08D3C] hover:bg-[#8C6C26] text-[#1F1F1F] rounded-xs shadow-paper"
              >
                APPLY FILTERS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
