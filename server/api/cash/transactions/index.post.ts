import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { type, amount, description, date } = body

  if (!type || !amount || !date) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  if (!['income', 'expense'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type must be income or expense' })
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive number' })
  }

  const transaction = await prisma.cashTransaction.create({
    data: {
      userId: user.id,
      type,
      amount,
      description: description || null,
      date: new Date(date)
    }
  })

  return transaction
})
