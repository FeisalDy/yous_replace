import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function getUser (req, res) {
  let { id, page = 1, limit = 10 } = req.query

  id = Number(id)
  page = Number(page)
  limit = Number(limit)

  if (!id) {
    return res.status(400).json('UserId is required')
  }

  if (isNaN(id)) {
    return res.status(400).json('UserId must be a number')
  }

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return res.status(400).json('Page and limit must be positive numbers')
  }

  const skip = (page - 1) * limit

  try {
    const user = await prisma.users.findUnique({
      where: { id: id },
      select: {
        id: true,
        userName: true,
        comments: {
          select: {
            id: true,
            content: true,
            score: true,
            tags: true,
            updateAt: true
          },
          skip,
          take: limit
        }
      }
    })

    if (!user) {
      return res.status(404).json('User not found')
    }

    const totalComments = await prisma.comments.count({
      where: { createrId: id }
    })

    return res.status(200).json({
      //   user: {
      //     id: user.id,
      //     username: user.userName
      //   },
      //   comments: user.comments,
      user,
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
