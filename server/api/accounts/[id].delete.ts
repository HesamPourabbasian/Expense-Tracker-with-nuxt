import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)

  const account = await prisma.bankAccount.findUnique({ where: { id } })
  if (!account || account.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Account not found' })
  }

  await prisma.bankAccount.delete({ where: { id } })
  return { success: true }
})
