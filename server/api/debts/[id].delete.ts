import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)

  return await prisma.$transaction(async (tx) => {
    const debt = await tx.debt.findUnique({ where: { id } })
    if (!debt || debt.userId !== user.id) {
      throw createError({ statusCode: 404, statusMessage: 'Debt not found' })
    }

    if (debt.transactionId) {
      await tx.transaction.deleteMany({
        where: { id: debt.transactionId, userId: user.id }
      })
    }

    if (debt.cashTransactionId) {
      await tx.cashTransaction.deleteMany({
        where: { id: debt.cashTransactionId, userId: user.id }
      })
    }

    await tx.debt.delete({ where: { id } })
    return { success: true }
  })
})
