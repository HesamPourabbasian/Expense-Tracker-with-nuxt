export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/me') || path.startsWith('/api/_nuxt_icon/')) {
    return
  }

  if (path.startsWith('/api/')) {
    const user = await getUserFromEvent(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    event.context.user = user
  }
})
