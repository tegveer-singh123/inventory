export default function DataTable({ columns, rows, loading, emptyMessage = 'No data found.' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
      }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align || 'left',
                  padding: '10px 16px',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-bright)',
                  fontWeight: 500,
                  fontFamily: 'DM Sans, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                      height: '14px',
                      borderRadius: '2px',
                      background: 'linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-elevated) 50%, var(--bg-hover) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite',
                      width: `${60 + Math.random() * 30}%`,
                    }} />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  color: 'var(--text-muted)',
                  fontSize: '13.5px',
                  fontStyle: 'italic',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id ?? index}
                style={{
                  '--row-index': index,
                  animation: 'rowIn 0.3s ease-out both',
                  animationDelay: `calc(${index} * 30ms)`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      textAlign: col.align || 'left',
                      padding: '12px 16px',
                      fontSize: '13.5px',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border)',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
