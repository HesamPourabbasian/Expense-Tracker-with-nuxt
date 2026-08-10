import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)
  const { name, icon } = body

  const account = await prisma.bankAccount.findUnique({ where: { id } })
  if (!account || account.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Account not found' })
  }

  const updated = await prisma.bankAccount.update({
    where: { id },
    data: { ...(name && { name }), ...(icon && { icon }) }
  })

  return updated
})
