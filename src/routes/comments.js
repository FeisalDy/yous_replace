import { Router } from 'express'
import {
  getComment,
  getComments_FullTextSearch
} from '../controllers/commentsController.js'

const router = Router()

// router.get('/books', getBooks)
router.get('/comments', getComment)
router.get('/comments/search', getComments_FullTextSearch)

export default router
