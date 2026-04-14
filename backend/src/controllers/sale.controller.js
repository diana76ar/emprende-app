import { prisma } from '../prisma.js'
import { calculateProduct } from '../services/calc.service.js'
import { PLANS } from '../config/plans.js'

function parseSaleInput(data) {
  const productId = String(data.productId || '')
  const quantity = Number(data.quantity)
  const price = Number(data.price)

  if (!productId) {
    return { error: 'El producto es obligatorio' }
  }

  if (Number.isNaN(quantity) || Number.isNaN(price)) {
    return { error: 'Cantidad y precio deben ser numericos' }
  }

  if (quantity <= 0 || !Number.isInteger(quantity)) {
    return { error: 'La cantidad debe ser un entero mayor a 0' }
  }

  if (price <= 0) {
    return { error: 'El precio de venta debe ser mayor a 0' }
  }

  return {
    value: {
      productId,
      quantity,
      price
    }
  }
}

function calcProfit(product, totalSalePrice, quantity) {
  const totalCost = product.costBase + product.costShipping + product.costCommission + product.costOther
  return totalSalePrice - (totalCost * quantity)
}

export async function createSale(req, res) {
  const parsed = parseSaleInput(req.body)

  if (parsed.error) {
    return res.status(400).json({ error: parsed.error })
  }

  const { productId, quantity, price } = parsed.value

  try {
    // 🔥 Verificar límite mensual de ventas
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    const plan = PLANS[user.plan]

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const salesCount = await prisma.sale.count({
      where: { userId: req.user.userId, date: { gte: startOfMonth } }
    })

    if (salesCount >= plan.maxSalesPerMonth) {
      return res.status(403).json({ error: 'Llegaste al limite del plan FREE. Con PRO desbloqueas ventas ilimitadas, metricas completas y recomendaciones inteligentes 🚀' })
    }

    // 1. Buscar producto
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: req.user.userId }
    })

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    // 2. Validar stock
    if (product.stock < quantity) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${product.stock}`
      })
    }

    // 3. Calcular ganancia real desde costos del producto (nunca desde frontend)
    const profit = calcProfit(product, price, quantity)

    // 4. Transacción: descontar stock + crear venta
    const [sale] = await prisma.$transaction([
      prisma.sale.create({
        data: { productId, quantity, price, profit, userId: req.user.userId }
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } }
      })
    ])

    res.json(sale)
  } catch (error) {
    console.error('Error creando venta:', error)
    res.status(500).json({ error: 'No se pudo registrar la venta' })
  }
}

export async function getSales(req, res) {
  const sales = await prisma.sale.findMany({
    where: { userId: req.user.userId },
    include: {
      product: {
        select: { id: true, name: true }
      }
    },
    orderBy: { date: 'desc' }
  })

  res.json(sales)
}

export async function updateSale(req, res) {
  const { id } = req.params
  const parsed = parseSaleInput(req.body)

  if (parsed.error) {
    return res.status(400).json({ error: parsed.error })
  }

  try {
    const sale = await prisma.sale.findFirst({
      where: { id, userId: req.user.userId }
    })

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }

    const { productId, quantity, price } = parsed.value

    const product = await prisma.product.findFirst({
      where: { id: productId, userId: req.user.userId }
    })

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    // Stock disponible = stock actual + lo que ya estaba descontado por esta venta
    const stockDisponible = product.stock + sale.quantity
    if (stockDisponible < quantity) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${stockDisponible}`
      })
    }

    const profit = calcProfit(product, price, quantity)
    const stockDelta = sale.quantity - quantity // positivo = devuelve, negativo = descuenta más

    const [updatedSale] = await prisma.$transaction([
      prisma.sale.update({
        where: { id },
        data: { productId, quantity, price, profit },
        include: { product: { select: { id: true, name: true } } }
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: stockDelta } }
      })
    ])

    res.json(updatedSale)
  } catch (error) {
    console.error('Error actualizando venta:', error)
    res.status(500).json({ error: 'No se pudo actualizar la venta' })
  }
}

export async function deleteSale(req, res) {
  const { id } = req.params

  try {
    const sale = await prisma.sale.findFirst({
      where: { id, userId: req.user.userId }
    })

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }

    // Restaurar stock al eliminar venta
    await prisma.$transaction([
      prisma.sale.delete({ where: { id } }),
      prisma.product.update({
        where: { id: sale.productId },
        data: { stock: { increment: sale.quantity } }
      })
    ])

    res.json({ ok: true })
  } catch (error) {
    console.error('Error eliminando venta:', error)
    res.status(500).json({ error: 'No se pudo eliminar la venta' })
  }
}