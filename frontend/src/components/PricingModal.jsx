import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const PricingModalContext = createContext(null)

export function PricingModalProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  function openPricingModal() {
    setOpen(true)
  }

  function closePricingModal() {
    setOpen(false)
    setCheckoutError('')
  }

  async function handleUpgrade() {
    setCheckoutError('')
    try {
      const res = await api.post('/payment/checkout')
      window.location.href = res.data.url
    } catch (error) {
      const message = error?.response?.data?.error || 'Error al crear checkout. Intenta de nuevo.'
      setCheckoutError(message)
    }
  }

  return (
    <PricingModalContext.Provider value={{ openPricingModal, closePricingModal }}>
      {children}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.62)',
            zIndex: 1200,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            backdropFilter: 'blur(2px)',
          }}
          onClick={closePricingModal}
        >
          <div
            style={{
              width: 'min(840px, 100%)',
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 60px rgba(2, 6, 23, 0.25)',
              padding: 18,
              animation: 'pricing-fade-up .22s ease both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes pricing-fade-up {
                from { opacity: 0; transform: translateY(14px) scale(.97); }
                to   { opacity: 1; transform: none; }
              }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 24 }}>Planes de Emprende</h3>
                <p style={{ margin: '6px 0 0', color: '#475569' }}>
                  No vendemos solo software: te ayudamos a saber si estás ganando plata.
                </p>
              </div>
              <button
                onClick={closePricingModal}
                style={{
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#334155',
                  borderRadius: 8,
                  fontWeight: 700,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Cerrar
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
              marginTop: 14,
            }}>
              {/* FREE */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '.3px' }}>PLAN FREE</p>
                <h4 style={{ margin: '4px 0 0', color: '#0f172a', fontSize: 24 }}>Gratis</h4>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>Para empezar y validar tu negocio.</p>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: '#334155', lineHeight: 1.7 }}>
                  <li>Hasta 5 productos</li>
                  <li>Hasta 20 ventas por mes</li>
                  <li>Dashboard básico</li>
                </ul>
              </div>

              {/* PRO */}
              <div style={{ border: '1px solid #bfdbfe', borderRadius: 12, padding: 14, background: '#eff6ff', position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: '#1d4ed8',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                }}>
                  RECOMENDADO
                </span>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1e40af', letterSpacing: '.3px' }}>PLAN PRO</p>
                <h4 style={{ margin: '4px 0 0', color: '#0f172a', fontSize: 24 }}>$15.000 / mes</h4>
                <p style={{ margin: '6px 0 0', color: '#334155', fontSize: 13 }}>Para escalar con decisiones basadas en datos.</p>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: '#1e293b', lineHeight: 1.7 }}>
                  <li>Productos ilimitados</li>
                  <li>Ventas ilimitadas</li>
                  <li>Métricas completas</li>
                  <li>Recomendaciones inteligentes</li>
                  <li>Prioridad en soporte</li>
                </ul>
              </div>
            </div>

            {checkoutError && (
              <p style={{ margin: '10px 0 0', color: '#dc2626', fontSize: 13 }}>{checkoutError}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: '#334155', fontSize: 13 }}>
                Controlá tus ventas, entendé tus ganancias y tomá mejores decisiones.
              </p>
              <button
                onClick={handleUpgrade}
                style={{
                  background: '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  padding: '10px 16px',
                  cursor: 'pointer',
                }}
              >
                Desbloquear PRO 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </PricingModalContext.Provider>
  )
}

export function usePricingModal() {
  const ctx = useContext(PricingModalContext)
  if (!ctx) throw new Error('usePricingModal must be used inside PricingModalProvider')
  return ctx
}
