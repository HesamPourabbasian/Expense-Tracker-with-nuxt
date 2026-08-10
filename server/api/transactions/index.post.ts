import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { bankAccountId, type, amount, description, date } = body

  if (!bankAccountId || !type || !amount || !date) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  if (!['income', 'expense'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type must be income or expense' })
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive number' })
  }

  const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } })
  if (!account || account.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Account not found' })
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      bankAccountId,
      type,
      amount,
      description: description || null,
      date: new Date(date)
    }
  })

  return transaction
})
