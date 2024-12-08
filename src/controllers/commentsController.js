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
  search = `"${search}"*`

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
    const comments = await prisma.$queryRaw`SELECT 
      c.id, 
      c.content, 
      c.score, 
      c.tags, 
      c.updateAt, 
      (
          SELECT JSON_OBJECT(
              'bookId', b.bookId, 
              'title', b.en_title,
              'ori_title', b.title, 
              'author', b.author, 
              'tags', b.tags, 
              'score', b.score, 
              'scorerCount', b.scorerCount, 
              'countWord', b.countWord, 
              'cover', b.cover
          ) 
          FROM books b 
          WHERE b.bookId = c.bookId
      ) AS book,
      JSON_OBJECT(
          'creatorId', u.id, 
          'userName', u.userName
      ) AS creator
  FROM 
      comments c 
  JOIN 
      comments_fts fts 
  ON 
      c.id = fts.id 
  LEFT JOIN 
      users u 
  ON 
      c.createrId = u.id 
  WHERE 
      fts.content MATCH ${search} LIMIT ${limit} OFFSET ${skip}`

    let parsedComments = comments.map(comment => ({
      ...comment,
      book: JSON.parse(comment.book),
      creator: JSON.parse(comment.creator)
    }))

    const totalCommentsResult =
      await prisma.$queryRaw`SELECT COUNT(*) as total FROM comments_fts WHERE content MATCH ${search}`
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
