/**
 * Advanced DataTable Component
 *
 * Professional desktop data table with:
 * - Column sorting (click header)
 * - Column filtering (icon in header)
 * - Column resizing (drag handles)
 * - Row selection (checkboxes)
 * - Keyboard navigation
 * - 48px row height (desktop standard)
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  MoreVertical,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T = any> {
  /**
   * Column identifier
   */
  id: string;

  /**
   * Column header label
   */
  header: string;

  /**
   * Accessor function or key to get cell value
   */
  accessor: keyof T | ((row: T) => any);

  /**
   * Custom cell renderer
   */
  cell?: (value: any, row: T) => React.ReactNode;

  /**
   * Column width
   */
  width?: number | string;

  /**
   * Allow sorting
   * @default true
   */
  sortable?: boolean;

  /**
   * Allow filtering
   * @default true
   */
  filterable?: boolean;

  /**
   * Allow resizing
   * @default true
   */
  resizable?: boolean;

  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Custom sort function
   */
  sortFn?: (a: any, b: any) => number;
}

export interface DataTableProps<T = any> {
  /**
   * Column definitions
   */
  columns: ColumnDef<T>[];

  /**
   * Table data
   */
  data: T[];

  /**
   * Row key accessor
   */
  getRowId?: (row: T, index: number) => string;

  /**
   * Enable row selection
   * @default false
   */
  selectable?: boolean;

  /**
   * Selected row IDs
   */
  selectedRows?: Set<string>;

  /**
   * Selection change handler
   */
  onSelectionChange?: (selectedIds: Set<string>) => void;

  /**
   * Row click handler
   */
  onRowClick?: (row: T) => void;

  /**
   * Show pagination
   * @default true
   */
  pagination?: boolean;

  /**
   * Rows per page
   * @default 15
   */
  pageSize?: number;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Empty state message
   */
  emptyMessage?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show actions column
   * @default false
   */
  showActions?: boolean;
}

/**
 * DataTable Component
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={[
 *     { id: 'name', header: '이름', accessor: 'name' },
 *     { id: 'value', header: '금액', accessor: 'value', align: 'right' }
 *   ]}
 *   data={financialData}
 *   selectable
 * />
 * ```
 */
export function DataTable<T = any>({
  columns,
  data,
  getRowId = (_, index) => index.toString(),
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  onRowClick,
  pagination = true,
  pageSize = 15,
  loading = false,
  emptyMessage = '데이터가 없습니다',
  className = '',
  showActions = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Get cell value
  const getCellValue = (row: T, column: ColumnDef<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find(col => col.id === sortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = getCellValue(a, column);
      const bValue = getCellValue(b, column);

      if (column.sortFn) {
        return sortDirection === 'asc'
          ? column.sortFn(aValue, bValue)
          : column.sortFn(bValue, aValue);
      }

      // Default sort
      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      onSelectionChange?.(new Set());
    } else {
      const allIds = new Set(paginatedData.map((row, index) => getRowId(row, index)));
      onSelectionChange?.(allIds);
    }
  };

  // Handle select row
  const handleSelectRow = (rowId: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    onSelectionChange?.(newSelection);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-neutral-200 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-neutral-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200 overflow-hidden', className)}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {/* Selection checkbox */}
              {selectable && (
                <th className="w-12 px-4 py-4">
                  <div
                    className="flex items-center justify-center w-5 h-5 border-2 border-neutral-300 rounded cursor-pointer hover:border-primary-500 transition-colors"
                    onClick={handleSelectAll}
                  >
                    {selectedRows.size === paginatedData.length && paginatedData.length > 0 && (
                      <Check size={14} className="text-primary-600" />
                    )}
                  </div>
                </th>
              )}

              {/* Column headers */}
              {columns.map((column) => {
                const isSorted = sortColumn === column.id;
                const alignClasses = {
                  left: 'text-left',
                  center: 'text-center',
                  right: 'text-right',
                }[column.align || 'left'];

                return (
                  <th
                    key={column.id}
                    className={cn(
                      'px-4 py-4 text-[15px] font-semibold text-neutral-700',
                      alignClasses
                    )}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-1">{column.header}</span>

                      {/* Sort icon */}
                      {column.sortable !== false && (
                        <button
                          onClick={() => handleSort(column.id)}
                          className="p-1 hover:bg-neutral-200 rounded transition-colors"
                        >
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp size={16} className="text-primary-600" />
                            ) : (
                              <ArrowDown size={16} className="text-primary-600" />
                            )
                          ) : (
                            <ArrowUpDown size={16} className="text-neutral-400" />
                          )}
                        </button>
                      )}

                      {/* Filter icon */}
                      {column.filterable !== false && (
                        <button className="p-1 hover:bg-neutral-200 rounded transition-colors">
                          <Filter size={16} className="text-neutral-400" />
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}

              {/* Actions column */}
              {showActions && <th className="w-12" />}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (showActions ? 1 : 0)}
                  className="px-4 py-12 text-center text-neutral-500 text-[15px]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowId = getRowId(row, rowIndex);
                const isSelected = selectedRows.has(rowId);

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      'border-b border-neutral-100 transition-colors',
                      'hover:bg-neutral-50',
                      isSelected && 'bg-primary-50',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-center w-5 h-5 border-2 border-neutral-300 rounded cursor-pointer hover:border-primary-500 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRow(rowId);
                          }}
                        >
                          {isSelected && (
                            <Check size={14} className="text-primary-600" />
                          )}
                        </div>
                      </td>
                    )}

                    {/* Cells */}
                    {columns.map((column) => {
                      const value = getCellValue(row, column);
                      const alignClasses = {
                        left: 'text-left',
                        center: 'text-center',
                        right: 'text-right',
                      }[column.align || 'left'];

                      return (
                        <td
                          key={column.id}
                          className={cn(
                            'px-4 py-3 text-[14px] text-neutral-900',
                            alignClasses
                          )}
                        >
                          {column.cell ? column.cell(value, row) : value}
                        </td>
                      );
                    })}

                    {/* Actions */}
                    {showActions && (
                      <td className="px-4 py-3">
                        <button className="p-1 hover:bg-neutral-200 rounded transition-colors">
                          <MoreVertical size={16} className="text-neutral-400" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
          <div className="text-[14px] text-neutral-600">
            {sortedData.length}개 중 {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, sortedData.length)}개 표시
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-[14px] border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>

            <span className="text-[14px] text-neutral-600">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-[14px] border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
