import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)

  const debt = await prisma.debt.findUnique({ where: { id } })
  if (!debt || debt.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Debt not found' })
  }

  await prisma.debt.delete({ where: { id } })
  return { success: true }
})
