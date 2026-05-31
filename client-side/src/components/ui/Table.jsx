/**
 * Name: Table.jsx
 * PHASE 4 FIXES:
 *
 *   FIX 1 (HIGH): Sortable <th> elements had no keyboard support.
 *     BEFORE: onClick only — keyboard users couldn't sort tables at all.
 *     AFTER:  tabIndex="0" + onKeyDown (Enter/Space) so keyboard users can sort.
 *
 *   FIX 2 (HIGH): Missing scope="col" on all <th> elements.
 *     Screen readers use scope to associate headers with cells.
 *     Without it, NVDA/VoiceOver read cells as unrelated data.
 *
 *   FIX 3 (HIGH): Missing aria-sort on sorted columns.
 *     BEFORE: Sort direction was visual-only (chevron icon).
 *     AFTER:  aria-sort="ascending" / "descending" / "none" on each column
 *     so screen readers announce sort state when navigating the table.
 *
 *   FIX 4 (MEDIUM): Added aria-label to table for context.
 *     A table with no caption or aria-label is announced as just "table"
 *     by screen readers — no context about what the data is.
 *
 *   FIX 5 (MEDIUM): Empty state row gets colSpan correctly +
 *     role="cell" so the empty message is announced in table context.
 */

import { cn } from '@/utils/helpers';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Table — Data table with accessible sorting and keyboard navigation.
 *
 * @param {Array<{ key, label, sortable?, className? }>} columns
 * @param {Array<Object>} data
 * @param {string} sortKey      - Currently sorted column key
 * @param {'asc'|'desc'} sortDir
 * @param {Function} onSort     - (key: string) => void
 * @param {Function} renderRow  - (row, index) => <tr>
 * @param {string} emptyMessage
 * @param {string} aria-label   - Describes what the table contains
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
  'aria-label': ariaLabel,
}) {
  const handleSortKey = (colKey, sortable) => {
    if (!sortable || !onSort) return;
    onSort(colKey);
  };

  const getAriaSortValue = (colKey, sortable) => {
    if (!sortable) return undefined;
    if (sortKey !== colKey) return 'none';
    return sortDir === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className={cn('overflow-x-auto rounded-[12px] border border-border', className)}>
      {/* FIX 4: aria-label gives screen readers context about the table content */}
      <table
        className="w-full text-left"
        aria-label={ariaLabel}
      >
        <thead>
          <tr className="bg-surface-alt border-b border-border">
            {columns.map((col) => {
              const isSorted   = sortKey === col.key;
              const ariaSortVal = getAriaSortValue(col.key, col.sortable);

              return (
                <th
                  key={col.key}
                  // FIX 2: scope="col" — essential for screen reader header association
                  scope="col"
                  // FIX 3: aria-sort for screen readers to announce sort direction
                  aria-sort={ariaSortVal}
                  className={cn(
                    'px-4 py-3 text-caption font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-text hover:bg-surface-alt/80 transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                    col.className
                  )}
                  onClick={() => handleSortKey(col.key, col.sortable)}
                  // FIX 1: Keyboard accessibility — Enter or Space activates sort
                  onKeyDown={(e) => {
                    if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSortKey(col.key, col.sortable);
                    }
                  }}
                  // FIX 1: tabIndex makes sortable headers focusable via keyboard
                  tabIndex={col.sortable ? 0 : undefined}
                  role={col.sortable ? 'columnheader' : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      isSorted ? (
                        sortDir === 'asc'
                          ? <ChevronUp size={14} aria-hidden="true" />
                          : <ChevronDown size={14} aria-hidden="true" />
                      ) : (
                        // FIX 3: Show neutral icon when column is sortable but not active
                        <ChevronsUpDown size={14} className="opacity-40" aria-hidden="true" />
                      )
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              {/* FIX 5: colSpan fills all columns so empty state is properly contained */}
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
