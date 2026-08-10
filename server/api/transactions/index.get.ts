import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)
  const pageSize = 50
  const requestedPage = Number(query.page ?? 1)
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  
  const where: any = { userId: user.id }
  
  if (query.bankAccountId) {
    const bankAccountId = Number(query.bankAccountId)
    if (!Number.isInteger(bankAccountId) || bankAccountId <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid account ID' })
    }
    where.bankAccountId = bankAccountId
  }
  
  if (query.type && ['income', 'expense'].includes(String(query.type))) {
    where.type = query.type
  }

  const [total, transactions] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: { bankAccount: { select: { name: true, icon: true } } },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  return {
    transactions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
})
