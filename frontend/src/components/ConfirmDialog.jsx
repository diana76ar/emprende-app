export default function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar'
}) {
  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9998,
      padding: 16
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: '#fff',
        borderRadius: 14,
        padding: 20,
        textAlign: 'left',
        boxShadow: '0 10px 28px rgba(0,0,0,0.18)'
      }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ color: '#475569' }}>{description}</p>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel}>{cancelLabel}</button>
          <button
            onClick={onConfirm}
            style={{ background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
