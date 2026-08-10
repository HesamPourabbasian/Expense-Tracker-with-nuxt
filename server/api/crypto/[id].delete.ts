import prisma from '~~/server/utils/prisma'
import { calculateCryptoPortfolio } from '~~/server/utils/crypto'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'Invalid trade ID' })
  const trade = await prisma.cryptoTrade.findFirst({ where: { id, userId: user.id } })
  if (!trade) throw createError({ statusCode: 404, statusMessage: 'Trade not found' })

  const remaining = await prisma.cryptoTrade.findMany({ where: { userId: user.id, NOT: { id } } })
  if (!calculateCryptoPortfolio(remaining).valid) {
    throw createError({ statusCode: 400, statusMessage: 'Delete later sell trades before deleting this purchase' })
  }
  await prisma.cryptoTrade.delete({ where: { id } })
  return { success: true }
})
