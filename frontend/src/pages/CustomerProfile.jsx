import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api, errMsg } from '../api/client'
import { useToast } from '../components/Toast'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'

function StatCard({ label, value }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      padding: '24px 28px',
      position: 'relative',
      overflow: 'hidden',
      flex: 1,
    }}>
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
        marginBottom: '10px',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 500,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '32px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  )
}

const EMPTY_EDIT = { full_name: '', email: '', phone: '' }

export default function CustomerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [submitting, setSubmitting] = useState(false)

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await api.get(`/customers/${id}`)
      setCustomer(res.data)
    } catch (e) {
      toast.error('Failed to load customer: ' + errMsg(e))
      navigate('/customers')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res = await api.get(`/customers/${id}/orders`)
      setOrders(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      toast.error('Failed to load orders: ' + errMsg(e))
    } finally {
      setOrdersLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCustomer()
    fetchOrders()
  }, [fetchCustomer, fetchOrders])

  function openEdit() {
    if (!customer) return
    setEditForm({
      full_name: customer.full_name ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
    })
    setEditOpen(true)
  }

  function handleEditChange(e) {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editForm.full_name.trim()) { toast.warning('Full name is required.'); return }
    if (!editForm.email.trim()) { toast.warning('Email is required.'); return }
    setSubmitting(true)
    try {
      await api.put(`/customers/${id}`, {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
      })
      toast.success('Customer updated successfully.')
      setEditOpen(false)
      fetchCustomer()
    } catch (e) {
      toast.error('Failed to update customer: ' + errMsg(e))
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  // Stats derived from orders
  const totalOrders = orders.length
  const totalSpent = orders.reduce((acc, o) => acc + Number(o.total_amount ?? 0), 0)
  const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0

  const orderColumns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (v) => (
        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{v}</span>
      )
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (v) => (
        <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {Array.isArray(v) ? v.length : '—'}
        </span>
      )
    },
    {
      key: 'total_amount',
      label: 'Total',
      align: 'right',
      render: (v) => (
        <span className="mono" style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 500 }}>
          Rs. {Number(v ?? 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <StatusBadge status={v ?? 'pending'} />
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (v) => <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(v)}</span>
    },
    {
      key: '_actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <Link
          to={`/orders/${row.id}`}
          className="btn btn-ghost-blue btn-sm"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          View
        </Link>
      )
    }
  ]

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        Loading customer...
      </div>
    )
  }

  const initial = customer?.full_name ? customer.full_name.charAt(0).toUpperCase() : '?'
  const memberSince = customer?.created_at
    ? new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div>
      {/* Back link */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/customers')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Customers
        </button>
      </div>

      {/* Customer Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Avatar */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--gold-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Playfair Display, serif',
              fontSize: '26px',
              fontWeight: 700,
              color: '#080A0F',
              flexShrink: 0,
            }}>
              {initial}
            </div>

            {/* Info */}
            <div>
              <h1 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}>
                {customer?.full_name}
              </h1>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {customer?.email}
                </span>
                {customer?.phone && (
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {customer.phone}
                  </span>
                )}
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                Member since {memberSince}
              </div>
            </div>
          </div>

          <button className="btn btn-ghost" onClick={openEdit}>
            Edit
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'flex',
        gap: '1px',
        marginBottom: '40px',
        border: '1px solid var(--border)',
        background: 'var(--border)',
      }}>
        <StatCard label="Orders" value={totalOrders} />
        <StatCard label="Total Spent" value={`Rs. ${totalSpent.toFixed(2)}`} />
        <StatCard label="Avg. Order" value={`Rs. ${avgOrder.toFixed(2)}`} />
      </div>

      {/* Order History */}
      <div>
        <div style={{
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontWeight: 600,
          marginBottom: '16px',
        }}>
          Order History
        </div>
        <div className="card">
          <DataTable
            columns={orderColumns}
            rows={orders}
            loading={ordersLoading}
            emptyMessage="No orders found for this customer."
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Customer"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              name="full_name"
              value={editForm.full_name}
              onChange={handleEditChange}
              placeholder="e.g. Jane Hartwell"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              className="form-input mono"
              type="email"
              name="email"
              value={editForm.email}
              onChange={handleEditChange}
              placeholder="jane@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-input mono"
              type="tel"
              name="phone"
              value={editForm.phone}
              onChange={handleEditChange}
              placeholder="+1 555 000 0000"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
