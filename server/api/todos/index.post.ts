import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody<{ title?: unknown; description?: unknown; date?: unknown }>(event)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : null
  const date = typeof body?.date === 'string' ? new Date(`${body.date}T00:00:00.000Z`) : null

  if (!title) throw createError({ statusCode: 400, statusMessage: 'Task title is required' })
  if (!date || Number.isNaN(date.getTime())) throw createError({ statusCode: 400, statusMessage: 'Invalid date' })

  return prisma.todo.create({
    data: { userId: user.id, title, description: description || null, date }
  })
})
