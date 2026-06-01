import { useEffect, useState, useCallback } from 'react'
import { api, errMsg } from '../api/client'
import { useToast } from '../components/Toast'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const EMPTY_FORM = { name: '', sku: '', price: '', quantity: '' }

function StockBadge({ qty }) {
  const q = Number(qty)
  if (q < 5) return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      padding: '3px 8px',
      background: 'var(--red-dim)',
      color: 'var(--red)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: '2px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      <span>⚠</span> {q} <span style={{ fontSize: '9px', letterSpacing: '0.08em', opacity: 0.8 }}>CRITICAL</span>
    </span>
  )
  if (q < 10) return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      padding: '3px 8px',
      background: 'var(--amber-dim)',
      color: 'var(--amber)',
      border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: '2px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      ↓ {q} <span style={{ fontSize: '9px', letterSpacing: '0.08em', opacity: 0.8 }}>LOW</span>
    </span>
  )
  if (q >= 100) return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      padding: '3px 8px',
      background: 'var(--blue-dim)',
      color: 'var(--blue)',
      border: '1px solid rgba(59,130,246,0.2)',
      borderRadius: '2px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      {q} <span style={{ fontSize: '9px', letterSpacing: '0.08em', opacity: 0.8 }}>HIGH</span>
    </span>
  )
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      padding: '3px 8px',
      background: 'var(--green-dim)',
      color: 'var(--green)',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: '2px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      {q} <span style={{ fontSize: '9px', letterSpacing: '0.08em', opacity: 0.8 }}>OK</span>
    </span>
  )
}

export default function Products() {
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [stockTarget, setStockTarget] = useState(null)
  const [stockQty, setStockQty] = useState('')
  const [stockSubmitting, setStockSubmitting] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/products')
      const data = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
      setProducts(data)
    } catch (e) {
      toast.error('Failed to load products: ' + errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function openAdd() {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(product) {
    setEditProduct(product)
    setForm({
      name: product.name ?? '',
      sku: product.sku ?? '',
      price: product.price ?? '',
      quantity: product.quantity ?? product.stock ?? product.quantity_in_stock ?? '',
    })
    setFormOpen(true)
  }

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.warning('Name is required.'); return }
    if (!form.sku.trim()) { toast.warning('SKU is required.'); return }
    if (Number(form.price) < 0) { toast.warning('Price must be >= 0.'); return }
    if (Number(form.quantity) < 0) { toast.warning('Quantity must be >= 0.'); return }

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: parseFloat(form.price) || 0,
        quantity_in_stock: parseInt(form.quantity) || 0,
      }
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, payload)
        toast.success('Product updated successfully.')
      } else {
        await api.post('/products', payload)
        toast.success('Product created successfully.')
      }
      setFormOpen(false)
      fetchProducts()
    } catch (e) {
      toast.error('Failed to save product: ' + errMsg(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/products/${deleteTarget.id}`)
      toast.success(`"${deleteTarget.name}" deleted.`)
      setDeleteTarget(null)
      fetchProducts()
    } catch (e) {
      toast.error('Failed to delete product: ' + errMsg(e))
    } finally {
      setDeleting(false)
    }
  }

  function openStockAdjust(product) {
    setStockTarget(product)
    setStockQty(String(product.quantity_in_stock ?? 0))
  }

  async function handleStockUpdate(e) {
    e.preventDefault()
    if (!stockTarget) return
    const qty = parseInt(stockQty)
    if (isNaN(qty) || qty < 0) { toast.warning('Quantity must be >= 0.'); return }
    setStockSubmitting(true)
    try {
      await api.patch(`/products/${stockTarget.id}/stock`, { quantity_in_stock: qty })
      toast.success(`Stock updated to ${qty} units.`)
      setStockTarget(null)
      fetchProducts()
    } catch (e) {
      toast.error('Failed to update stock: ' + errMsg(e))
    } finally {
      setStockSubmitting(false)
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (v) => <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{v}</span>
    },
    { key: 'name', label: 'Name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    {
      key: 'sku',
      label: 'SKU',
      render: (v) => <span className="mono" style={{ fontSize: '12px', color: 'var(--gold)' }}>{v}</span>
    },
    {
      key: 'price',
      label: 'Price',
      align: 'right',
      render: (v) => (
        <span className="mono" style={{ fontSize: '13px' }}>
          Rs. {Number(v).toFixed(2)}
        </span>
      )
    },
    {
      key: 'quantity_in_stock',
      label: 'Stock',
      align: 'center',
      render: (v) => <StockBadge qty={v ?? 0} />
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
            className="btn btn-ghost btn-sm"
            onClick={() => openEdit(row)}
          >
            Edit
          </button>
          <button
            className="btn btn-ghost-blue btn-sm"
            onClick={() => openStockAdjust(row)}
          >
            Adj. Stock
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
        <h1 className="page-title">Products</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          rows={products}
          loading={loading}
          emptyMessage="No products found. Add your first product above."
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editProduct ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="e.g. Brass Fitting M12"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">SKU / Code *</label>
            <input
              className="form-input mono"
              name="sku"
              value={form.sku}
              onChange={handleFormChange}
              placeholder="e.g. BF-M12-001"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Price</label>
              <input
                className="form-input"
                type="number"
                name="price"
                value={form.price}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity in Stock</label>
              <input
                className="form-input"
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleFormChange}
                min="0"
                step="1"
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editProduct ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal
        isOpen={!!stockTarget}
        onClose={() => setStockTarget(null)}
        title="Adjust Stock"
        width={420}
      >
        <form onSubmit={handleStockUpdate}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{stockTarget?.name}</strong>
            {' '}— Current stock:{' '}
            <span className="mono" style={{ color: 'var(--gold)' }}>{stockTarget?.quantity_in_stock ?? 0}</span>
          </p>
          <div className="form-group">
            <label className="form-label">New Stock Quantity</label>
            <input
              className="form-input"
              type="number"
              value={stockQty}
              onChange={e => setStockQty(e.target.value)}
              min="0"
              step="1"
              placeholder="0"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStockTarget(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={stockSubmitting}>
              {stockSubmitting ? 'Updating...' : 'Update Stock'}
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
          Delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.name}</strong>?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
