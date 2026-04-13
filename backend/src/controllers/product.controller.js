import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma.js'
import { calculateProduct } from '../services/calc.service.js'
import { PLANS } from '../config/plans.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '../../uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos de imagen'))
    }
  }
})

export { upload }

export function uploadProductImage(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (!error) return next()

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'La imagen supera 5MB.' })
    }

    return res.status(400).json({ error: error.message || 'Archivo de imagen no valido' })
  })
}

function validateProductInput(data) {
  const name = String(data.name || '').trim()
  const costBase = Number(data.costBase)
  const costShipping = Number(data.costShipping)
  const costCommission = Number(data.costCommission)
  const costOther = Number(data.costOther)
  const margin = Number(data.margin)
  const stock = data.stock !== undefined ? Number(data.stock) : 0

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

  if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    return { error: 'El stock debe ser un entero mayor o igual a 0' }
  }

  return {
    value: {
      name,
      type: String(data.type || 'reventa'),
      costBase,
      costShipping,
      costCommission,
      costOther,
      margin,
      stock
    }
  }
}

// ✅ Crear producto
export async function createProduct(req, res) {
  try {
    const parsed = validateProductInput(req.body)

    if (parsed.error) {
      return res.status(400).json({ error: parsed.error })
    }

    const data = {
      ...parsed.value,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null
    }

    // 🔥 Verificar límite de productos
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    })

    const plan = PLANS[user.plan]

    const count = await prisma.product.count({
      where: { userId: req.user.userId }
    })

    if (count >= plan.maxProducts) {
      return res.status(403).json({
        error: 'Límite alcanzado. Pasate a PRO 🚀'
      })
    }

    const calc = calculateProduct(data)

    const product = await prisma.product.create({
      data: {
        ...data,
        userId: req.user.userId
      }
    })

    res.json({ product, calc })
  } catch (error) {
    console.error('Error creando producto:', error)
    res.status(500).json({ error: 'No se pudo guardar el producto' })
  }
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
  try {
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

    const updateData = {
      ...parsed.value,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : existing.imageUrl
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    })

    res.json({ product, calc: calculateProduct(product) })
  } catch (error) {
    console.error('Error actualizando producto:', error)
    res.status(500).json({ error: 'No se pudo guardar el producto' })
  }
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