const ARS_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
})

export function formatMoney(value) {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return ARS_FORMATTER.format(0)
  return ARS_FORMATTER.format(parsed)
}
