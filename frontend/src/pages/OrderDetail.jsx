import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, errMsg } from '../api/client'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [order, setOrder] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const [orderRes, productsRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get('/products'),
      ])
      setOrder(orderRes.data)
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.items ?? []))
    } catch (e) {
      toast.error('Failed to load order: ' + errMsg(e))
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  function getProduct(product_id) {
    return products.find(p => p.id === product_id)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/orders/${id}`)
      toast.success(`Order #${id} deleted.`)
      navigate('/orders')
    } catch (e) {
      toast.error('Failed to delete order: ' + errMsg(e))
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        Loading order...
      </div>
    )
  }

  if (!order) return null

  const items = order.items ?? []
  const total = Number(order.total_amount ?? 0)
  const customerLabel = order.customer?.name ?? order.customer_name ?? `Customer #${order.customer_id}`

  return (
    <div>
      {/* Back link */}
      <div style={{ marginBottom: '28px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/orders')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Orders
        </button>
      </div>

      {/* Order Header */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '26px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
        }}>
          Order #{order.id}
        </h1>
        <StatusBadge status={order.status ?? 'active'} />
      </div>

      <p style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginBottom: '32px',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        Placed {formatDate(order.created_at)} — Customer:{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customerLabel}</span>
      </p>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', marginBottom: '28px' }} />

      {/* Items Section Label */}
      <div style={{
        fontSize: '11px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 600,
        marginBottom: '16px',
      }}>
        Items
      </div>

      {/* Items Table */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '40px',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-bright)' }}>
              {['Product', 'SKU', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                <th key={h} style={{
                  padding: '10px 16px',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  textAlign: i === 0 || i === 1 ? 'left' : 'right',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}>
                  No items in this order.
                </td>
              </tr>
            ) : items.map((item, i) => {
              const product = getProduct(item.product_id)
              const sku = product?.sku ?? '—'
              const name = product?.name ?? `Product #${item.product_id}`
              const unitPrice = Number(item.unit_price ?? 0)
              const lineTotal = Number(item.line_total ?? (unitPrice * item.quantity))

              return (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-surface)',
                }}>
                  <td style={{ padding: '12px 16px', fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--gold)' }}>{sku}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Rs. {unitPrice.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--gold)', fontWeight: 500 }}>
                    Rs. {lineTotal.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border-bright)', background: 'var(--bg-elevated)' }}>
              <td colSpan={4} style={{
                padding: '14px 16px',
                textAlign: 'right',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}>
                Grand Total
              </td>
              <td style={{
                padding: '14px 16px',
                textAlign: 'right',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--gold)',
              }}>
                Rs. {total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Delete Button */}
      <div>
        <button
          className="btn btn-danger"
          onClick={() => setDeleteOpen(true)}
        >
          Delete Order
        </button>
      </div>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Confirm Delete"
        width={420}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
          Delete <strong style={{ color: 'var(--text-primary)' }}>Order #{order.id}</strong>?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Order'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
