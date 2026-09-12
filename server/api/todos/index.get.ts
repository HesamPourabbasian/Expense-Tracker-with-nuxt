import prisma from '~~/server/utils/prisma'
import moment from 'jalali-moment'

function getDayRange(value: unknown) {
  const now = new Date()
  const defaultDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  const dateStr = typeof value === 'string' && value ? value : defaultDate
  const date = new Date(`${dateStr}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date' })
  }

  const nextDay = new Date(date)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  return { gte: date, lt: nextDay, dateStr, date }
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const dateParam = getQuery(event).date
  const { gte, lt, dateStr } = getDayRange(dateParam)

  // 1. Get todos for selected day
  const todos = await prisma.todo.findMany({
    where: { userId: user.id, date: { gte, lt } },
    orderBy: [{ completed: 'asc' }, { createdAt: 'asc' }]
  })

  const completed = todos.filter(todo => todo.completed).length

  // 2. Get week summary for Persian week (Saturday to Friday)
  const sat = moment(dateStr).locale('fa').startOf('week')
  const fri = moment(sat).add(6, 'days')

  const weekStart = new Date(`${sat.format('YYYY-MM-DD')}T00:00:00.000Z`)
  const weekEnd = new Date(`${fri.format('YYYY-MM-DD')}T23:59:59.999Z`)

  const weekTodos = await prisma.todo.findMany({
    where: {
      userId: user.id,
      date: { gte: weekStart, lte: weekEnd }
    },
    select: { date: true, completed: true }
  })

  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const d = moment(sat).add(i, 'days')
    const dStr = d.format('YYYY-MM-DD')
    const dayStart = new Date(`${dStr}T00:00:00.000Z`).getTime()
    const dayEnd = dayStart + 86400000

    const matching = weekTodos.filter(t => {
      const time = new Date(t.date).getTime()
      return time >= dayStart && time < dayEnd
    })

    const dayCompleted = matching.filter(t => t.completed).length
    weekDays.push({
      date: dStr,
      dayName: d.format('dddd'),
      shortDayName: d.format('dd'),
      jalaliDay: d.format('jDD'),
      jalaliMonth: d.format('jMMMM'),
      total: matching.length,
      completed: dayCompleted,
      pending: matching.length - dayCompleted
    })
  }

  return {
    todos,
    summary: {
      total: todos.length,
      completed,
      pending: todos.length - completed,
      percentage: todos.length ? Math.round((completed / todos.length) * 100) : 0
    },
    weekDays
  }
})
