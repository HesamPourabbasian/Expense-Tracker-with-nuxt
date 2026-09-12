import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ title?: unknown; description?: unknown; completed?: unknown; date?: unknown }>(event)

  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'Invalid task ID' })
  const existing = await prisma.todo.findFirst({ where: { id, userId: user.id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Task not found' })

  const title = typeof body?.title === 'string' ? body.title.trim() : undefined
  if (title !== undefined && !title) throw createError({ statusCode: 400, statusMessage: 'Task title is required' })

  const date = typeof body?.date === 'string' ? new Date(`${body.date}T00:00:00.000Z`) : undefined
  if (date !== undefined && Number.isNaN(date.getTime())) throw createError({ statusCode: 400, statusMessage: 'Invalid date' })

  return prisma.todo.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(body.description !== undefined && { description: typeof body.description === 'string' ? body.description.trim() || null : null }),
      ...(typeof body.completed === 'boolean' && { completed: body.completed }),
      ...(date !== undefined && { date })
    }
  })
})
