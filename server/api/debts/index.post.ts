import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)
  const { person, amount, type, description, date } = body

  if (!person || !amount || !type || !date) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  if (!['I_OWE', 'OWED_TO_ME'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type must be I_OWE or OWED_TO_ME' })
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive number' })
  }

  const debt = await prisma.debt.create({
    data: {
      userId: user.id,
      person,
      amount,
      type,
      description: description || null,
      date: new Date(date)
    }
  })

  return debt
})
