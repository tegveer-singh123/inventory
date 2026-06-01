import { useEffect, useState } from 'react'
import { api, errMsg } from '../api/client'
import { useToast } from '../components/Toast'
import DataTable from '../components/DataTable'

function StatCard({ label, value, loading }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '28px 32px',
      position: 'relative',
      overflow: 'hidden',
      flex: 1,
    }}>
      {/* Gold top bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: 'var(--gold-gradient)',
      }} />
      <div style={{
        fontSize: '10px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: '12px',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 500,
      }}>
        {label}
      </div>
      {loading ? (
        <div style={{
          height: '48px',
          width: '80px',
          borderRadius: '2px',
          background: 'linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-elevated) 50%, var(--bg-hover) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      ) : (
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '48px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}>
          {value}
        </div>
      )}
    </div>
  )
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
        color: 'var(--gold)',
        letterSpacing: '0.06em',
      }}>
        {timeStr}
      </div>
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '11px',
        color: 'var(--text-muted)',
        letterSpacing: '0.05em',
        marginTop: '2px',
      }}>
        {dateStr}
      </div>
    </div>
  )
}

function StockSignalPill({ qty }) {
  const q = Number(qty)
  if (q === 0) return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      padding: '2px 7px',
      background: 'var(--red-dim)',
      color: 'var(--red)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: '10px',
      letterSpacing: '0.06em',
    }}>OUT</span>
  )
  if (q < 5) return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      padding: '2px 7px',
      background: 'var(--red-dim)',
      color: 'var(--red)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: '10px',
      letterSpacing: '0.06em',
    }}>CRITICAL</span>
  )
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      padding: '2px 7px',
      background: 'var(--amber-dim)',
      color: 'var(--amber)',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: '10px',
      letterSpacing: '0.06em',
    }}>LOW</span>
  )
}

const lowStockColumns = [
  {
    key: 'name',
    label: 'Product',
    render: (v, row) => (
      <div>
        <div style={{ fontWeight: 500, marginBottom: '2px' }}>{v}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--gold-dim)' }}>
          {row.sku}
        </div>
      </div>
    )
  },
  {
    key: '_signal',
    label: 'Signal',
    align: 'center',
    render: (_, row) => <StockSignalPill qty={row.quantity_in_stock} />
  },
  {
    key: 'quantity_in_stock',
    label: 'Stock',
    align: 'right',
    render: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
        <div style={{
          width: '60px',
          height: '4px',
          background: 'var(--bg-hover)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min((v / 10) * 100, 100)}%`,
            height: '100%',
            background: v <= 3 ? 'var(--red)' : 'var(--amber)',
            borderRadius: '2px',
            transition: 'width 0.3s',
          }} />
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
          color: v <= 3 ? 'var(--red)' : 'var(--amber)',
          minWidth: '20px',
          textAlign: 'right',
        }}>
          {v}
        </span>
      </div>
    )
  },
]

export default function Dashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState({ products: 0, customers: 0, orders: 0 })
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [lowStockLoading, setLowStockLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard/summary')
        const data = res.data
        setStats({
          products: data.total_products ?? 0,
          customers: data.total_customers ?? 0,
          orders: data.total_orders ?? 0,
        })
        setLowStock(data.low_stock_products ?? [])
      } catch (e) {
        toast.error('Failed to load dashboard: ' + errMsg(e))
      } finally {
        setLoading(false)
        setLowStockLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '32px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
            marginBottom: '4px',
          }}>
            Inventory OS
          </h1>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Operations Dashboard
          </div>
        </div>
        <Clock />
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'flex',
        gap: '1px',
        marginBottom: '40px',
        border: '1px solid var(--border)',
        background: 'var(--border)',
      }}>
        <StatCard label="Products" value={stats.products} loading={loading} />
        <StatCard label="Customers" value={stats.customers} loading={loading} />
        <StatCard label="Orders" value={stats.orders} loading={loading} />
      </div>

      {/* Low Stock Alert */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--amber)',
              fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              Low Stock Alert
            </span>
          </div>
          {!lowStockLoading && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              {lowStock.length} {lowStock.length === 1 ? 'item' : 'items'} below threshold
            </span>
          )}
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderTop: '2px solid var(--amber)',
          overflow: 'hidden',
        }}>
          <DataTable
            columns={lowStockColumns}
            rows={lowStock}
            loading={lowStockLoading}
            emptyMessage="All products are adequately stocked."
          />
        </div>
      </div>
    </div>
  )
}
