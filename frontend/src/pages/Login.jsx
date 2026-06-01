import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, errMsg } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Email is required'); return }
    if (!password) { setError('Password is required'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password })
      login(res.data)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  function fillDemo() {
    setEmail('admin@example.com')
    setPassword('admin123')
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background geometric decoration */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(200,164,110,0.08) 0%, transparent 60%),
          linear-gradient(rgba(200,164,110,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,164,110,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 48px 48px, 48px 48px',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        animation: 'slideUp 0.4s ease-out both',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '10px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'var(--gold-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              fontSize: '18px',
              color: '#080A0F',
              flexShrink: 0,
            }}>
              I
            </div>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '22px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.06em',
            }}>
              NVENTORY OS
            </span>
          </div>
          <div style={{
            fontSize: '11px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Operations & Management Platform
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Gold top accent */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '2px',
            background: 'var(--gold-gradient)',
          }} />

          <div style={{ padding: '36px 32px 32px' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}>
              Sign in
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '28px',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Access your inventory dashboard
            </p>

            {/* Demo credentials callout */}
            <div style={{
              background: 'rgba(200,164,110,0.07)',
              border: '1px solid rgba(200,164,110,0.25)',
              borderLeft: '3px solid var(--gold)',
              padding: '14px 16px',
              marginBottom: '24px',
              borderRadius: '1px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}>
                <span style={{
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  Demo Credentials
                </span>
                <button
                  type="button"
                  onClick={fillDemo}
                  style={{
                    background: 'rgba(200,164,110,0.15)',
                    border: '1px solid rgba(200,164,110,0.3)',
                    color: 'var(--gold)',
                    fontSize: '11px',
                    padding: '3px 10px',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '0.04em',
                    transition: 'all 0.15s',
                    borderRadius: '1px',
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(200,164,110,0.25)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(200,164,110,0.15)'}
                >
                  Use these
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Email', value: 'admin@example.com' },
                  { label: 'Password', value: 'admin123' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      width: '56px',
                      flexShrink: 0,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {label}
                    </span>
                    <code style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '2px 8px',
                      letterSpacing: '0.04em',
                    }}>
                      {value}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                background: 'var(--red-dim)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderLeft: '3px solid var(--red)',
                padding: '11px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                animation: 'fadeIn 0.2s ease-out',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="var(--red)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--red)',
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.4,
                }}>
                  {error}
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: '8px', justifyContent: 'center', padding: '12px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.04em',
        }}>
          Inventory OS · Assessment Demo
        </p>
      </div>
    </div>
  )
}
