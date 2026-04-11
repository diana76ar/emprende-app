import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import productRoutes from './routes/product.routes.js'
import saleRoutes from './routes/sale.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'

dotenv.config()

const app = express() // 🔴 ESTA LÍNEA FALTABA

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/products', productRoutes)
app.use('/sales', saleRoutes)
app.use('/dashboard', dashboardRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})