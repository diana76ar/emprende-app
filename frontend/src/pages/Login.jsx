import { useState } from 'react'
import api from '../services/api'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch {
      setError('Credenciales inválidas. Verifica email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">E</div>
          <div className="brand-copy">
            <p className="brand-title">Emprende</p>
            <p className="brand-subtitle">Control de ventas, productos y clientes</p>
          </div>
        </div>

        <div className="auth-header">
          <h2>Bienvenido de nuevo</h2>
          <p>Accede a tu panel y comienza a gestionar tu negocio con claridad.</p>
        </div>

        <form onSubmit={handleLogin}>
          <label className="form-label">Email</label>
          <input
            type="email"
            placeholder="hola@tuempresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />

          <label className="form-label">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />

          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Aún no tienes cuenta? <Link to="/register" className="auth-link">Regístrate</Link></p>
        </div>
      </div>
    </div>
  )
}
