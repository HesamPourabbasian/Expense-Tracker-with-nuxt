export const cryptoAssets: Record<string, { asset: string; icon: string; color: string }> = {
  BTC: { asset: 'بیت‌کوین', icon: 'tabler:currency-bitcoin', color: '#d99a35' },
  ETH: { asset: 'اتریوم', icon: 'tabler:currency-ethereum', color: '#6877d8' },
  USDT: { asset: 'تتر', icon: 'mdi:currency-usd', color: '#26a17b' },
  LTC: { asset: 'لایت‌کوین', icon: 'mdi:litecoin', color: '#55708a' },
  SOL: { asset: 'سولانا', icon: 'tabler:currency-solana', color: '#8d6ce6' },
  DOGE: { asset: 'دوج‌کوین', icon: 'tabler:currency-dogecoin', color: '#b59b40' }
}

interface TradeInput {
  id: number
  symbol: string
  type: string
  quantity: number
  totalValue: number
  date: Date
}

export function getCryptoAsset(symbol: string) {
  return cryptoAssets[symbol] || { asset: symbol, icon: 'tabler:coin', color: '#176f55' }
}

export function calculateCryptoPortfolio(trades: TradeInput[]) {
  const grouped = new Map<string, { quantity: number; invested: number; realizedProfit: number }>()
  const realizedByTrade = new Map<number, number>()
  let valid = true

  for (const trade of [...trades].sort((a, b) => a.date.getTime() - b.date.getTime() || a.id - b.id)) {
    const holding = grouped.get(trade.symbol) || { quantity: 0, invested: 0, realizedProfit: 0 }
    if (trade.type === 'BUY') {
      holding.quantity += trade.quantity
      holding.invested += trade.totalValue
    } else {
      if (trade.quantity > holding.quantity + 0.00000001) valid = false
      const average = holding.quantity ? holding.invested / holding.quantity : 0
      const profit = trade.totalValue - average * trade.quantity
      holding.realizedProfit += profit
      realizedByTrade.set(trade.id, profit)
      holding.quantity = Math.max(0, holding.quantity - trade.quantity)
      holding.invested = Math.max(0, holding.invested - average * trade.quantity)
    }
    grouped.set(trade.symbol, holding)
  }

  return { grouped, realizedByTrade, valid }
}
