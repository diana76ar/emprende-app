import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import productRoutes from './routes/product.routes.js'
import saleRoutes from './routes/sale.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import paymentRoutes from './routes/payment.routes.js'

dotenv.config()

const app = express() // 🔴 ESTA LÍNEA FALTABA

app.use(cors())
app.use(express.json())

app.use('/uploads', express.static('uploads'))

app.use('/auth', authRoutes)
app.use('/products', productRoutes)
app.use('/sales', saleRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/payment', paymentRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})