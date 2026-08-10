import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { transactions: true } },
      transactions: { select: { type: true, amount: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  return accounts.map(({ transactions, ...account }) => ({
    ...account,
    balance: transactions.reduce((total, transaction) => (
      total + (transaction.type === 'income' ? transaction.amount : -transaction.amount)
    ), 0)
  }))
})
