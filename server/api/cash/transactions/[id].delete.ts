import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)

  const transaction = await prisma.cashTransaction.findUnique({ where: { id } })
  if (!transaction || transaction.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Transaction not found' })
  }

  await prisma.cashTransaction.delete({ where: { id } })
  return { success: true }
})
