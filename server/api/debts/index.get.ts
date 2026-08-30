import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)

  const where: any = { userId: user.id }

  if (query.type) {
    where.type = query.type
  }

  const debts = await prisma.debt.findMany({
    where,
    include: {
      bankAccount: {
        select: { id: true, name: true, icon: true }
      }
    },
    orderBy: { date: 'desc' }
  })

  return debts
})
