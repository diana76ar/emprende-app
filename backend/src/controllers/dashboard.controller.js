import { prisma } from '../prisma.js'
import { calculateProduct } from '../services/calc.service.js'

function getStartDate(period) {
  const now = new Date()
  const current = new Date(now)

  if (period === 'today') {
    current.setHours(0, 0, 0, 0)
    return current
  }

  if (period === 'week') {
    const day = current.getDay()
    const diff = day === 0 ? 6 : day - 1
    current.setDate(current.getDate() - diff)
    current.setHours(0, 0, 0, 0)
    return current
  }

  if (period === 'month') {
    current.setDate(1)
    current.setHours(0, 0, 0, 0)
    return current
  }

  return null
}

function getMonthRange(monthOffset = 0) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1)

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  return { start, end }
}

export async function getDashboard(req, res) {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'No user' })
    }

    //const userId = req.user.userId
    const period = String(req.query.period || 'month')
    const startDate = getStartDate(period)

    const where = { userId }
    if (startDate) {
      where.date = { gte: startDate }
    }

    const [{ start: currentMonthStart, end: currentMonthEnd }, { start: previousMonthStart, end: previousMonthEnd }] = [
      getMonthRange(0),
      getMonthRange(-1)
    ]

    const [sales, products, currentMonthSales, previousMonthSales, user] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: { product: true }
      }),
      prisma.product.findMany({
        where: { userId }
      }),
      prisma.sale.findMany({
        where: {
          userId,
          date: {
            gte: currentMonthStart,
            lt: currentMonthEnd
          }
        }
      }),
      prisma.sale.findMany({
        where: {
          userId,
          date: {
            gte: previousMonthStart,
            lt: previousMonthEnd
          }
        }
      })
      ,
      prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      })
    ])

    const totalRevenue = sales.reduce((acc, s) => acc + s.price * s.quantity, 0)
    const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0)
    const avgMargin = totalRevenue > 0
      ? Number(((totalProfit / totalRevenue) * 100).toFixed(1))
      : 0

    const productStats = {}

    for (const sale of sales) {
      if (!productStats[sale.productId]) {
        productStats[sale.productId] = {
          name: sale.product.name,
          profit: 0,
          revenue: 0
        }
      }

      productStats[sale.productId].profit += sale.profit
      productStats[sale.productId].revenue += sale.price * sale.quantity
    }

    const salesCount = sales.length
    const avgTicket = salesCount > 0 ? totalRevenue / salesCount : 0

    let topProduct = null
    let maxProfit = 0

    for (const p in productStats) {
      if (productStats[p].profit > maxProfit) {
        maxProfit = productStats[p].profit
        topProduct = productStats[p].name
      }
    }

    let worstProduct = null
    let minProfit = Infinity

    for (const p in productStats) {
      if (productStats[p].profit < minProfit) {
        minProfit = productStats[p].profit
        worstProduct = productStats[p].name
      }
    }

    const alerts = []

    for (const product of products) {
      const calc = calculateProduct(product)
      const marginPercent = calc.totalCost > 0 ? (calc.profit / calc.totalCost) * 100 : 0

      if (marginPercent < 20) {
        alerts.push({
          type: 'low_margin',
          message: `El producto "${product.name}" tiene bajo margen`
        })
      }

      if (product.stock === 0) {
        alerts.push({
          type: 'no_stock',
          message: `Sin stock: ${product.name}`
        })
      } else if (product.stock <= 3) {
        alerts.push({
          type: 'low_stock',
          message: `Stock bajo (${product.stock} unidades): ${product.name}`
        })
      }
    }

    // ✅ RANKING CORRECTO
    const ranking = Object.values(productStats)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)

    const insights = []

    const plan = user?.plan || 'free'
    const scoreThresholds = plan === 'pro'
      ? { profit: 65000, sales: 14, margin: 35 }
      : { profit: 50000, sales: 10, margin: 30 }

    if (avgMargin < (plan === 'pro' ? 22 : 20)) {
      insights.push('Tu margen es bajo, podrias aumentar precios')
    }

    if (totalProfit > scoreThresholds.profit) {
      insights.push('Excelente mes en ganancias')
    }

    if (salesCount === 0) {
      insights.push('No registraste ventas este mes')
    }

    const currentMonthRevenue = currentMonthSales.reduce((acc, s) => acc + s.price * s.quantity, 0)
    const previousMonthRevenue = previousMonthSales.reduce((acc, s) => acc + s.price * s.quantity, 0)
    const currentMonthProfit = currentMonthSales.reduce((acc, s) => acc + s.profit, 0)
    const previousMonthProfit = previousMonthSales.reduce((acc, s) => acc + s.profit, 0)
    let revenueDeltaPct = 0
    let profitDeltaPct = 0

    if (previousMonthRevenue > 0) {
      revenueDeltaPct = Number((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1))
      if (currentMonthRevenue > previousMonthRevenue) {
        insights.push('Estas creciendo respecto al mes pasado')
      } else if (currentMonthRevenue < previousMonthRevenue) {
        insights.push('Bajaste versus el mes pasado, revisa precios y promocion')
      }
    } else if (currentMonthRevenue > 0) {
      revenueDeltaPct = 100
      insights.push('Primer mes con ventas registradas, gran avance')
    }

    if (previousMonthProfit > 0) {
      profitDeltaPct = Number((((currentMonthProfit - previousMonthProfit) / previousMonthProfit) * 100).toFixed(1))
      if (currentMonthProfit > previousMonthProfit) {
        insights.push('Tu ganancia neta subio respecto al mes pasado')
      } else if (currentMonthProfit < previousMonthProfit) {
        insights.push('La ganancia neta cayo vs el mes pasado, revisa costos y mix de productos')
      }
    } else if (currentMonthProfit > 0) {
      profitDeltaPct = 100
    }

    const metrics = {
      totalRevenue,
      totalProfit,
      avgMargin,
      salesCount,
      avgTicket,
      topProduct,
      worstProduct
    }

    let score = 0

    if (totalProfit > scoreThresholds.profit) score += 40
    if (salesCount > scoreThresholds.sales) score += 30
    if (avgMargin > scoreThresholds.margin) score += 30

    if (plan === 'free' && score >= 60) {
      insights.push('Tu negocio ya tiene base solida. Con PRO podes activar analisis mas avanzados')
    }

    res.json({
      period,
      plan,
      metrics,
      alerts,
      ranking,
      insights,
      score,
      comparison: {
        currentMonthRevenue,
        previousMonthRevenue,
        revenueDeltaPct,
        currentMonthProfit,
        previousMonthProfit,
        profitDeltaPct
      }
    })

  } catch (error) {
    console.error("❌ ERROR DASHBOARD:", error)
    res.status(500).json({ error: "Error en dashboard" })
  }
}