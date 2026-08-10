import type { H3Event } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function setSessionCookie(event: H3Event, userId: number) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = `${userId}.${expiresAt}`
  const secret = useRuntimeConfig(event).sessionSecret

  setCookie(event, 'session_id', `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  })
}

export function getSessionUserId(event: H3Event) {
  const token = getCookie(event, 'session_id')
  if (!token) return null

  const [rawUserId, rawExpiresAt, signature] = token.split('.')
  const userId = Number(rawUserId)
  const expiresAt = Number(rawExpiresAt)
  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(expiresAt) || expiresAt <= Date.now() / 1000 || !signature) {
    return null
  }

  const payload = `${rawUserId}.${rawExpiresAt}`
  const expected = sign(payload, useRuntimeConfig(event).sessionSecret)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null
  }

  return userId
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, 'session_id', { path: '/' })
}
