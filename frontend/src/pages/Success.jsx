import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Success() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirigir al dashboard después de 3 segundos
    const timer = setTimeout(() => {
      navigate('/dashboard')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        padding: '40px',
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
        <h1 style={{ margin: '0 0 16px', color: 'var(--text)' }}>
          ¡Pago exitoso!
        </h1>
        <p style={{ margin: '0 0 24px', color: 'var(--muted)' }}>
          Bienvenido a PRO. Ahora tienes acceso ilimitado a todas las funciones.
        </p>
        <p style={{ margin: '0', fontSize: '14px', color: 'var(--muted)' }}>
          Redirigiendo al dashboard...
        </p>
      </div>
    </div>
  )
}