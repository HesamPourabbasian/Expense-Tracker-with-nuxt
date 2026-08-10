const marketSymbols: Record<string, string> = {
  BTC: 'BTCTMN',
  USDT: 'USDTTMN',
  ETH: 'ETHTMN',
  SOL: 'SOLTMN',
  LTC: 'LTCTMN',
  DOGE: 'DOGETMN'
}

interface WallexResponse {
  success: boolean
  result?: {
    symbols?: Record<string, {
      stats?: { lastPrice?: string; '24h_ch'?: number }
    }>
  }
}

interface PriceResponse {
  prices: Record<string, { price: number; change24h: number }>
  unit: 'IRR'
  source: string
  updatedAt: string
  stale: boolean
}

let cache: PriceResponse | null = null
let cacheExpiresAt = 0

export default defineEventHandler(async () => {
  if (cache && Date.now() < cacheExpiresAt) return cache

  try {
    const response = await $fetch<WallexResponse>('https://api.wallex.ir/v1/markets', {
      timeout: 8000,
      retry: 1
    })
    if (!response.success || !response.result?.symbols) throw new Error('Invalid Wallex response')

    const prices: PriceResponse['prices'] = {}
    for (const [symbol, marketSymbol] of Object.entries(marketSymbols)) {
      const stats = response.result.symbols[marketSymbol]?.stats
      const tomanPrice = Number(stats?.lastPrice)
      if (Number.isFinite(tomanPrice) && tomanPrice > 0) {
        prices[symbol] = {
          price: tomanPrice * 10,
          change24h: Number(stats?.['24h_ch']) || 0
        }
      }
    }

    if (!Object.keys(prices).length) throw new Error('No market prices returned')
    cache = { prices, unit: 'IRR', source: 'Wallex', updatedAt: new Date().toISOString(), stale: false }
    cacheExpiresAt = Date.now() + 60_000
    return cache
  } catch {
    if (cache) return { ...cache, stale: true }
    throw createError({ statusCode: 502, statusMessage: 'Live crypto prices are temporarily unavailable' })
  }
})
