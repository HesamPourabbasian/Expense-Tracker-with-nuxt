export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { user, fetchUser } = useAuth()

  if (!user.value) {
    await fetchUser()
  }

  if (to.path !== '/login' && !user.value) {
    return navigateTo('/login')
  }

  if (to.path === '/login' && user.value) {
    return navigateTo('/')
  }
})
