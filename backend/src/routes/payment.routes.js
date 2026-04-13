import express from 'express'
import { createCheckout, handleWebhook } from '../controllers/payment.controller.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.post('/checkout', authMiddleware, createCheckout)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook)

export default router