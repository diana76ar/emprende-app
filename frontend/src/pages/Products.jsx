import { useEffect, useState } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/currency'
import { useToast } from '../components/ToastProvider'
import ConfirmDialog from '../components/ConfirmDialog'
import { uiTokens, sem } from '../styles/uiTokens'

export default function Products() {
  const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    name: '',
    costBase: 0,
    costShipping: 0,
    costCommission: 0,
    costOther: 0,
    margin: 30,
    image: null
  })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const [analysis, setAnalysis] = useState(null)
  const [lastCalc, setLastCalc] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const toast = useToast()

  useEffect(() => {
    load()
  }, [])

  function load() {
    api.get('/products')
      .then((res) => setProducts(res.data))
      .catch(() => toast.error('No se pudieron cargar los productos'))
  }

  const totalCost = form.costBase + form.costShipping + form.costCommission + form.costOther
  const suggestedPrice = totalCost * (1 + form.margin / 100)
  const profit = suggestedPrice - totalCost

  const getColor = (score) => {
    if (score < 40) return '#ff4d4d'
    if (score < 70) return '#ffcc00'
    return '#4caf50'
  }

  function analyze() {
    if (totalCost === 0) return

    const marginPercent = (profit / totalCost) * 100

    let score = 100
    const insights = []
    let recommendedPrice = null

    if (marginPercent < 20) {
      score -= 40
      recommendedPrice = totalCost * 1.5
      insights.push('Margen muy bajo')
      insights.push(`Subi el precio a ${formatMoney(recommendedPrice)}`)
    } else if (marginPercent < 40) {
      score -= 20
      recommendedPrice = totalCost * 1.3
      insights.push('Margen mejorable')
      insights.push(`Podrias vender a ${formatMoney(recommendedPrice)}`)
    } else {
      insights.push('Buen margen')
      insights.push('Podes bajar precio para vender mas volumen')
    }

    if ((form.costCommission / totalCost) * 100 > 20) {
      score -= 15
      insights.push('Comision alta')
    }

    if ((form.costShipping / totalCost) * 100 > 15) {
      score -= 10
      insights.push('Envio elevado')
    }

    if (score < 0) score = 0

    setAnalysis({ score, insights, recommendedPrice })
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null

    if (!file) {
      updateForm('image', null)
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const message = 'Formato no valido. Usa JPG, PNG o WEBP.'
      setError(message)
      toast.error(message)
      event.target.value = ''
      updateForm('image', null)
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const message = 'La imagen supera 5MB.'
      setError(message)
      toast.error(message)
      event.target.value = ''
      updateForm('image', null)
      return
    }

    setError('')
    updateForm('image', file)
  }

  function validate() {
    if (!form.name.trim()) return 'El nombre es obligatorio'
    if (form.costBase <= 0) return 'El costo base debe ser mayor a 0'
    if ([form.costShipping, form.costCommission, form.costOther, form.margin].some((v) => Number.isNaN(v))) {
      return 'Ingresa valores numericos validos'
    }
    if (form.costShipping < 0 || form.costCommission < 0 || form.costOther < 0) {
      return 'No se permiten costos negativos'
    }
    if (form.margin < 0) return 'El margen no puede ser negativo'
    return ''
  }

  function resetForm() {
    setForm({
      name: '',
      costBase: 0,
      costShipping: 0,
      costCommission: 0,
      costOther: 0,
      margin: 30,
      image: null
    })
    setEditingId(null)
    setAnalysis(null)
    setError('')
  }

  async function save() {
    const message = validate()
    setError(message)
    if (message) {
      toast.error(message)
      return
    }

    const formData = new FormData()
    formData.append('name', form.name.trim())
    formData.append('type', 'reventa')
    formData.append('costBase', form.costBase.toString())
    formData.append('costShipping', form.costShipping.toString())
    formData.append('costCommission', form.costCommission.toString())
    formData.append('costOther', form.costOther.toString())
    formData.append('margin', form.margin.toString())
    if (form.image) {
      formData.append('image', form.image)
    }
    
    const payload = formData

    try {
      const wasEditing = Boolean(editingId)
      const res = editingId
        ? await api.put(`/products/${editingId}`, payload)
        : await api.post('/products', payload)

      setLastCalc(res.data.calc)
      resetForm()
      load()
      toast.success(wasEditing ? 'Producto actualizado' : 'Producto creado')
    } catch (requestError) {
      const messageFromApi = requestError.response?.data?.error || 'No se pudo guardar el producto'
      setError(messageFromApi)
      toast.error(messageFromApi)
    }
  }

  function startEdit(product) {
    setEditingId(product.id)
    setError('')
    setForm({
      name: product.name,
      costBase: product.costBase,
      costShipping: product.costShipping,
      costCommission: product.costCommission,
      costOther: product.costOther,
      margin: product.margin,
      image: null
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info('Modo edicion activado')
  }

  async function removeProduct(productId) {
    try {
      await api.delete(`/products/${productId}`)

      if (editingId === productId) {
        resetForm()
      }

      load()
      toast.success('Producto eliminado')
    } catch (requestError) {
      const messageFromApi = requestError.response?.data?.error || 'No se pudo eliminar el producto'
      toast.error(messageFromApi)
    } finally {
      setPendingDeleteId(null)
    }
  }

  const fieldConfig = [
    { field: 'costBase', label: 'Costo base', hint: 'Precio que pagas al proveedor', required: true },
    { field: 'costShipping', label: 'Envio', hint: 'Costo de flete o envio' },
    { field: 'costCommission', label: 'Comision', hint: 'Comision de plataforma (MeLi, etc.)' },
    { field: 'costOther', label: 'Otros costos', hint: 'Embalaje, impresion, etc.' },
  ]

  return (
    <div className="products-page" style={{ maxWidth: uiTokens.pageMaxWidth, margin: '0 auto', padding: uiTokens.pagePadding, fontFamily: 'inherit' }}>
      <style>{`
        .products-title {
          margin: 0;
          font-size: ${uiTokens.titleSize};
          font-weight: 700;
          color: ${uiTokens.titleColor};
          line-height: 1.1;
        }
        .products-subtitle {
          margin: 6px 0 0;
          color: ${uiTokens.subtitleColor};
          font-size: ${uiTokens.subtitleSize};
        }
        .products-panel {
          background: #fff;
          border-radius: ${uiTokens.panelRadius}px;
          padding: ${uiTokens.panelPadding};
          box-shadow: ${uiTokens.panelShadow};
        }
        .products-section-title {
          margin: 0 0 20px;
          font-size: ${uiTokens.sectionTitleSize};
          color: ${uiTokens.sectionTitleColor};
          font-weight: 600;
        }
        .products-cost-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 20px;
        }
        .products-margin-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .products-sim-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          text-align: center;
        }
        .products-analysis-head {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 16px;
        }
        .products-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .products-list-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .products-form-actions {
          margin-top: 20px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        @media (max-width: 760px) {
          .products-panel {
            padding: ${uiTokens.panelPaddingMobile} !important;
            border-radius: ${uiTokens.panelRadiusSm}px;
          }
          .products-cost-grid,
          .products-sim-grid {
            grid-template-columns: 1fr;
          }
          .products-margin-row,
          .products-analysis-head,
          .products-list-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .products-list-actions {
            width: 100%;
          }
          .products-form-actions {
            width: 100%;
          }
          .products-form-actions button,
          .products-list-actions button {
            flex: 1;
          }
        }
      `}</style>

      {/* Encabezado */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="products-title">Productos</h1>
        <p className="products-subtitle">
          Gestioná tus productos, costos y margenes de ganancia
        </p>
      </div>

      {/* Formulario */}
      <div className="products-panel" style={{ marginBottom: 28 }}>
        <h2 className="products-section-title">
          {editingId ? 'Editando producto' : 'Nuevo producto'}
        </h2>

        {/* Nombre */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#444', marginBottom: 4 }}>
            Nombre del producto <span style={{ color: '#e53935' }}>*</span>
          </label>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: '#888' }}>
            Como aparecera en tus ventas y reportes
          </p>
          <input
            placeholder="Ej: Zapatillas Nike Air Max"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1.5px solid #ddd',
              borderRadius: 8,
              fontSize: 15,
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#444', marginBottom: 4 }}>
            Foto del producto
          </label>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: '#888' }}>
            Podes elegir una imagen de la galeria o sacar una foto con la camara
          </p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            style={{
              width: '100%',
              padding: '9px 12px',
              border: '1.5px solid #ddd',
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box',
              background: '#fff'
            }}
          />
          {form.image && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#555' }}>
              Archivo seleccionado: <strong>{form.image.name}</strong>
            </p>
          )}
        </div>

        {/* Grid de costos */}
        <div style={{ marginBottom: 4 }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 13, color: '#444' }}>
            Desglose de costos
          </p>
          <div className="products-cost-grid">
            {fieldConfig.map(({ field, label, hint, required }) => (
              <div key={field}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#444', marginBottom: 3 }}>
                  {label} {required && <span style={{ color: '#e53935' }}>*</span>}
                </label>
                <p style={{ margin: '0 0 5px', fontSize: 11, color: '#888' }}>{hint}</p>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form[field]}
                  onChange={(e) => updateForm(field, Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1.5px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Margen */}
        <div style={{ marginTop: 18 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#444', marginBottom: 3 }}>
            Margen de ganancia (%)
          </label>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: '#888' }}>
            Porcentaje que queres ganar sobre el costo total
          </p>
          <div className="products-margin-row">
            <input
              type="number"
              min="0"
              step="1"
              value={form.margin}
              onChange={(e) => updateForm('margin', Number(e.target.value))}
              style={{
                width: 110,
                padding: '9px 12px',
                border: '1.5px solid #ddd',
                borderRadius: 8,
                fontSize: 14
              }}
            />
            <span style={{ fontSize: 13, color: '#555' }}>
              Precio sugerido:{' '}
              <strong style={{ color: sem.success.textStrong, fontSize: 15 }}>{formatMoney(suggestedPrice)}</strong>
            </span>
          </div>
        </div>

        {/* Simulacion */}
        <div style={{
          marginTop: 20,
          background: sem.info.bg,
          border: `1px solid ${sem.info.border}`,
          borderRadius: 10,
          padding: '14px 18px'
        }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 13, color: sem.info.textStrong }}>
            Simulacion en tiempo real
          </p>
          <div className="products-sim-grid">
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Costo total</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#333', fontSize: 16 }}>
                {formatMoney(totalCost)}
              </p>
            </div>
            <div style={{ borderLeft: `1px solid ${sem.info.border}`, borderRight: `1px solid ${sem.info.border}` }}>
              <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Precio sugerido</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, color: sem.info.textStrong, fontSize: 16 }}>
                {formatMoney(suggestedPrice)}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Ganancia por unidad</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 16, color: profit >= 0 ? sem.success.textStrong : sem.error.textStrong }}>
                {formatMoney(profit)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            background: sem.error.bg,
            border: `1px solid ${sem.error.border}`,
            borderRadius: 8,
            color: sem.error.textStrong,
            fontSize: 13
          }}>
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="products-form-actions">
          <button
            onClick={analyze}
            style={{
              padding: '10px 18px',
              background: sem.info.bg,
              color: sem.info.textStrong,
              border: `1.5px solid ${sem.info.accent}`,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Analizar rentabilidad
          </button>
          <button
            onClick={save}
            style={{
              padding: '10px 22px',
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {editingId ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              style={{
                padding: '10px 18px',
                background: '#f5f5f5',
                color: '#555',
                border: '1.5px solid #ccc',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Cancelar edicion
            </button>
          )}
        </div>
      </div>

      {/* Analisis de rentabilidad */}
      {analysis && (
        <div className="products-panel" style={{ marginBottom: 28, padding: '20px 24px' }}>
          <div className="products-analysis-head">
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: getColor(analysis.score),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 22,
              flexShrink: 0
            }}>
              {analysis.score}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#222' }}>Score de rentabilidad</h3>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#666' }}>
                {analysis.score >= 70
                  ? 'Excelente — este producto es muy rentable'
                  : analysis.score >= 40
                  ? 'Aceptable — hay margen para mejorar'
                  : 'Bajo — revisa los costos o el margen'}
              </p>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {analysis.insights.map((insight, index) => (
              <li key={index} style={{ marginBottom: 6, fontSize: 14, color: '#444' }}>{insight}</li>
            ))}
          </ul>
          {analysis.recommendedPrice && (
            <button
              onClick={() => {
                const newMargin = ((analysis.recommendedPrice / totalCost) - 1) * 100
                updateForm('margin', Number(newMargin.toFixed(0)))
                toast.info('Recomendacion aplicada al margen')
              }}
              style={{
                marginTop: 16,
                padding: '9px 16px',
                background: '#2e7d32',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Aplicar recomendacion
            </button>
          )}
        </div>
      )}

      {/* Lista de productos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e', fontWeight: 600 }}>
          Mis productos ({products.length})
        </h2>
      </div>

      {products.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 14,
          padding: '40px 20px',
          textAlign: 'center',
          color: '#999',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <p style={{ fontSize: 36, margin: '0 0 8px' }}>📦</p>
          <p style={{ margin: 0, fontSize: 15 }}>Todavia no tenes productos. Crea el primero arriba.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map((p) => {
            const costo = p.costBase + p.costShipping + p.costCommission + p.costOther
            const precioSug = costo * (1 + p.margin / 100)
            return (
              <div key={p.id} style={{
                background: '#fff',
                borderRadius: 12,
                padding: '16px 20px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
              }} className="products-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  {p.imageUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${p.imageUrl}`}
                      alt={p.name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid #e0e0e0',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: 18,
                      border: '1px solid #e0e0e0',
                      flexShrink: 0
                    }}>
                      📦
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#555' }}>
                        Costo: <strong>{formatMoney(costo)}</strong>
                      </span>
                      <span style={{ fontSize: 13, color: '#1565c0' }}>
                        Precio sugerido: <strong>{formatMoney(precioSug)}</strong>
                      </span>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '2px 10px',
                        borderRadius: 20,
                        background: p.margin >= 40 ? sem.success.bg : p.margin >= 20 ? sem.warning.bg : sem.error.bg,
                        color: p.margin >= 40 ? sem.success.textStrong : p.margin >= 20 ? sem.warning.textStrong : sem.error.textStrong
                      }}>
                        {p.margin}% margen
                      </span>
                    </div>
                  </div>
                </div>
                <div className="products-list-actions">
                  <button
                    onClick={() => startEdit(p)}
                    style={{
                      padding: '7px 14px',
                      background: sem.info.bg,
                      color: sem.info.textStrong,
                      border: 'none',
                      borderRadius: 7,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(p.id)}
                    style={{
                      padding: '7px 14px',
                      background: sem.error.bg,
                      color: sem.error.textStrong,
                      border: 'none',
                      borderRadius: 7,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Eliminar producto"
        description="Se eliminara el producto y todas sus ventas relacionadas. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => removeProduct(pendingDeleteId)}
      />
    </div>
  )
}
