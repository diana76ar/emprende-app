import { useNavigate } from 'react-router-dom'

export default function Cancel() {
  const navigate = useNavigate()

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
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>😔</div>
        <h1 style={{ margin: '0 0 16px', color: 'var(--text)' }}>
          Pago cancelado
        </h1>
        <p style={{ margin: '0 0 24px', color: 'var(--muted)' }}>
          No hay problema. Puedes intentarlo de nuevo cuando estés listo.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 24px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  )
}