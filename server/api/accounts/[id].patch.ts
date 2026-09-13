import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'شناسه حساب نامعتبر است' })
  }

  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : undefined
  const icon = typeof body?.icon === 'string' ? body.icon.trim() : undefined

  if (name !== undefined && !name) {
    throw createError({ statusCode: 400, statusMessage: 'نام حساب نمی‌تواند خالی باشد' })
  }

  const account = await prisma.bankAccount.findUnique({ where: { id } })
  if (!account || account.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'حساب یافت نشد' })
  }

  const updated = await prisma.bankAccount.update({
    where: { id },
    data: { ...(name && { name }), ...(icon && { icon }) }
  })

  return updated
})
