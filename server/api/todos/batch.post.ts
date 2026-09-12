import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody<{ action?: string; date?: string; targetDate?: string }>(event)
  const action = body?.action
  const dateStr = body?.date
  const targetDateStr = body?.targetDate

  if (!action || !dateStr) {
    throw createError({ statusCode: 400, statusMessage: 'نوع عملیات و تاریخ مشخص نشده است' })
  }

  const dayStart = new Date(`${dateStr}T00:00:00.000Z`)
  if (Number.isNaN(dayStart.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'تاریخ نامعتبر است' })
  }

  const dayEnd = new Date(dayStart)
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
  const dayRange = { gte: dayStart, lt: dayEnd }

  if (action === 'markAllCompleted') {
    await prisma.todo.updateMany({
      where: { userId: user.id, date: dayRange, completed: false },
      data: { completed: true }
    })
    return { success: true }
  }

  if (action === 'clearCompleted') {
    await prisma.todo.deleteMany({
      where: { userId: user.id, date: dayRange, completed: true }
    })
    return { success: true }
  }

  if (action === 'movePending') {
    if (!targetDateStr) {
      throw createError({ statusCode: 400, statusMessage: 'تاریخ مقصد مشخص نشده است' })
    }
    const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`)
    if (Number.isNaN(targetDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'تاریخ مقصد نامعتبر است' })
    }

    await prisma.todo.updateMany({
      where: { userId: user.id, date: dayRange, completed: false },
      data: { date: targetDate }
    })
    return { success: true }
  }

  throw createError({ statusCode: 400, statusMessage: 'عملیات نامعتبر است' })
})
