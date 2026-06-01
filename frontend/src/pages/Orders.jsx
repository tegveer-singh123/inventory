import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, errMsg } from '../api/client'
import { useToast } from '../components/Toast'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'

const EMPTY_ITEM = { product_id: '', quantity: 1 }

function OrderDetailModal({ order, onClose }) {
  if (!order) return null

  const items = order.items ?? order.order_items ?? []
  const total = order.total ?? order.total_amount ?? 0

  return (
    <Modal isOpen={!!order} onClose={onClose} title={`Order #${order.id}`} width={560}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Customer
            </div>
            <div style={{ fontWeight: 500 }}>
              {order.customer?.name ?? order.customer_name ?? `ID #${order.customer_id}`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Status
            </div>
            <StatusBadge status={order.status ?? 'pending'} />
          </div>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Date
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
              {['Product', 'Qty', 'Unit Price', 'Line Total'].map(h => (
                <th key={h} style={{
                  padding: '9px 14px',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  textAlign: h === 'Product' ? 'left' : 'right',
                  fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No items
                </td>
              </tr>
            ) : items.map((item, i) => {
              const unitPrice = item.unit_price ?? item.price ?? 0
              const qty = item.quantity ?? 1
              const lineTotal = unitPrice * qty
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: '13.5px' }}>
                    {item.product?.name ?? item.product_name ?? `Product #${item.product_id}`}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                    {qty}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Rs. {Number(unitPrice).toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--gold)' }}>
                    Rs. {Number(lineTotal).toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border-bright)' }}>
              <td colSpan={3} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>
                Grand Total
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', fontWeight: 500, color: 'var(--gold)' }}>
                Rs. {Number(total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  )
}

export default function Orders() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Create order form state
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders')
      const data = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
      setOrders(data)
    } catch (e) {
      toast.error('Failed to load orders: ' + errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSupportData = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products'),
      ])
      setCustomers(Array.isArray(cRes.data) ? cRes.data : (cRes.data?.items ?? []))
      setProducts(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.items ?? []))
    } catch (e) {
      toast.error('Failed to load reference data: ' + errMsg(e))
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchSupportData()
  }, [fetchOrders, fetchSupportData])

  function openCreate() {
    setCustomerId('')
    setItems([{ ...EMPTY_ITEM }])
    setCreateOpen(true)
  }

  function addItem() {
    setItems(prev => [...prev, { ...EMPTY_ITEM }])
  }

  function removeItem(index) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index, field, value) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it))
  }

  function getProductById(id) {
    return products.find(p => String(p.id) === String(id))
  }

  function calcTotal() {
    return items.reduce((acc, item) => {
      const p = getProductById(item.product_id)
      if (!p || !item.quantity) return acc
      return acc + (Number(p.price) * Number(item.quantity))
    }, 0)
  }

  async function handleCreateOrder(e) {
    e.preventDefault()
    if (!customerId) { toast.warning('Please select a customer.'); return }
    const validItems = items.filter(it => it.product_id && Number(it.quantity) > 0)
    if (validItems.length === 0) { toast.warning('Add at least one item with a product and quantity > 0.'); return }

    setSubmitting(true)
    try {
      const payload = {
        customer_id: parseInt(customerId),
        items: validItems.map(it => ({
          product_id: parseInt(it.product_id),
          quantity: parseInt(it.quantity),
        })),
      }
      await api.post('/orders', payload)
      toast.success('Order created successfully.')
      setCreateOpen(false)
      fetchOrders()
    } catch (e) {
      toast.error('Failed to create order: ' + errMsg(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/orders/${deleteTarget.id}`)
      toast.success(`Order #${deleteTarget.id} deleted.`)
      setDeleteTarget(null)
      fetchOrders()
    } catch (e) {
      toast.error('Failed to delete order: ' + errMsg(e))
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (v) => <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{v}</span>
    },
    {
      key: 'customer_id',
      label: 'Customer',
      render: (v, row) => {
        const name = row.customer?.name ?? row.customer_name
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{name ?? '—'}</div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID #{v}</div>
          </div>
        )
      }
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (v, row) => {
        const count = Array.isArray(v) ? v.length : (Array.isArray(row.order_items) ? row.order_items.length : (row.item_count ?? '—'))
        return <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{count}</span>
      }
    },
    {
      key: 'total_amount',
      label: 'Total',
      align: 'right',
      render: (v) => {
        const total = v ?? 0
        return (
          <span className="mono" style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 500 }}>
            Rs. {Number(total).toFixed(2)}
          </span>
        )
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <StatusBadge status={v ?? 'pending'} />
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (v) => <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(v)}</span>
    },
    {
      key: '_actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-ghost-blue btn-sm"
            onClick={() => navigate(`/orders/${row.id}`)}
          >
            View
          </button>
          <button
            className="btn btn-ghost-danger btn-sm"
            onClick={() => setDeleteTarget(row)}
          >
            Delete
          </button>
        </div>
      )
    }
  ]

  const grandTotal = calcTotal()

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Order
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          rows={orders}
          loading={loading}
          emptyMessage="No orders found. Create your first order above."
        />
      </div>

      {/* View Order Detail Modal */}
      <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />

      {/* Create Order Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Order"
        width={580}
      >
        <form onSubmit={handleCreateOrder}>
          {/* Customer Select */}
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select
              className="form-select"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              required
            >
              <option value="">— Select customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.full_name} (#{c.id})</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <label className="form-label" style={{ margin: 0 }}>Order Items *</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={addItem}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, index) => {
                const selectedProduct = getProductById(item.product_id)
                const lineTotal = selectedProduct && item.quantity > 0
                  ? Number(selectedProduct.price) * Number(item.quantity)
                  : 0

                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 90px 28px',
                      gap: '8px',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: '2px',
                    }}
                  >
                    {/* Product */}
                    <select
                      className="form-select"
                      value={item.product_id}
                      onChange={e => updateItem(index, 'product_id', e.target.value)}
                      style={{ margin: 0 }}
                    >
                      <option value="">— Product —</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Rs. {Number(p.price).toFixed(2)}
                        </option>
                      ))}
                    </select>

                    {/* Qty */}
                    <input
                      className="form-input"
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', e.target.value)}
                      min="1"
                      step="1"
                      placeholder="Qty"
                      style={{ margin: 0, textAlign: 'right' }}
                    />

                    {/* Line total */}
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: lineTotal > 0 ? 'var(--gold)' : 'var(--text-muted)',
                      textAlign: 'right',
                      padding: '0 4px',
                    }}>
                      {lineTotal > 0 ? `Rs. ${lineTotal.toFixed(2)}` : '—'}
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        color: items.length === 1 ? 'var(--text-muted)' : 'var(--red)',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                        borderRadius: '2px',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Grand Total */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            marginBottom: '20px',
          }}>
            <span style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}>
              Estimated Total
            </span>
            <span style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px',
              fontWeight: 600,
              color: grandTotal > 0 ? 'var(--gold)' : 'var(--text-muted)',
            }}>
              Rs. {grandTotal.toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete"
        width={420}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
          Delete <strong style={{ color: 'var(--text-primary)' }}>Order #{deleteTarget?.id}</strong>?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Order'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
