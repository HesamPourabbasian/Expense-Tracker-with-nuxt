import { verify } from 'argon2'
import prisma from '~~/server/utils/prisma'
import { setSessionCookie } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: unknown; password?: unknown }>(event)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Username and password are required' })
  }

  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } }
  })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const valid = await verify(user.password, password)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  setSessionCookie(event, user.id)

  return { id: user.id, username: user.username }
})
