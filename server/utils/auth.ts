import type { H3Event } from 'h3'
import prisma from './prisma'
import { getSessionUserId } from './session'

export async function getUserFromEvent(event: H3Event) {
  if (event.context.user) return event.context.user

  const userId = getSessionUserId(event)
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true }
  })

  if (user) {
    event.context.user = user
  }

  return user
}

export async function requireAuth(event: H3Event) {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}
