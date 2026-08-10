import prisma from '~~/server/utils/prisma'
import { calculateCryptoPortfolio, getCryptoAsset } from '~~/server/utils/crypto'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const trades = await prisma.cryptoTrade.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } })
  const { grouped, realizedByTrade } = calculateCryptoPortfolio(trades)

  const holdings = [...grouped.entries()]
    .filter(([, holding]) => holding.quantity > 0.00000001)
    .map(([symbol, holding]) => ({
      symbol,
      ...getCryptoAsset(symbol),
      ...holding,
      averagePrice: holding.quantity ? holding.invested / holding.quantity : 0
    }))

  const buyVolume = trades.filter(trade => trade.type === 'BUY').reduce((sum, trade) => sum + trade.totalValue, 0)
  const sellVolume = trades.filter(trade => trade.type === 'SELL').reduce((sum, trade) => sum + trade.totalValue, 0)
  const realizedProfit = [...grouped.values()].reduce((sum, holding) => sum + holding.realizedProfit, 0)
  return {
    trades: trades.map(trade => ({ ...trade, realizedProfit: realizedByTrade.get(trade.id) || 0 })),
    holdings,
    summary: { buyVolume, sellVolume, realizedProfit, tradeCount: trades.length }
  }
})
