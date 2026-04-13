import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
	createProduct,
	deleteProduct,
	getProducts,
	updateProduct,
	uploadProductImage
} from '../controllers/product.controller.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/', uploadProductImage, createProduct)
router.get('/', getProducts)
router.put('/:id', uploadProductImage, updateProduct)
router.delete('/:id', deleteProduct)

export default router