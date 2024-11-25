import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function getBooks (req, res) {
  const {
    page = 1,
    limit = 10,
    search = '',
    searchBy = 'title',
    sortBy = 'bookId',
    order = 'asc'
  } = req.query

  const validSearchFields = ['title', 'author', 'tags']
  const validSortBy = ['bookId', 'score', 'scoreCount', 'countWord', 'updateAt']

  const validations = [
    { condition: !page, message: 'page cannot be empty.' },
    { condition: !limit, message: 'limit cannot be empty.' },
    {
      condition: !searchBy,
      message: 'searchBy cannot be empty. It can be title, author, or tags.'
    },
    {
      condition: !validSearchFields.includes(searchBy),
      message: `Invalid searchBy field. It can be one of the following: ${validSearchFields.join(
        ', '
      )}.`
    },
    {
      condition: !validSortBy.includes(sortBy),
      message: `Invalid sortBy field. It can be one of the following: ${validSortBy.join(
        ', '
      )}.`
    }
  ]

  for (const { condition, message } of validations) {
    if (condition) {
      return res.status(400).json({ error: message })
    }
  }

  const skip = (page - 1) * limit

  try {
    let whereClause = {}

    if (search) {
      const keywords = search.split(',').map(keyword => keyword.trim())
      whereClause =
        searchBy === 'tags'
          ? { AND: keywords.map(keyword => ({ tags: { contains: keyword } })) }
          : { [searchBy]: { contains: search } }
    }

    const [books, totalBooks] = await Promise.all([
      prisma.books.findMany({
        where: whereClause,
        orderBy: { [sortBy]: order.toLowerCase() === 'desc' ? 'desc' : 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.books.count({ where: whereClause })
    ])

    return res.status(200).json({
      data: books,
      pagination: {
        total: totalBooks,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalBooks / limit)
      }
    })
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Server error', message: error.message })
  }
}

export async function getBook (req, res) {
  let {
    bookId,
    title,
    includesComment = false,
    page = 1,
    limit = 10
  } = req.query

  includesComment = includesComment === 'true' // Correct handling of boolean string
  page = Number(page)
  limit = Number(limit)

  if (!bookId && !title) {
    return res.status(400).json({
      error: 'Either bookId or title must be provided.'
    })
  }

  if (bookId && title) {
    return res.status(400).json({
      error: 'Please provide either bookId or title, not both.'
    })
  }

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return res.status(400).json('Page and limit must be positive numbers')
  }

  const skip = (page - 1) * limit

  try {
    const whereClause = {}
    const includeClause = {}

    if (bookId) {
      whereClause.bookId = parseInt(bookId)
    }
    if (title) {
      whereClause.title = { contains: title }
    }
    if (includesComment) {
      includeClause.skip = skip
      includeClause.take = limit
    }
    console.log(includesComment)

    const book = await prisma.books.findFirst({
      where: whereClause,
      include: {
        comments: includesComment ? includeClause : false
      }
    })

    if (!book) {
      return res.status(404).json({ error: 'Book not found.' })
    }

    // return res.json(book)

    const totalComments = await prisma.comments.count({
      where: { bookId: book.bookId }
    })

    return res.status(200).json({
      data: book,
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
