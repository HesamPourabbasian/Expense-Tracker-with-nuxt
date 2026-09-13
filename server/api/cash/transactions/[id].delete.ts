import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'شناسه تراکنش نامعتبر است' })
  }

  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.cashTransaction.findUnique({ where: { id } })
    if (!transaction || transaction.userId !== user.id) {
      throw createError({ statusCode: 404, statusMessage: 'Transaction not found' })
    }

    await tx.debt.updateMany({
      where: {
        cashTransactionId: id,
        userId: user.id
      },
      data: {
        status: 'pending',
        cashTransactionId: null,
        bankAccountId: null,
        isCash: false,
        paymentDate: null
      }
    })

    await tx.cashTransaction.delete({ where: { id } })
    return { success: true }
  })
})
