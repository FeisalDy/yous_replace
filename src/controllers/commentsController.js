import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

export async function getComment (req, res) {
  let {
    bookId,
    page = 1,
    limit = 20,
    includeBook = false,
    includeCreator = false
  } = req.query

  page = parseInt(page)
  limit = parseInt(limit)
  includeBook = includeBook === 'true'
  includeCreator = includeCreator === 'true'

  if (!page || !limit) {
    return res.status(400).json({ error: 'Page and limit cannot be empty.' })
  }
  if (isNaN(page) || isNaN(limit)) {
    return res.status(400).json({ error: 'Page and limit must be numbers.' })
  }

  const skip = (page - 1) * limit

  try {
    const isBook = await prisma.books.findFirstOrThrow({
      where: { bookId: parseInt(bookId) }
    })

    if (isBook.error != null) {
      return res.status(404).json(isBook)
    }

    const whereClause = {
      ...(bookId && { bookId: parseInt(bookId) })
    }
    const [comments, totalComments] = await Promise.all([
      prisma.comments.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: { book: includeBook, creator: includeCreator }
      }),
      prisma.comments.count({ where: whereClause })
    ])

    return res.status(200).json({
      data: comments,
      pagination: {
        total: totalComments,
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit)
      }
    })
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Server error', message: error.message })
  }
}
export async function getComments_FullTextSearch (req, res) {
  BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString())
    return int ?? this.toString()
  }

  let { search, page = 1, limit = 20 } = req.query

  page = parseInt(page)
  limit = parseInt(limit)

  if (!page || !limit) {
    return res.status(400).json({ error: 'Page and limit cannot be empty.' })
  }
  if (isNaN(page) || isNaN(limit)) {
    return res.status(400).json({ error: 'Page and limit must be numbers.' })
  }

  const skip = (page - 1) * limit
  try {
    const comments =
      await prisma.$queryRaw`SELECT vc.id, vc.bookId, vc.createrId, vc.content, vc.createdAt, vc.essence, vc.inReview, vc.jurisdiction, vc.praiseCount, vc.replyCount, vc.score, vc.shielded, vc.tags, vc.updateAt, vc.voting, vc.collected, vc.replyable, (SELECT JSON_OBJECT('bookId', b.bookId, 'status', b.status, 'tags', b.tags, 'score', b.score, 'scorerCount', b.scorerCount, 'title', b.title, 'countWord', b.countWord, 'author', b.author, 'cover', b.cover,'updateAt', b.updateAt, 'caseId', b.caseId) FROM books b WHERE b.bookId = vc.bookId) AS book FROM virtual_comments vc WHERE vc.content = ${search} LIMIT ${limit} OFFSET ${skip}`

    const parsedComments = comments.map(comment => ({
      ...comment,
      book: JSON.parse(comment.book)
    }))

    const totalCommentsResult =
      await prisma.$queryRaw`SELECT COUNT(*) as total FROM virtual_comments (${search})`
    let totalComments = Number(totalCommentsResult[0]?.total || 0)
    return res.status(200).json({
      data: parsedComments,
      pagination: {
        total: totalComments,
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit)
      }
    })
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Server error', message: error.message })
  }
}
