import prisma from '~~/server/utils/prisma'
import { calculateAccountBalance } from '~~/server/utils/account'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { transactions: true } },
      transactions: {
        select: {
          type: true,
          amount: true,
          isUnnecessary: true,
          bankAccountId: true,
          sourceAccountId: true,
          destinationAccountId: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  return accounts.map(({ transactions, ...account }) => ({
    ...account,
    balance: calculateAccountBalance(transactions, account.id),
    unnecessaryExpense: transactions.reduce((total, transaction) => (
      total + (transaction.type === 'expense' && transaction.isUnnecessary ? transaction.amount : 0)
    ), 0)
  }))
})
