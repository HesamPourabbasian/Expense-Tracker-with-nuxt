import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { name, icon } = body

  if (!name || !icon) {
    throw createError({ statusCode: 400, statusMessage: 'Name and icon are required' })
  }

  const account = await prisma.bankAccount.create({
    data: { userId: user.id, name, icon }
  })

  return account
})
