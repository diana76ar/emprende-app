import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleRegister(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password || !confirmPassword) {
      setError('Completa todos los campos para continuar.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', { email, password })
      setSuccess('Cuenta creada con éxito. Te redirigimos al login...')
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      const status = err?.response?.status
      const message = status === 409
        ? 'Ese email ya esta registrado. Proba iniciar sesion o usar otro email.'
        : err?.response?.data?.error || 'No se pudo crear la cuenta. Intenta nuevamente.'
      setError(message)
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
            <p className="brand-subtitle">Gestión ágil de ventas y productos</p>
          </div>
        </div>

        <div className="auth-header">
          <h2>Crear cuenta</h2>
          <p>Registra tu negocio y comienza a administrar tus ventas.</p>
        </div>

        <form onSubmit={handleRegister}>
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
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />

          <label className="form-label">Confirmar contraseña</label>
          <input
            type="password"
            placeholder="Vuelve a escribir tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
          />

          {error && <div className="auth-alert auth-alert-error">{error}</div>}
          {success && <div className="auth-alert auth-alert-success">{success}</div>}

          <button type="submit" className="button-primary" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <Link to="/" className="auth-link">Ingresa aquí</Link></p>
        </div>
      </div>
    </div>
  )
}
