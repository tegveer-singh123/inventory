import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, errMsg } from '../api/client'
import { useToast } from '../components/Toast'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const EMPTY_FORM = { name: '', email: '', phone: '' }

export default function Customers() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/customers')
      const data = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
      setCustomers(data)
    } catch (e) {
      toast.error('Failed to load customers: ' + errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  function openAdd() {
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const fullName = form.name.trim()
    const email = form.email.trim()
    if (!fullName) { toast.warning('Full name is required.'); return }
    if (!email) { toast.warning('Email is required.'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.warning('Please enter a valid email address.'); return }

    setSubmitting(true)
    try {
      await api.post('/customers', {
        full_name: fullName,
        email,
        phone: form.phone.trim() || '',
      })
      toast.success('Customer added successfully.')
      setFormOpen(false)
      fetchCustomers()
    } catch (e) {
      toast.error('Failed to add customer: ' + errMsg(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/customers/${deleteTarget.id}`)
      toast.success(`"${deleteTarget.full_name}" deleted.`)
      setDeleteTarget(null)
      fetchCustomers()
    } catch (e) {
      toast.error('Failed to delete customer: ' + errMsg(e))
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
      key: 'full_name',
      label: 'Full Name',
      render: (v) => <span style={{ fontWeight: 500 }}>{v}</span>
    },
    {
      key: 'email',
      label: 'Email',
      render: (v) => (
        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v}</span>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (v) => (
        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {v || '—'}
        </span>
      )
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
            onClick={() => navigate(`/customers/${row.id}`)}
          >
            Profile
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

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          rows={customers}
          loading={loading}
          emptyMessage="No customers found. Add your first customer above."
        />
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Customer"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleFormChange}
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
              value={form.email}
              onChange={handleFormChange}
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
              value={form.phone}
              onChange={handleFormChange}
              placeholder="+1 555 000 0000"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Customer'}
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
          Delete customer <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.full_name}</strong>?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Customer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
