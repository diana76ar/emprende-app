import { useEffect, useState, useRef } from 'react'
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import api from '../services/api'
import { formatMoney } from '../utils/currency'
import { uiTokens, sem } from '../styles/uiTokens'
import { usePricingModal } from '../components/PricingModal'

function ProfitTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '9px 14px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 13,
      minWidth: 140
    }}>
      <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{label}</p>
      <p style={{ margin: 0, fontWeight: 700, color: 'var(--success-text-strong)', fontSize: 15 }}>
        {formatMoney(payload[0].value)}
      </p>
      <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>ganancia del periodo</p>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [loadError, setLoadError] = useState('')
  const initialLoadRef = useRef(true)
  const { openPricingModal, closePricingModal } = usePricingModal()

  const loadDashboard = async (p = period) => {
    try {
      if (data) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setLoadError('')

      const res = await api.get(`/dashboard?period=${p}`)
      setData(res.data)
    } catch (error) {
      setLoadError('No se pudo cargar el dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleUpgrade = async () => {
    setCheckoutError('')

    try {
      const res = await api.post('/payment/checkout')
      window.location.href = res.data.url
    } catch (error) {
      const message = error?.response?.data?.error || 'Error al crear checkout. Intenta de nuevo.'
      setCheckoutError(message)
    }
  }

  function openModal() {
    openPricingModal()
  }

  // Cargar datos cuando cambia el período
  useEffect(() => {
    loadDashboard(period)
  }, [period])

  // Cargar datos iniciales o detectar regreso de pago exitoso
  useEffect(() => {
    if (initialLoadRef.current && data === null) {
      initialLoadRef.current = false
      loadDashboard()
    }
  }, [])

  const periodLabels = {
    today: 'Hoy',
    week: 'Semana',
    month: 'Mes',
    all: 'Historico'
  }

  const alertMeta = {
    low_margin: { icon: '⚠', bg: sem.warning.bg, border: sem.warning.accent, textHead: sem.warning.text, textBody: sem.warning.text, title: 'Margen bajo detectado' }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: uiTokens.dashboardMaxWidth, margin: '0 auto', padding: uiTokens.pagePadding }}>
        <div style={{
          borderRadius: uiTokens.panelRadius,
          padding: '26px 24px',
          background: 'linear-gradient(120deg, #0f172a 0%, #1d4ed8 60%, #38bdf8 100%)',
          color: '#fff'
        }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Dashboard</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.9 }}>Preparando analisis del periodo...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ maxWidth: uiTokens.dashboardMaxWidth, margin: '0 auto', padding: uiTokens.pagePadding }}>
        <div style={{
          borderRadius: uiTokens.panelRadiusSm,
          border: `1px solid ${sem.error.border}`,
          background: sem.error.bg,
          color: sem.error.textStrong,
          padding: '14px 16px'
        }}>
          {loadError}
        </div>
      </div>
    )
  }

  if (!data) return null

  const topProfit = data.ranking?.length > 0 ? data.ranking[0].profit : 0
  const score = Number(data.score ?? 0)
  const scoreStatus = score >= 70 ? 'good' : score >= 40 ? 'medium' : 'low'
  const scoreStatusText = score >= 70 ? 'Estas creciendo bien' : score >= 40 ? 'Podes mejorar' : 'Riesgo de rentabilidad'
  const healthColor = scoreStatus === 'good' ? 'var(--success-accent)' : scoreStatus === 'medium' ? 'var(--warning-accent)' : 'var(--error-accent)'
  const healthLabel = scoreStatus === 'good' ? 'alta' : scoreStatus === 'medium' ? 'media' : 'baja'
  const comparison = data.comparison || {
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
    revenueDeltaPct: 0,
    currentMonthProfit: 0,
    previousMonthProfit: 0,
    profitDeltaPct: 0
  }
  const revenueTrend = getTrendMeta(comparison.revenueDeltaPct)
  const profitTrend = getTrendMeta(comparison.profitDeltaPct)
  const insightList = Array.isArray(data.insights) ? data.insights : []
  const hasDashboardData =
    data.metrics?.salesCount > 0 ||
    data.ranking?.length > 0 ||
    data.alerts?.length > 0 ||
    insightList.length > 0
  const noSalesYet = (data.metrics?.salesCount ?? 0) === 0
  const prioritizeRisk = revenueTrend.label === 'En baja' || profitTrend.label === 'En baja'
  const kpiOrder = prioritizeRisk
    ? {
      revenueDelta: 1,
      profitDelta: 2,
      totalProfit: 3,
      totalRevenue: 4,
      avgMargin: 5,
      salesCount: 6,
      avgTicket: 7,
      topProduct: 8
    }
    : {
      totalRevenue: 1,
      revenueDelta: 2,
      totalProfit: 3,
      salesCount: 4,
      avgTicket: 5,
      avgMargin: 6,
      profitDelta: 7,
      topProduct: 8
    }
  const kpiMotion = (slot) => ({
    order: kpiOrder[slot],
    animation: 'dash-kpi-priority .42s ease both',
    animationDelay: `${kpiOrder[slot] * 0.035}s`
  })

  return (
    <div style={{ maxWidth: uiTokens.dashboardMaxWidth, margin: '0 auto', padding: uiTokens.pagePadding }}>
      <style>{`
        .dash-reveal {
          animation: dash-fade-up .5s ease both;
        }
        .dash-card {
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .dash-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
        }
        .dash-two-col {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 16px;
          margin-top: 18px;
        }
        .dash-data-shell {
          position: relative;
          transition: opacity .28s ease, transform .28s ease;
        }
        .dash-data-shell.is-refreshing {
          opacity: .58;
          transform: translateY(2px);
        }
        .dash-updating-chip {
          position: absolute;
          top: 10px;
          right: 12px;
          z-index: 20;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.85);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .2px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 6px 20px rgba(2, 6, 23, .2);
        }
        .dash-updating-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #22d3ee;
          animation: dash-pulse 1s ease infinite;
        }
        .dash-kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-top: 22px;
        }
        .dash-ranking-bar {
          position: relative;
          overflow: hidden;
        }
        .dash-ranking-bar > div {
          animation: dash-grow-bar .7s ease both;
          transform-origin: left center;
        }
        .dash-ranking-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,.5) 40%, transparent 80%);
          transform: translateX(-120%);
          animation: dash-shine 1.8s ease .4s;
        }
        @keyframes dash-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dash-grow-bar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes dash-shine {
          from { transform: translateX(-120%); }
          to { transform: translateX(120%); }
        }
        @keyframes dash-pulse {
          0% { opacity: .35; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: .35; transform: scale(.8); }
        }
        @keyframes dash-kpi-priority {
          from {
            opacity: 0;
            transform: translateY(8px) scale(.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .dash-chart-wrap {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 18px 10px;
        }
        .dash-chart-wrap .recharts-cartesian-grid-horizontal line {
          stroke: var(--border);
        }
        .dash-pricing-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.62);
          z-index: 1200;
          display: grid;
          place-items: center;
          padding: 16px;
          backdrop-filter: blur(2px);
        }
        .dash-pricing-modal {
          width: min(840px, 100%);
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 60px rgba(2, 6, 23, 0.25);
          padding: 18px;
          animation: dash-fade-up .22s ease both;
        }
        .dash-pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        }
        @media (max-width: 900px) {
          .dash-two-col {
            grid-template-columns: 1fr;
          }
          .dash-pricing-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          .dash-kpis {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .dash-reveal,
          .dash-ranking-bar > div,
          .dash-ranking-bar::after {
            animation: none !important;
          }
          .dash-card {
            transition: none !important;
          }
          .dash-card:hover {
            transform: none !important;
            box-shadow: none !important;
          }
          .dash-updating-dot {
            animation: none !important;
          }
        }
      `}</style>

      <div className={`dash-data-shell ${refreshing ? 'is-refreshing' : ''}`}>
        {refreshing && (
          <div className="dash-updating-chip">
            <span className="dash-updating-dot" />
            Actualizando periodo...
          </div>
        )}

      <div className="dash-reveal" style={{
        background: '#111827',
        color: '#fff',
        padding: '14px 16px',
        borderRadius: 12,
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap'
      }}>
        <strong>Plan actual: {(data.plan || 'free').toUpperCase()}</strong>
        {data.plan === 'free' && (
          <span style={{ fontSize: 12, opacity: 0.85 }}>
            FREE: hasta 5 productos y 20 ventas/mes · PRO: $15.000/mes
          </span>
        )}
        {data.plan === 'pro' && (
          <span style={{ fontSize: 12, opacity: 0.85 }}>
            PRO activo · ventas y productos ilimitados
          </span>
        )}
        <button
          onClick={openModal}
          style={{
            marginLeft: 'auto',
            border: '1px solid rgba(255,255,255,.28)',
            background: 'rgba(255,255,255,.08)',
            color: '#fff',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 12,
            padding: '7px 10px',
            cursor: 'pointer'
          }}
        >
          Ver planes
        </button>
      </div>

      <div className="dash-reveal" style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px 18px',
        marginBottom: 14
      }}>
        <h3 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Deja de vender a ciegas</h3>
        <p style={{ margin: '6px 0 0', color: '#475569' }}>
          Registra tus ventas y descubri cuanto estas ganando realmente.
        </p>
        <p style={{ margin: '10px 0 0', color: '#0f172a', fontWeight: 600 }}>
          Tu negocio en numeros: hoy estas generando {formatMoney(data.metrics?.totalProfit || 0)} en ganancias.
        </p>
      </div>

      {hasDashboardData && (
        <div className="dash-reveal dash-card" style={{
          marginBottom: 20,
          padding: '20px 22px',
          borderRadius: uiTokens.panelRadius,
          background: scoreStatus === 'good' ? sem.success.bg : scoreStatus === 'medium' ? sem.warning.bg : sem.error.bg,
          border: `1px solid ${scoreStatus === 'good' ? sem.success.border : scoreStatus === 'medium' ? sem.warning.border : sem.error.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: scoreStatus === 'good' ? sem.success.text : scoreStatus === 'medium' ? sem.warning.text : sem.error.text, opacity: 0.75 }}>
                Score del negocio
              </p>
              <p style={{ margin: '5px 0 0', fontSize: 18, fontWeight: 800, color: scoreStatus === 'good' ? sem.success.textStrong : scoreStatus === 'medium' ? sem.warning.textStrong : sem.error.textStrong }}>
                {score}/100 · {scoreStatusText}
              </p>
            </div>
            {data.plan === 'free' && (
              <button 
                onClick={openModal}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  background: '#3b82f6',
                  color: 'white',
                  border: '2px solid #2563eb',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  minWidth: 160,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#2563eb'
                  e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#3b82f6'
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                Desbloquear PRO 🚀
              </button>
            )}
            {data.plan === 'pro' && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#10b981', opacity: 0.8 }}>PLAN ACTUAL</p>
                <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#10b981' }}>
                  🚀 PRO
                </p>
              </div>
            )}
            {checkoutError && (
              <p style={{
                margin: 0,
                color: '#f87171',
                fontSize: 13,
                fontWeight: 600
              }}>
                {checkoutError}
              </p>
            )}
          </div>

          {/* Barra de progreso */}
          <div style={{ height: 8, borderRadius: 999, background: 'rgba(0,0,0,0.10)', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{
              height: '100%',
              width: `${Math.max(0, Math.min(100, score))}%`,
              borderRadius: 999,
              background: scoreStatus === 'good'
                ? 'linear-gradient(90deg, var(--success-accent), #34d399)'
                : scoreStatus === 'medium'
                ? 'linear-gradient(90deg, var(--warning-accent), #fbbf24)'
                : 'linear-gradient(90deg, var(--error-accent), #f87171)',
              transition: 'width 0.8s cubic-bezier(.4,0,.2,1)'
            }} />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <p style={{ margin: 0, fontSize: 13, color: scoreStatus === 'good' ? sem.success.textStrong : scoreStatus === 'medium' ? sem.warning.textStrong : sem.error.textStrong }}>
                {comparison.revenueDeltaPct >= 0 ? 'Facturacion en crecimiento' : 'Facturacion en caida'}: <strong>{comparison.revenueDeltaPct}%</strong>
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>
                {comparison.profitDeltaPct >= 0 ? 'Ganancia neta en alza' : 'Ganancia neta en baja'}: <strong>{comparison.profitDeltaPct}%</strong>
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  background: revenueTrend.bg,
                  border: `1px solid ${revenueTrend.border}`,
                  color: revenueTrend.text
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: revenueTrend.dot }} />
                  Facturacion: {revenueTrend.label}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  background: profitTrend.bg,
                  border: `1px solid ${profitTrend.border}`,
                  color: profitTrend.text
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: profitTrend.dot }} />
                  Ganancia: {profitTrend.label}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 4, textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>
                Facturacion: {formatMoney(comparison.currentMonthRevenue)} vs {formatMoney(comparison.previousMonthRevenue)}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>
                Ganancia: {formatMoney(comparison.currentMonthProfit)} vs {formatMoney(comparison.previousMonthProfit)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="dash-reveal" style={{
        borderRadius: uiTokens.panelRadiusLg,
        padding: '26px 24px',
        background: 'linear-gradient(120deg, #0f172a 0%, #1d4ed8 56%, #38bdf8 100%)',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 14,
        flexWrap: 'wrap'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.1 }}>Dashboard</h1>
          <p style={{ margin: '8px 0 0', maxWidth: 540, opacity: 0.92, fontSize: 14 }}>
            Controla tus ventas, entende tus ganancias y toma mejores decisiones.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.88 }}>Periodo activo</p>
          <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700 }}>{periodLabels[period]}</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.88 }}>Salud general: {score}/100</p>
        </div>
      </div>

      <div className="dash-reveal" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', animationDelay: '.08s' }}>
        <label htmlFor="period" style={{ fontWeight: 600, color: '#334155' }}>Analizar periodo</label>
        <select
          id="period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            fontWeight: 600,
            background: '#fff'
          }}
        >
          <option value="today">Hoy</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
          <option value="all">Historico</option>
        </select>
        <span style={{
          marginLeft: 'auto',
          padding: '4px 12px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          background: score >= 75 ? sem.success.bg : score >= 45 ? sem.warning.bg : sem.error.bg,
          color: healthColor,
          border: `1px solid ${score >= 75 ? sem.success.border : score >= 45 ? sem.warning.border : sem.error.border}`
        }}>
          Salud {healthLabel}
        </span>
      </div>

      {noSalesYet && (
        <div className="dash-reveal" style={{
          textAlign: 'center',
          marginTop: 24,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '24px 18px'
        }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>No tenes ventas todavia</h3>
          <p style={{ margin: '8px 0 0', color: '#64748b' }}>
            Registra tu primera venta para ver metricas y recomendaciones de crecimiento 🚀
          </p>
        </div>
      )}

      <div className="dash-kpis dash-reveal" style={{ animationDelay: '.14s' }}>
        <div className="dash-card" style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 12, padding: '16px 14px', ...kpiMotion('totalRevenue') }}>
          <p style={{ margin: 0, fontSize: 12, color: '#0f766e' }}>Facturacion total</p>
          <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, color: '#134e4a' }}>{formatMoney(data.metrics.totalRevenue)}</p>
        </div>
        <div className="dash-card" style={{ background: '#ecfeff', border: '1px solid #bae6fd', borderRadius: 12, padding: '16px 14px', ...kpiMotion('revenueDelta') }}>
          <p style={{ margin: 0, fontSize: 12, color: '#0369a1' }}>Facturacion vs mes anterior</p>
          <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, color: '#0c4a6e' }}>
            {comparison.revenueDeltaPct > 0 ? '+' : ''}{comparison.revenueDeltaPct}%
          </p>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: revenueTrend.bg,
            border: `1px solid ${revenueTrend.border}`,
            color: revenueTrend.text
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: revenueTrend.dot }} />
            {revenueTrend.label}
          </span>
        </div>
        <div className="dash-card" style={{ background: sem.success.bg, border: `1px solid ${sem.success.border}`, borderRadius: 12, padding: '16px 14px', ...kpiMotion('totalProfit') }}>
          <p style={{ margin: 0, fontSize: 12, color: sem.success.text }}>Ganancia total</p>
          <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, color: sem.success.textStrong }}>{formatMoney(data.metrics.totalProfit)}</p>
        </div>
        <div className="dash-card" style={{ background: sem.info.bg, border: `1px solid ${sem.info.border}`, borderRadius: 12, padding: '16px 14px', ...kpiMotion('salesCount') }}>
          <p style={{ margin: 0, fontSize: 12, color: sem.info.text }}>Ventas registradas</p>
          <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, color: sem.info.textStrong }}>{data.metrics.salesCount}</p>
        </div>
        <div className="dash-card" style={{ background: sem.warning.bg, border: `1px solid ${sem.warning.border}`, borderRadius: 12, padding: '16px 14px', ...kpiMotion('avgTicket') }}>
          <p style={{ margin: 0, fontSize: 12, color: sem.warning.text }}>Ticket promedio</p>
          <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, color: sem.warning.textStrong }}>{formatMoney(data.metrics.avgTicket)}</p>
        </div>
        <div className="dash-card" style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '16px 14px', ...kpiMotion('avgMargin') }}>
          <p style={{ margin: 0, fontSize: 12, color: '#c2410c' }}>Margen promedio</p>
          <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, color: '#9a3412' }}>{data.metrics.avgMargin}%</p>
        </div>
        <div className="dash-card" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '16px 14px', ...kpiMotion('profitDelta') }}>
          <p style={{ margin: 0, fontSize: 12, color: '#6d28d9' }}>Ganancia vs mes anterior</p>
          <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, color: '#5b21b6' }}>
            {comparison.profitDeltaPct > 0 ? '+' : ''}{comparison.profitDeltaPct}%
          </p>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: profitTrend.bg,
            border: `1px solid ${profitTrend.border}`,
            color: profitTrend.text
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: profitTrend.dot }} />
            {profitTrend.label}
          </span>
        </div>
        <div className="dash-card" style={{ background: sem.purple.bg, border: `1px solid ${sem.purple.border}`, borderRadius: 12, padding: '16px 14px', ...kpiMotion('topProduct') }}>
          <p style={{ margin: 0, fontSize: 12, color: sem.purple.text }}>Producto lider</p>
          <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: sem.purple.textStrong }}>{data.metrics.topProduct || 'Sin datos'}</p>
        </div>
      </div>

      <div className="dash-two-col dash-reveal" style={{ animationDelay: '.22s' }}>
        <div className="dash-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Ranking de ganancias</h3>
          <p style={{ margin: '6px 0 14px', color: '#64748b', fontSize: 13 }}>
            Top productos del periodo por ganancia acumulada
          </p>
          {data.ranking.length === 0 ? (
            <p style={{ margin: 0, color: '#94a3b8' }}>Todavia no hay ventas para este periodo.</p>
          ) : (
            data.ranking.map((item, index) => {
              const width = topProfit > 0 ? Math.max(8, (item.profit / topProfit) * 100) : 8
              return (
                <div key={`${item.name}-${index}`} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{index + 1}. {item.name}</span>
                    <span style={{ fontWeight: 700, color: '#0f766e', fontSize: 13 }}>{formatMoney(item.profit)}</span>
                  </div>
                  <div className="dash-ranking-bar" style={{ height: 9, background: '#e2e8f0', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${width}%`, borderRadius: 999, background: 'linear-gradient(90deg, #0ea5e9 0%, #22c55e 100%)' }} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div className="dash-card" style={{ background: sem.success.bg, border: `1px solid ${sem.success.border}`, padding: 16, borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: sem.success.text, fontWeight: 600 }}>Mejor producto</p>
            <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: sem.success.textStrong }}>
              {data.metrics.topProduct || 'Sin datos'}
            </p>
          </div>
          <div className="dash-card" style={{ background: sem.error.bg, border: `1px solid ${sem.error.border}`, padding: 16, borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: sem.error.text, fontWeight: 600 }}>Peor producto</p>
            <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: sem.error.textStrong }}>
              {data.metrics.worstProduct || 'Sin datos'}
            </p>
          </div>
          <div className="dash-card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: 16, borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', fontWeight: 600 }}>Estado operativo</p>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#334155' }}>
              {data.metrics.salesCount === 0
                ? 'Sin movimiento en el periodo. Prioriza captar las primeras ventas.'
                : `Se registraron ${data.metrics.salesCount} ventas y ${data.alerts.length} alertas activas.`}
            </p>
          </div>
        </div>
      </div>

      {data.ranking.length > 0 && (
        <div className="dash-reveal dash-card dash-chart-wrap" style={{ marginTop: 22, animationDelay: '.26s' }}>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>
            Ganancia por producto
          </p>
          <p style={{ margin: '4px 0 16px', fontSize: 13, color: 'var(--muted)' }}>
            Comparativa visual — {periodLabels[period]}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.ranking}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              barCategoryGap="28%"
            >
              <defs>
                <linearGradient id="profitBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--muted)', fontFamily: 'inherit' }}
                tickFormatter={(v) => v.length > 11 ? v.slice(0, 11) + '\u2026' : v}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'inherit' }}
                tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={<ProfitTooltip />}
                cursor={{ fill: 'var(--surface-soft)', radius: 6 }}
                formatter={(value) => [formatMoney(value), 'Ganancia']}
              />
              <Bar
                dataKey="profit"
                fill="url(#profitBarGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
                isAnimationActive={true}
                animationDuration={700}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="dash-reveal" style={{ marginTop: 22, animationDelay: '.28s' }}>
        <h3 style={{ margin: '0 0 10px', color: '#0f172a' }}>Alertas operativas</h3>

        {data.alerts.length === 0 ? (
          <div style={{ background: sem.success.bg, border: `1px solid ${sem.success.border}`, padding: '12px 14px', borderRadius: 10, color: sem.success.text }}>
            Todo esta funcionando bien.
          </div>
        ) : (
          data.alerts.map((a, i) => {
            const meta = alertMeta[a.type] || { icon: '⚠', bg: sem.warning.bg, border: sem.warning.accent, textHead: sem.warning.text, textBody: sem.warning.text, title: 'Atencion' }
            return (
            <div key={i} className="dash-card" style={{
              background: meta.bg,
              padding: '12px 14px',
              borderRadius: 10,
              marginBottom: 10,
              borderLeft: `5px solid ${meta.border}`
            }}>
              <p style={{ margin: 0, fontWeight: 700, color: meta.textHead, fontSize: 13 }}>{meta.icon} {meta.title}</p>
              <p style={{ margin: '4px 0 0', color: meta.textBody }}>{a.message}</p>
            </div>
            )
          })
        )}
      </div>

      <div className="dash-reveal" style={{ marginTop: 30, animationDelay: '.34s' }}>
        <h3 style={{ margin: '0 0 10px', color: '#0f172a' }}>💡 Recomendaciones</h3>

        {insightList.length === 0 ? (
          <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', padding: '12px 14px', borderRadius: 10, color: 'var(--muted)' }}>
            No hay recomendaciones por ahora.
          </div>
        ) : (
          insightList.map((insight, i) => {
            return (
              <div key={i} className="dash-card" style={{
                background: sem.info.bg,
                padding: '12px 14px',
                borderRadius: 10,
                marginBottom: 10,
                borderLeft: `5px solid ${sem.info.accent}`,
                display: 'grid',
                gap: 4
              }}>
                <p style={{ margin: 0, fontWeight: 700, color: sem.info.text, fontSize: 13 }}>Insight automatico</p>
                <p style={{ margin: 0, color: sem.info.text }}>{insight}</p>
              </div>
            )
          })
        )}
      </div>

      <div className="dash-reveal" style={{
        marginTop: 18,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '14px 16px'
      }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
          No es solo registrar ventas, es entender tu negocio.
        </p>
      </div>
      </div>
    </div>
  )
}

function getTrendMeta(deltaPct) {
  if (deltaPct >= 5) {
    return {
      label: 'En alza',
      bg: '#dcfce7',
      border: '#86efac',
      text: '#166534',
      dot: '#22c55e'
    }
  }

  if (deltaPct <= -5) {
    return {
      label: 'En baja',
      bg: '#fee2e2',
      border: '#fca5a5',
      text: '#991b1b',
      dot: '#ef4444'
    }
  }

  return {
    label: 'Estable',
    bg: '#fef3c7',
    border: '#fcd34d',
    text: '#92400e',
    dot: '#f59e0b'
  }
}