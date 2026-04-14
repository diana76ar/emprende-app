import { useEffect, useState } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/currency'
import { useToast } from '../components/ToastProvider'
import ConfirmDialog from '../components/ConfirmDialog'
import { uiTokens, sem } from '../styles/uiTokens'
import { usePricingModal } from '../components/PricingModal'

function calcProduct(p) {
  if (!p) return null
  const totalCost = p.costBase + p.costShipping + p.costCommission + p.costOther
  const suggestedPrice = totalCost * (1 + p.margin / 100)
  const profit = suggestedPrice - totalCost
  return { totalCost, suggestedPrice, profit }
}

export default function Sales() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(0)
  const [editingSaleId, setEditingSaleId] = useState(null)
  const [error, setError] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const toast = useToast()
  const { openPricingModal } = usePricingModal()

  const selectedProduct = products.find((p) => p.id === productId) ?? null
  const ref = calcProduct(selectedProduct)
  const liveProfit = ref && price > 0 ? price - (ref.totalCost * quantity) : null
  const unitSalePrice = quantity > 0 ? price / quantity : 0

  useEffect(() => {
    load()
  }, [])

  function load() {
    api.get('/products')
      .then((res) => setProducts(res.data))
      .catch(() => toast.error('No se pudieron cargar los productos'))

    api.get('/sales')
      .then((res) => setSales(res.data))
      .catch(() => toast.error('No se pudo cargar el historial de ventas'))
  }

  function handleProductChange(id) {
    setProductId(id)
    const p = products.find((prod) => prod.id === id) ?? null
    const c = calcProduct(p)
    // Pre-llena el precio con el sugerido solo cuando NO estamos editando
    if (!editingSaleId && c) {
      setPrice(Math.round(c.suggestedPrice))
    }
  }

  function resetForm() {
    setProductId('')
    setQuantity(1)
    setPrice(0)
    setEditingSaleId(null)
    setError('')
  }

  function validate() {
    if (!productId) return 'Debes seleccionar un producto'
    if (!Number.isInteger(quantity) || quantity <= 0) return 'La cantidad debe ser un entero mayor a 0'
    if (price <= 0) return 'El precio debe ser mayor a 0'
    return ''
  }

  async function saveSale() {
    const message = validate()
    setError(message)
    if (message) {
      toast.error(message)
      return
    }

    const payload = { productId, quantity, price }

    try {
      const wasEditing = Boolean(editingSaleId)
      if (editingSaleId) {
        await api.put(`/sales/${editingSaleId}`, payload)
      } else {
        await api.post('/sales', payload)
      }

      resetForm()
      load()
      toast.success(wasEditing ? 'Venta actualizada' : 'Venta registrada')
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        openPricingModal()
        return
      }
      const messageFromApi = requestError.response?.data?.error || 'No se pudo guardar la venta'
      setError(messageFromApi)
      toast.error(messageFromApi)
    }
  }

  function startEdit(sale) {
    setEditingSaleId(sale.id)
    setProductId(sale.productId)
    setQuantity(sale.quantity)
    setPrice(sale.price)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info('Modo edicion activado')
  }

  async function deleteSale(saleId) {
    try {
      await api.delete(`/sales/${saleId}`)

      if (editingSaleId === saleId) {
        resetForm()
      }

      load()
      toast.success('Venta eliminada')
    } catch (requestError) {
      const messageFromApi = requestError.response?.data?.error || 'No se pudo eliminar la venta'
      toast.error(messageFromApi)
    } finally {
      setPendingDeleteId(null)
    }
  }

  return (
    <div className="sales-page" style={{ maxWidth: uiTokens.pageMaxWidth, margin: '0 auto', padding: uiTokens.pagePadding, fontFamily: 'inherit' }}>
      <style>{`
        .sales-title {
          margin: 0;
          font-size: ${uiTokens.titleSize};
          font-weight: 700;
          color: ${uiTokens.titleColor};
          line-height: 1.1;
        }
        .sales-subtitle {
          margin: 6px 0 0;
          color: ${uiTokens.subtitleColor};
          font-size: ${uiTokens.subtitleSize};
        }
        .sales-panel {
          background: #fff;
          border-radius: ${uiTokens.panelRadius}px;
          padding: ${uiTokens.panelPadding};
          box-shadow: ${uiTokens.panelShadow};
          margin-bottom: 28px;
        }
        .sales-section-title {
          margin: 0 0 20px;
          font-size: ${uiTokens.sectionTitleSize};
          color: ${uiTokens.sectionTitleColor};
          font-weight: 600;
        }
        .sales-ref-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        .sales-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .sales-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .sales-item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .sales-form-actions {
          margin-top: 20px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        @media (max-width: 760px) {
          .sales-panel {
            padding: ${uiTokens.panelPaddingMobile} !important;
            border-radius: ${uiTokens.panelRadiusSm}px;
          }
          .sales-ref-grid,
          .sales-form-grid {
            grid-template-columns: 1fr;
          }
          .sales-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .sales-item-actions {
            width: 100%;
          }
          .sales-form-actions {
            width: 100%;
          }
          .sales-form-actions button,
          .sales-item-actions button {
            flex: 1;
          }
        }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 className="sales-title">Ventas</h1>
        <p className="sales-subtitle">
          Registra tus ventas y descubri cuanto estas ganando realmente
        </p>
      </div>

      <div className="sales-panel">
        <h2 className="sales-section-title">
          {editingSaleId ? 'Editando venta' : 'Nueva venta'}
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#444', marginBottom: 4 }}>
            Producto <span style={{ color: '#e53935' }}>*</span>
          </label>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: '#888' }}>
            Elegí el producto para usar su costo como referencia
          </p>
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1.5px solid #ddd',
              borderRadius: 8,
              fontSize: 14,
              background: '#fff'
            }}
          >
            <option value="">Seleccionar producto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={p.stock === 0}>
                {p.name}{p.stock === 0 ? ' — Sin stock' : ` — Stock: ${p.stock}`}
              </option>
            ))}
          </select>
          {selectedProduct && selectedProduct.stock === 0 && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#c62828', fontWeight: 600 }}>
              ❌ Este producto no tiene stock disponible
            </p>
          )}
          {selectedProduct && selectedProduct.stock > 0 && selectedProduct.stock <= 3 && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#e65100', fontWeight: 600 }}>
              ⚠️ Stock bajo: {selectedProduct.stock} unidades disponibles
            </p>
          )}
        </div>

        {ref && (
          <div style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: '#f1f8e9',
            borderLeft: `5px solid ${sem.success.accent}`,
            borderRadius: 8,
            fontSize: 13
          }} className="sales-ref-grid">
            <div>
              <p style={{ margin: 0, color: '#5f6368' }}>Costo total ({quantity} u.)</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, color: sem.success.text }}>{formatMoney(ref.totalCost * quantity)}</p>
            </div>
            <div style={{ borderLeft: '1px solid #d0e4b4', borderRight: '1px solid #d0e4b4', padding: '0 10px' }}>
              <p style={{ margin: 0, color: '#5f6368' }}>Precio sugerido ({quantity} u.)</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, color: sem.success.textStrong }}>{formatMoney(ref.suggestedPrice * quantity)}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: '#5f6368' }}>
                {liveProfit !== null ? `Ganancia real (${quantity} u.)` : `Ganancia estimada (${quantity} u.)`}
              </p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, color: liveProfit !== null && liveProfit < 0 ? sem.error.textStrong : sem.success.textStrong }}>
                {liveProfit !== null ? formatMoney(liveProfit) : formatMoney(ref.profit * quantity)}
              </p>
            </div>
          </div>
        )}

        <div className="sales-form-grid">
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#444', marginBottom: 4 }}>
              Cantidad <span style={{ color: '#e53935' }}>*</span>
            </label>
            <p style={{ margin: '0 0 6px', fontSize: 11, color: '#888' }}>
              Número de unidades vendidas
            </p>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => {
                const qty = Number(e.target.value)
                setQuantity(qty)
                if (!editingSaleId && ref && qty > 0) {
                  setPrice(Math.round(ref.suggestedPrice * qty))
                }
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #ddd',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#444', marginBottom: 4 }}>
              Precio de venta <span style={{ color: '#e53935' }}>*</span>
            </label>
            <p style={{ margin: '0 0 6px', fontSize: 11, color: '#888' }}>
              Monto total cobrado por la venta
            </p>
            <input
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #ddd',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
            {quantity > 0 && price > 0 && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#607085' }}>
                Precio por unidad estimado: <strong>{formatMoney(unitSalePrice)}</strong>
              </p>
            )}
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

        <div className="sales-form-actions">
          <button
            onClick={saveSale}
            disabled={!editingSaleId && selectedProduct?.stock === 0}
            style={{
              padding: '10px 22px',
              background: (!editingSaleId && selectedProduct?.stock === 0) ? '#ccc' : sem.success.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: (!editingSaleId && selectedProduct?.stock === 0) ? 'not-allowed' : 'pointer',
              opacity: (!editingSaleId && selectedProduct?.stock === 0) ? 0.7 : 1
            }}
          >
            {editingSaleId ? 'Guardar venta' : 'Registrar venta'}
          </button>
          {editingSaleId && (
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e', fontWeight: 600 }}>
          Historial de ventas ({sales.length})
        </h2>
      </div>

      {sales.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 14,
          padding: '40px 20px',
          textAlign: 'center',
          color: '#999',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <p style={{ fontSize: 36, margin: '0 0 8px' }}>🧾</p>
          <p style={{ margin: 0, fontSize: 15 }}>Todavia no hay ventas registradas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sales.map((sale) => (
            <div key={sale.id} style={{
              background: '#fff',
              borderRadius: 12,
              padding: '14px 18px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            }} className="sales-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#222' }}>
                  {sale.product?.name || 'Sin producto'}
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4, fontSize: 13, color: '#5f6368' }}>
                  <span>{new Date(sale.date).toLocaleDateString('es-AR')}</span>
                  <span>Cant: <strong>{sale.quantity}</strong></span>
                  <span>Precio total: <strong>{formatMoney(sale.price)}</strong></span>
                  <span style={{ color: sale.profit >= 0 ? sem.success.textStrong : sem.error.textStrong }}>
                    Ganancia: <strong>{formatMoney(sale.profit)}</strong>
                  </span>
                </div>
              </div>
              <div className="sales-item-actions">
                <button
                  onClick={() => startEdit(sale)}
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
                  onClick={() => setPendingDeleteId(sale.id)}
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
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Eliminar venta"
        description="Esta accion eliminara la venta seleccionada y no se puede deshacer."
        confirmLabel="Eliminar"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => deleteSale(pendingDeleteId)}
      />
    </div>
  )
}
