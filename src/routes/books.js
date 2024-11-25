import { Router } from 'express'
import { getBooks, getBook } from '../controllers/booksController.js'

const router = Router()

router.get('/books', getBooks)
router.get('/book', getBook)

export default router
