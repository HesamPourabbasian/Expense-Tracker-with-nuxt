import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)

  const transaction = await prisma.transaction.findUnique({ where: { id } })
  if (!transaction || transaction.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'تراکنش یافت نشد' })
  }

  if (transaction.relatedTransactionId) {
    await prisma.transaction.deleteMany({
      where: {
        id: { in: [transaction.id, transaction.relatedTransactionId] },
        userId: user.id
      }
    })
  } else {
    await prisma.transaction.delete({ where: { id } })
  }
  return { success: true }
})
