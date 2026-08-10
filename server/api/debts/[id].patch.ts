import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  const debt = await prisma.debt.findUnique({ where: { id } })
  if (!debt || debt.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Debt not found' })
  }

  const { person, amount, type, description, status, date } = body

  if (type && !['I_OWE', 'OWED_TO_ME'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type must be I_OWE or OWED_TO_ME' })
  }

  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Amount must be a positive number' })
  }

  if (status && !['pending', 'paid'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Status must be pending or paid' })
  }

  const updated = await prisma.debt.update({
    where: { id },
    data: {
      ...(person && { person }),
      ...(amount && { amount }),
      ...(type && { type }),
      ...(description !== undefined && { description: description || null }),
      ...(status && { status }),
      ...(date && { date: new Date(date) })
    }
  })

  return updated
})
