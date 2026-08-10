import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid account ID' })
  }

  const account = await prisma.bankAccount.findFirst({
    where: { id, userId: user.id },
    include: {
      _count: { select: { transactions: true } },
      transactions: { select: { type: true, amount: true } }
    }
  })

  if (!account) {
    throw createError({ statusCode: 404, statusMessage: 'Account not found' })
  }

  const { transactions, ...details } = account
  return {
    ...details,
    balance: transactions.reduce((total, transaction) => (
      total + (transaction.type === 'income' ? transaction.amount : -transaction.amount)
    ), 0)
  }
})
