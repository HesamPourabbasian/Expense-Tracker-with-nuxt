import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)

  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({ where: { id } })
    if (!transaction || transaction.userId !== user.id) {
      throw createError({ statusCode: 404, statusMessage: 'Transaction not found' })
    }

    const idsToDelete = transaction.relatedTransactionId
      ? [transaction.id, transaction.relatedTransactionId]
      : [transaction.id]

    await tx.debt.updateMany({
      where: {
        transactionId: { in: idsToDelete },
        userId: user.id
      },
      data: {
        status: 'pending',
        transactionId: null,
        bankAccountId: null,
        isCash: false,
        paymentDate: null
      }
    })

    await tx.transaction.deleteMany({
      where: {
        id: { in: idsToDelete },
        userId: user.id
      }
    })

    return { success: true }
  })
})
