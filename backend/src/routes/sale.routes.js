import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
	createSale,
	deleteSale,
	getSales,
	updateSale
} from '../controllers/sale.controller.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/', createSale)
router.get('/', getSales)
router.put('/:id', updateSale)
router.delete('/:id', deleteSale)

export default router