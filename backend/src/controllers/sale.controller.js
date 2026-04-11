import { prisma } from '../prisma.js'
import { calculateProduct } from '../services/calc.service.js'

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

function getSaleProfit(product, price, quantity) {
  const calc = calculateProduct(product)
  return (price - calc.totalCost) * quantity
}

export async function createSale(req, res) {
  const parsed = parseSaleInput(req.body)

  if (parsed.error) {
    return res.status(400).json({ error: parsed.error })
  }

  const { productId, quantity, price } = parsed.value

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: req.user.userId
    }
  })

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' })
  }

  const profit = getSaleProfit(product, price, quantity)

  const sale = await prisma.sale.create({
    data: {
      productId,
      quantity,
      price,
      profit,
      userId: req.user.userId
    }
  })

  res.json(sale)
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

  const sale = await prisma.sale.findFirst({
    where: {
      id,
      userId: req.user.userId
    }
  })

  if (!sale) {
    return res.status(404).json({ error: 'Venta no encontrada' })
  }

  const { productId, quantity, price } = parsed.value

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: req.user.userId
    }
  })

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' })
  }

  const updatedSale = await prisma.sale.update({
    where: { id },
    data: {
      productId,
      quantity,
      price,
      profit: getSaleProfit(product, price, quantity)
    },
    include: {
      product: {
        select: { id: true, name: true }
      }
    }
  })

  res.json(updatedSale)
}

export async function deleteSale(req, res) {
  const { id } = req.params

  const sale = await prisma.sale.findFirst({
    where: {
      id,
      userId: req.user.userId
    }
  })

  if (!sale) {
    return res.status(404).json({ error: 'Venta no encontrada' })
  }

  await prisma.sale.delete({
    where: { id }
  })

  res.json({ ok: true })
}