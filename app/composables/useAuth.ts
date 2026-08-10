import type { User } from '~/types'

export function useAuth() {
  const user = useState<User | null>('auth_user', () => null)
  const loading = ref(false)

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const data = await $fetch<User>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      user.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    navigateTo('/login')
  }

  async function fetchUser() {
    try {
      const data = await $fetch<User>('/api/auth/me')
      user.value = data
      return data
    } catch {
      user.value = null
      return null
    }
  }

  return { user, loading, login, logout, fetchUser }
}
