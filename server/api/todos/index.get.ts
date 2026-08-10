import prisma from '~~/server/utils/prisma'

function getDayRange(value: unknown) {
  const now = new Date()
  const defaultDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  const date = new Date(`${typeof value === 'string' ? value : defaultDate}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date' })
  }

  const nextDay = new Date(date)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  return { gte: date, lt: nextDay }
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const date = getQuery(event).date
  const todos = await prisma.todo.findMany({
    where: { userId: user.id, date: getDayRange(date) },
    orderBy: [{ completed: 'asc' }, { createdAt: 'asc' }]
  })

  const completed = todos.filter(todo => todo.completed).length
  return {
    todos,
    summary: {
      total: todos.length,
      completed,
      pending: todos.length - completed,
      percentage: todos.length ? Math.round((completed / todos.length) * 100) : 0
    }
  }
})
