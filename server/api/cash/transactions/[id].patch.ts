import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  const transaction = await prisma.cashTransaction.findUnique({ where: { id } })
  if (!transaction || transaction.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Transaction not found' })
  }

  const { type, amount, description, date } = body

  if (type && !['income', 'expense'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type must be income or expense' })
  }

  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive number' })
  }

  const updated = await prisma.cashTransaction.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(amount && { amount }),
      ...(description !== undefined && { description: description || null }),
      ...(date && { date: new Date(date) })
    }
  })

  return updated
})
