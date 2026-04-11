import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

const ANIMATION_OUT_MS = 280

const COLORS = {
  success: { bg: '#e8f5e9', border: '#2e7d32', icon: '✔' },
  error:   { bg: '#fdecea', border: '#c62828', icon: '✕' },
  info:    { bg: '#e3f2fd', border: '#1565c0', icon: 'ℹ' }
}

const STYLES = `
  @keyframes _toast-in {
    from { opacity: 0; transform: translateX(110%); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes _toast-out {
    from { opacity: 1; transform: translateX(0); max-height: 200px; margin-bottom: 0; }
    to   { opacity: 0; transform: translateX(110%); max-height: 0;   margin-bottom: -10px; }
  }
  ._toast-enter { animation: _toast-in  280ms cubic-bezier(.22,.68,0,1.2) both; }
  ._toast-leave { animation: _toast-out ${ANIMATION_OUT_MS}ms ease-in both; }
`

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    // Marca como saliendo → animación de salida
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    )
    // Elimina del estado cuando termina la animación
    timers.current[id] = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      delete timers.current[id]
    }, ANIMATION_OUT_MS)
  }, [])

  const showToast = useCallback((type, message, duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, type, message, leaving: false }])

    timers.current[id] = window.setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const value = useMemo(() => ({
    success: (msg) => showToast('success', msg),
    error:   (msg) => showToast('error',   msg),
    info:    (msg) => showToast('info',    msg)
  }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      <style>{STYLES}</style>
      {children}

      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 320,
        maxWidth: 'calc(100vw - 40px)',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => {
          const { bg, border, icon } = COLORS[toast.type] ?? COLORS.info
          return (
            <div
              key={toast.id}
              className={toast.leaving ? '_toast-leave' : '_toast-enter'}
              style={{
                background: bg,
                color: '#1f2937',
                borderLeft: `6px solid ${border}`,
                borderRadius: 10,
                padding: '12px 14px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                pointerEvents: 'all',
                overflow: 'hidden'
              }}
            >
              <span style={{ fontSize: 16, marginTop: 1, flexShrink: 0, color: border }}>{icon}</span>
              <span style={{ flex: 1, textAlign: 'left', fontSize: 14, lineHeight: 1.45 }}>{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: '0 2px',
                  flexShrink: 0,
                  alignSelf: 'flex-start'
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}
