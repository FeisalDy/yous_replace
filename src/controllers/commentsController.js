import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

export async function getComment (req, res) {
  let {
    bookId,
    page = 1,
    limit = 20,
    includeBook = true,
    includeCreator = true
  } = req.query

  page = Number(page)
  limit = Number(limit)
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
      where: { bookId: Number(bookId) }
    })

    if (isBook.error != null) {
      return res.status(404).json(isBook)
    }

    const whereClause = {
      ...(bookId && { bookId: Number(bookId) })
    }
    const [comments, totalComments] = await Promise.all([
      prisma.comments.findMany({
        select: {
          id: true,
          content: true,
          score: true,
          tags: true,
          updateAt: true,
          book: includeBook
            ? {
                select: {
                  bookId: true,
                  tags: true,
                  score: true,
                  scorerCount: true,
                  title: true,
                  countWord: true,
                  author: true,
                  cover: true
                }
              }
            : false,
          creator: includeCreator
            ? { select: { id: true, userName: true } }
            : false
        },
        where: whereClause,
        skip,
        take: limit
      }),
      prisma.comments.count({ where: whereClause })
    ])

    const parsedComments = comments.map(comment => {
      if (comment.creator) {
        comment.creator = {
          creatorId: comment.creator.id,
          userName: comment.creator.userName
        }
      }
      return comment
    })

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
export async function getComments_FullTextSearch (req, res) {
  BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString())
    return int ?? this.toString()
  }

  let { search, page = 1, limit = 20 } = req.query

  page = Number(page)
  limit = Number(limit)

  if (!page || !limit) {
    return res.status(400).json({ error: 'Page and limit cannot be empty.' })
  }
  if (isNaN(page) || isNaN(limit)) {
    return res.status(400).json({ error: 'Page and limit must be numbers.' })
  }

  const skip = (page - 1) * limit
  try {
    const comments =
      await prisma.$queryRaw`SELECT vc.id, vc.content, vc.score, vc.tags, vc.updateAt, (SELECT JSON_OBJECT('bookId', b.bookId, 'tags', b.tags, 'score', b.score, 'scorerCount', b.scorerCount, 'title', b.title, 'countWord', b.countWord, 'author', b.author, 'cover', b.cover) FROM books b WHERE b.bookId = vc.bookId) AS book, u.id as creatorId, u.userName FROM virtual_comments vc LEFT JOIN users u ON u.id = vc.createrId WHERE vc.content = ${search} LIMIT ${limit} OFFSET ${skip}`

    let parsedComments = comments.map(comment => ({
      ...comment,
      book: JSON.parse(comment.book),
      creator: {
        creatorId: comment.creatorId,
        userName: comment.userName
      }
    }))

    parsedComments.forEach(comment => {
      delete comment.creatorId // Remove creatorId
      delete comment.userName // Remove userName
    })

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
