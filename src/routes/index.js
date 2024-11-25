import { Router } from 'express'
import BookRouter from './books.js'
import CommentRouter from './comments.js'
import UserRouter from './users.js'

const router = Router()

router.use('/api', BookRouter)
router.use('/api', CommentRouter)
router.use('/api', UserRouter)

export default router
