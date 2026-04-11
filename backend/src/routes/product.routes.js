import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
	createProduct,
	deleteProduct,
	getProducts,
	updateProduct
} from '../controllers/product.controller.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/', createProduct)
router.get('/', getProducts)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

export default router