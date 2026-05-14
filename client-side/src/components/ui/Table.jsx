import { cn } from '@/utils/helpers';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Table — Data table with optional sorting indicators.
 *
 * @param {Array<{ key: string, label: string, sortable?: boolean, className?: string }>} columns
 * @param {Array<Object>} data
 * @param {string} sortKey
 * @param {'asc'|'desc'} sortDir
 * @param {Function} onSort
 * @param {Function} renderRow - (row, index) => <tr>...</tr>
 * @param {string} emptyMessage
 */
export default function Table({
  columns = [],
  data = [],
  sortKey,
  sortDir,
  onSort,
  renderRow,
  emptyMessage = 'No data found',
  className,
}) {
  return (
    <div className={cn('overflow-x-auto rounded-[12px] border border-border', className)}>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-surface-alt border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap',
                  col.sortable && 'cursor-pointer select-none hover:text-text transition-colors',
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDir === 'asc' ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-text-muted text-body-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => renderRow(row, i))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * TableCell — Convenience wrapper for <td>.
 */
export function TableCell({ children, className, ...props }) {
  return (
    <td
      className={cn('px-4 py-3 text-body-sm text-text whitespace-nowrap', className)}
      {...props}
    >
      {children}
    </td>
  );
}
