import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const icon = typeof body?.icon === 'string' ? body.icon.trim() : ''

  if (!name || !icon) {
    throw createError({ statusCode: 400, statusMessage: 'نام حساب و نماد الزامی است' })
  }

  const account = await prisma.bankAccount.create({
    data: { userId: user.id, name, icon }
  })

  return account
})
