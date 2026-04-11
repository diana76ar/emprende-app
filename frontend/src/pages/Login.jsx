import { useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch {
      setError('Credenciales invalidas. Verifica email y password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '26px 22px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h2 style={{ margin: 0, fontSize: 28, color: 'var(--text)' }}>Ingresar</h2>
        <p style={{ margin: '6px 0 18px', color: 'var(--muted)', fontSize: 14 }}>
          Accede para gestionar ventas, productos y dashboard
        </p>

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
          Email
        </label>
        <input
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 14, background: 'var(--surface)', color: 'var(--text)' }}
        />

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
          Password
        </label>
        <input
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        />

        {error && (
          <div style={{ marginTop: 12, border: '1px solid #ef9a9a', background: '#fdecea', color: '#b91c1c', borderRadius: 10, padding: '9px 10px', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '11px 14px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #2463eb 0%, #0ea5e9 100%)',
            color: '#fff',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}
