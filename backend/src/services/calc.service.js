export function calculateProduct(product) {
  const totalCost =
    product.costBase +
    product.costShipping +
    product.costCommission +
    product.costOther

  const suggestedPrice = totalCost * (1 + product.margin / 100)
  const profit = suggestedPrice - totalCost

  return {
    totalCost,
    suggestedPrice,
    profit
  }
}