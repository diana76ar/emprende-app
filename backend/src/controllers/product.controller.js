import { prisma } from '../prisma.js'
import { calculateProduct } from '../services/calc.service.js'

function validateProductInput(data) {
  const name = String(data.name || '').trim()
  const costBase = Number(data.costBase)
  const costShipping = Number(data.costShipping)
  const costCommission = Number(data.costCommission)
  const costOther = Number(data.costOther)
  const margin = Number(data.margin)

  if (!name) {
    return { error: 'El nombre es obligatorio' }
  }

  if ([costBase, costShipping, costCommission, costOther, margin].some(Number.isNaN)) {
    return { error: 'Costos y margen deben ser numericos' }
  }

  if (costBase <= 0) {
    return { error: 'El costo base debe ser mayor a 0' }
  }

  if (costShipping < 0 || costCommission < 0 || costOther < 0) {
    return { error: 'No se permiten costos negativos' }
  }

  if (margin < 0) {
    return { error: 'El margen no puede ser negativo' }
  }

  return {
    value: {
      name,
      type: String(data.type || 'reventa'),
      costBase,
      costShipping,
      costCommission,
      costOther,
      margin
    }
  }
}

// ✅ Crear producto
export async function createProduct(req, res) {
  const parsed = validateProductInput(req.body)

  if (parsed.error) {
    return res.status(400).json({ error: parsed.error })
  }

  const data = parsed.value

  const calc = calculateProduct(data)

  const product = await prisma.product.create({
    data: {
      ...data,
      userId: req.user.userId
    }
  })

  res.json({ product, calc })
}

// ✅ Obtener productos
export async function getProducts(req, res) {
  const products = await prisma.product.findMany({
    where: { userId: req.user.userId },
    orderBy: { name: 'asc' }
  })

  res.json(products)
}

export async function updateProduct(req, res) {
  const { id } = req.params
  const parsed = validateProductInput(req.body)

  if (parsed.error) {
    return res.status(400).json({ error: parsed.error })
  }

  const existing = await prisma.product.findFirst({
    where: {
      id,
      userId: req.user.userId
    }
  })

  if (!existing) {
    return res.status(404).json({ error: 'Producto no encontrado' })
  }

  const product = await prisma.product.update({
    where: { id },
    data: parsed.value
  })

  res.json({ product, calc: calculateProduct(product) })
}

export async function deleteProduct(req, res) {
  const { id } = req.params

  const product = await prisma.product.findFirst({
    where: {
      id,
      userId: req.user.userId
    }
  })

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' })
  }

  await prisma.$transaction([
    prisma.sale.deleteMany({
      where: {
        productId: id,
        userId: req.user.userId
      }
    }),
    prisma.product.delete({
      where: { id }
    })
  ])

  res.json({ ok: true })
}