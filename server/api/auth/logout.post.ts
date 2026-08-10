import { clearSessionCookie } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  clearSessionCookie(event)
  return { success: true }
})
