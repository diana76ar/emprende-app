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

export async function getDashboard(req, res) {
  try {
    const userId = req.user.userId
    const period = String(req.query.period || 'month')
    const startDate = getStartDate(period)

    const where = { userId }
    if (startDate) {
      where.date = { gte: startDate }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { product: true }
  } catch (error) {
    console.error("❌ DASHBOARD ERROR:", error)
    res.status(500).json({ error: 'Error en dashboard' })
  
    })

    const products = await prisma.product.findMany({
      where: { userId }
    })

    let totalProfit = 0
    let totalRevenue = 0

    const productStats = {}

    for (const sale of sales) {
      totalProfit += sale.profit
      totalRevenue += sale.price * sale.quantity

      if (!productStats[sale.productId]) {
        productStats[sale.productId] = {
          name: sale.product.name,
          profit: 0
        }
      }

      productStats[sale.productId].profit += sale.profit
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

      const marginPercent = (calc.profit / calc.totalCost) * 100

      if (marginPercent < 20) {
        alerts.push({
          type: 'low_margin',
          message: `El producto "${product.name}" tiene bajo margen`
        })
      }
    }

    // ✅ RANKING CORRECTO
    const ranking = Object.values(productStats)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)

    // 🤖 INSIGHTS
    const insights = []

    // 1. Sin ventas en el periodo
    if (sales.length === 0) {
      insights.push({
        type: 'no_sales',
        message: 'Todavia no hay ventas en este periodo. Empeza a cargar datos'
      })
    }

    // 2. Margen bajo por producto
    for (const product of products) {
      const calc = calculateProduct(product)
      const marginPercent = (calc.profit / calc.totalCost) * 100
      if (marginPercent < 20) {
        insights.push({
          type: 'low_margin',
          message: `Subi el precio de "${product.name}". Margen muy bajo (${marginPercent.toFixed(0)}%)`
        })
      }
    }

    // 3. Dependencia de un solo producto
    if (ranking.length > 0 && totalProfit > 0) {
      const top = ranking[0]
      const percent = (top.profit / totalProfit) * 100
      if (percent > 60) {
        insights.push({
          type: 'dependency',
          message: `Dependes demasiado de "${top.name}" (${percent.toFixed(0)}% de las ganancias). Diversifica tu catalogo`
        })
      }
    }

    // 4. Producto estrella — oportunidad de escalar
    if (ranking.length > 0 && sales.length > 0) {
      const top = ranking[0]
      insights.push({
        type: 'opportunity',
        message: `Potencia "${top.name}". Es tu producto mas rentable del periodo`
      })
    }

    const metrics = {
      totalProfit,
      salesCount,
      avgTicket,
      topProduct,
      worstProduct
    }

    // 🧠 SCORE INTELIGENTE
    let score = 0
    const scoreDetails = []

    const margins = products.map(p => {
      const calc = calculateProduct(p)
      return calc.totalCost > 0 ? (calc.profit / calc.totalCost) * 100 : 0
    })
    const avgMargin = margins.length > 0
      ? margins.reduce((a, b) => a + b, 0) / margins.length
      : 0

    if (avgMargin > 40) {
      score += 40
      scoreDetails.push('Buen margen de ganancia')
    } else if (avgMargin > 20) {
      score += 25
      scoreDetails.push('Margen aceptable, pero mejorable')
    } else {
      score += 10
      scoreDetails.push('Margen bajo, deberia subir precios')
    }

    if (salesCount > 10) {
      score += 30
      scoreDetails.push('Buen volumen de ventas')
    } else if (salesCount > 3) {
      score += 20
      scoreDetails.push('Ventas moderadas')
    } else {
      score += 10
      scoreDetails.push('Pocas ventas en este periodo')
    }

    if (ranking.length > 0) {
      const top = ranking[0]
      const percent = (top.profit / (totalProfit || 1)) * 100
      if (percent < 50) {
        score += 30
        scoreDetails.push('Ingresos bien diversificados')
      } else if (percent < 70) {
        score += 15
        scoreDetails.push('Dependencia moderada de un producto')
      } else {
        score += 5
        scoreDetails.push('Alta dependencia de un solo producto')
      }
    }

    let status = 'low'
    let statusText = 'Riesgo'
    if (score >= 70) {
      status = 'good'
      statusText = 'Estas creciendo bien'
    } else if (score >= 40) {
      status = 'medium'
      statusText = 'Podes mejorar'
    }

    res.json({
      period,
      metrics,
      alerts,
      ranking,
      insights,
      score: { value: score, status, statusText, details: scoreDetails }
    })

  } catch (error) {
    console.error("❌ ERROR DASHBOARD:", error)
    res.status(500).json({ error: "Error en dashboard" })
  }
}