import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NavIcons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  products: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  customers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  orders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/products', label: 'Products', icon: 'products' },
  { to: '/customers', label: 'Customers', icon: 'customers' },
  { to: '/orders', label: 'Orders', icon: 'orders' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '220px',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{
        padding: '28px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'var(--gold-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 600,
            fontSize: '14px',
            color: '#080A0F',
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}>
            INV
          </div>
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '15px',
            letterSpacing: '0.08em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
            ENTORY OS
          </span>
        </div>
        <div style={{
          marginTop: '16px',
          height: '1px',
          background: 'var(--gold-gradient)',
          opacity: 0.4,
        }} />
      </div>

      {/* Nav Links */}
      <div style={{
        flex: 1,
        padding: '12px 0',
        overflowY: 'auto',
      }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 20px',
              color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '13.5px',
              fontWeight: 500,
              transition: 'all 0.15s',
              borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
              fontFamily: 'DM Sans, sans-serif',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              if (!el.dataset.active) {
                el.style.color = 'var(--text-primary)'
                el.style.background = 'var(--bg-hover)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              if (!el.dataset.active) {
                el.style.color = ''
                el.style.background = ''
              }
            }}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  color: isActive ? 'var(--gold)' : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}>
                  {NavIcons[item.icon]}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* User + Logout */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border)',
      }}>
        {user && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'var(--gold-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: '#080A0F',
                flexShrink: 0,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {user.username?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  fontFamily: 'DM Sans, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user.username}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '7px 10px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--red)'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
            e.currentTarget.style.background = 'var(--red-dim)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'none'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
        <div style={{
          marginTop: '10px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          opacity: 0.6,
        }}>
          v1.0.0
        </div>
      </div>
    </nav>
  )
}
