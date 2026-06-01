export default function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()

  let cls = 'badge'
  if (s === 'active' || s === 'completed' || s === 'delivered') {
    cls += ' badge-green'
  } else if (s === 'cancelled' || s === 'canceled' || s === 'failed') {
    cls += ' badge-red'
  } else if (s === 'pending' || s === 'processing') {
    cls += ' badge-amber'
  } else {
    cls += ' badge-blue'
  }

  return <span className={cls}>{status}</span>
}
