import prisma from '~~/server/utils/prisma'
import { calculateCryptoPortfolio, cryptoAssets, getCryptoAsset } from '~~/server/utils/crypto'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody<{ symbol?: unknown; type?: unknown; quantity?: unknown; price?: unknown; note?: unknown; date?: unknown }>(event)
  const symbol = typeof body?.symbol === 'string' ? body.symbol.toUpperCase().trim() : ''
  const type = body?.type === 'BUY' || body?.type === 'SELL' ? body.type : ''
  const quantity = Number(body?.quantity)
  const price = Number(body?.price)
  const date = typeof body?.date === 'string' ? new Date(body.date) : new Date()

  if (!cryptoAssets[symbol]) throw createError({ statusCode: 400, statusMessage: 'Unsupported crypto asset' })
  if (!type) throw createError({ statusCode: 400, statusMessage: 'Trade type must be BUY or SELL' })
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) throw createError({ statusCode: 400, statusMessage: 'Quantity and price must be positive numbers' })
  if (Number.isNaN(date.getTime())) throw createError({ statusCode: 400, statusMessage: 'Invalid trade date' })

  if (type === 'SELL') {
    const trades = await prisma.cryptoTrade.findMany({ where: { userId: user.id, symbol }, orderBy: { date: 'asc' } })
    const available = calculateCryptoPortfolio(trades).grouped.get(symbol)?.quantity || 0
    if (quantity > available + 0.00000001) throw createError({ statusCode: 400, statusMessage: 'Not enough holdings to sell this amount' })
  }

  return prisma.cryptoTrade.create({
    data: {
      userId: user.id, asset: getCryptoAsset(symbol).asset, symbol, type,
      quantity, price, totalValue: quantity * price,
      note: typeof body.note === 'string' ? body.note.trim() || null : null, date
    }
  })
})
