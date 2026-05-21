import type { CSSProperties, ReactNode } from 'react';
import { T } from '@/lib/theme';
import { Avatar } from './Primitives';
import { Icons } from './Icons';

// Unified student-list table. Used by the student rating, mentor students
// list and any other "list of students" surface that isn't the admin
// breakdown (which has its own 14-column shape).

export type Align = 'left' | 'right' | 'center';

export type Column<R> = {
  key: string;
  label: ReactNode;
  align?: Align;
  width?: number | string;
  sortable?: boolean;
  render: (row: R, ctx: { isHighlighted: boolean; index: number }) => ReactNode;
};

export function StudentsTable<R extends { id: string }>({
  columns, rows, onRowClick, highlightId, sortKey, sortDir, onSort, emptyMessage,
}: {
  columns: Column<R>[];
  rows: R[];
  onRowClick?: (row: R) => void;
  highlightId?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '40px 18px', textAlign: 'center', color: T.textSubtle, fontSize: 13 }}>
        {emptyMessage ?? 'Hech narsa topilmadi'}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
            {columns.map(c => {
              const headStyle: CSSProperties = {
                textAlign: c.align ?? 'left',
                padding: '11px 16px',
                fontSize: 11.5,
                fontWeight: 600,
                color: T.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
                width: c.width,
                whiteSpace: 'nowrap',
                cursor: c.sortable ? 'pointer' : 'default',
                userSelect: 'none',
              };
              const arrow = c.sortable && sortKey === c.key
                ? (sortDir === 'desc' ? Icons.arrowRight({ size: 11, stroke: T.text, style: { transform: 'rotate(90deg)' } })
                                       : Icons.arrowRight({ size: 11, stroke: T.text, style: { transform: 'rotate(-90deg)' } }))
                : null;
              return (
                <th key={c.key} onClick={() => c.sortable && onSort?.(c.key)} style={headStyle}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start',
                  }}>
                    {c.label}
                    {arrow}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isHi = highlightId === row.id;
            const baseBg = isHi ? T.bgSubtle : 'transparent';
            return (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none',
                  background: baseBg,
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background .12s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isHi) (e.currentTarget as HTMLTableRowElement).style.background = T.bg; }}
                onMouseLeave={e => { if (!isHi) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
              >
                {columns.map((c, ci) => (
                  <td
                    key={c.key}
                    style={{
                      padding: '12px 16px',
                      textAlign: c.align ?? 'left',
                      position: ci === 0 ? 'relative' : 'static',
                    }}
                  >
                    {ci === 0 && isHi && (
                      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: T.slate900 }} />
                    )}
                    {c.render(row, { isHighlighted: isHi, index: i })}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Common cell renderers ──────────────────────────────────────────────────

export function NameCell({
  name, email, isMe, leading,
}: { name: string; email?: string; isMe?: boolean; leading?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {leading}
      <Avatar name={name} size={30} />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontWeight: isMe ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
        {email && (
          <span style={{ fontSize: 11, color: T.textSubtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </span>
        )}
      </div>
      {isMe && (
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 999,
          background: T.slate900, color: '#fff', fontWeight: 500, flexShrink: 0,
        }}>Sen</span>
      )}
    </div>
  );
}

export function StatusPill({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <span style={{
      fontSize: 11.5, padding: '3px 9px', borderRadius: 999,
      background: bg, color: fg, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export function ScoreCell({ value, danger, muted }: { value: string | number; danger?: boolean; muted?: boolean }) {
  return (
    <span style={{
      fontVariantNumeric: 'tabular-nums',
      fontWeight: 600,
      color: danger ? T.red : muted ? T.textMuted : T.text,
    }}>{value}</span>
  );
}

export function RankCell({ rank, isHighlighted }: { rank: number | string; isHighlighted?: boolean }) {
  return (
    <span style={{
      color: isHighlighted ? T.text : T.textMuted,
      fontVariantNumeric: 'tabular-nums',
      fontWeight: isHighlighted ? 700 : 500,
    }}>{rank}</span>
  );
}
