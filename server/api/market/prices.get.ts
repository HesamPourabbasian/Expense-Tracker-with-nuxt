interface TgjuItem {
  p?: string
  h?: string
  l?: string
  d?: string
  dp?: number | string
  dt?: string
  t?: string
  t_en?: string
}

export interface MarketRate {
  id: string
  name: string
  symbol: string
  price: number
  priceToman: number
  change24h: number
  trend: 'up' | 'down' | 'neutral'
  icon: string
  color: string
}

export interface MarketPricesResponse {
  rates: MarketRate[]
  unit: 'IRR'
  updatedAt: string
  stale: boolean
}

let cache: MarketPricesResponse | null = null
let cacheExpiresAt = 0

const FALLBACK_RATES: MarketRate[] = [
  { id: 'usd', name: 'دلار آمریکا', symbol: 'USD', price: 2233000, priceToman: 223300, change24h: 0.13, trend: 'up', icon: 'tabler:currency-dollar', color: 'emerald' },
  { id: 'eur', name: 'یورو', symbol: 'EUR', price: 2601600, priceToman: 260160, change24h: 0.03, trend: 'up', icon: 'tabler:currency-euro', color: 'blue' },
  { id: 'try', name: 'لیر ترکیه', symbol: 'TRY', price: 46900, priceToman: 4690, change24h: 0.21, trend: 'up', icon: 'tabler:currency-lira', color: 'rose' },
  { id: 'usdt', name: 'تتر', symbol: 'USDT', price: 2239910, priceToman: 223991, change24h: -1.07, trend: 'down', icon: 'tabler:currency-tether', color: 'teal' },
  { id: 'gold18k', name: 'طلای ۱۸ عیار', symbol: 'گرم طلا', price: 231146000, priceToman: 23114600, change24h: -1.03, trend: 'down', icon: 'lucide:gem', color: 'amber' }
]

function parseItem(item?: TgjuItem): { price: number; change24h: number; trend: 'up' | 'down' | 'neutral' } | null {
  if (!item || !item.p) return null
  const price = Number(String(item.p).replace(/,/g, ''))
  if (!Number.isFinite(price) || price <= 0) return null
  const change24h = Math.abs(Number(item.dp) || 0)
  const trend = item.dt === 'high' ? 'up' : (item.dt === 'low' ? 'down' : 'neutral')
  return { price, change24h, trend }
}

export default defineEventHandler(async (): Promise<MarketPricesResponse> => {
  if (cache && Date.now() < cacheExpiresAt) {
    return cache
  }

  const hosts = ['call.tgju.org', 'call1.tgju.org', 'call2.tgju.org', 'call3.tgju.org', 'call4.tgju.org', 'call5.tgju.org']
  let currentData: Record<string, TgjuItem> | null = null

  for (const host of hosts) {
    try {
      const response = await $fetch<{ current?: Record<string, TgjuItem> }>(`https://${host}/ajax.json`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 4000,
        retry: 0
      })
      if (response && response.current) {
        currentData = response.current
        break
      }
    } catch {
      // Continue to next host
    }
  }

  try {
    if (currentData) {
      const usd = parseItem(currentData.price_dollar_rl)
      const eur = parseItem(currentData.price_eur)
      const tryRate = parseItem(currentData.price_try)
      const usdt = parseItem(currentData['crypto-tether-irr'])
      const gold = parseItem(currentData.geram18)

      const rates: MarketRate[] = []

      if (usd) {
        rates.push({
          id: 'usd',
          name: 'دلار آمریکا',
          symbol: 'USD',
          price: usd.price,
          priceToman: Math.round(usd.price / 10),
          change24h: usd.change24h,
          trend: usd.trend,
          icon: 'tabler:currency-dollar',
          color: 'emerald'
        })
      }

      if (eur) {
        rates.push({
          id: 'eur',
          name: 'یورو',
          symbol: 'EUR',
          price: eur.price,
          priceToman: Math.round(eur.price / 10),
          change24h: eur.change24h,
          trend: eur.trend,
          icon: 'tabler:currency-euro',
          color: 'blue'
        })
      }

      if (tryRate) {
        rates.push({
          id: 'try',
          name: 'لیر ترکیه',
          symbol: 'TRY',
          price: tryRate.price,
          priceToman: Math.round(tryRate.price / 10),
          change24h: tryRate.change24h,
          trend: tryRate.trend,
          icon: 'tabler:currency-lira',
          color: 'rose'
        })
      }

      if (usdt) {
        rates.push({
          id: 'usdt',
          name: 'تتر',
          symbol: 'USDT',
          price: usdt.price,
          priceToman: Math.round(usdt.price / 10),
          change24h: usdt.change24h,
          trend: usdt.trend,
          icon: 'tabler:currency-tether',
          color: 'teal'
        })
      }

      if (gold) {
        rates.push({
          id: 'gold18k',
          name: 'طلای ۱۸ عیار',
          symbol: 'گرم طلا',
          price: gold.price,
          priceToman: Math.round(gold.price / 10),
          change24h: gold.change24h,
          trend: gold.trend,
          icon: 'lucide:gem',
          color: 'amber'
        })
      }

      if (rates.length >= 3) {
        cache = {
          rates,
          unit: 'IRR',
          updatedAt: new Date().toISOString(),
          stale: false
        }
        cacheExpiresAt = Date.now() + 60_000
        return cache
      }
    }
  } catch {
    // Proceed to fallback
  }

  // Fallback to existing cache if available
  if (cache) {
    return { ...cache, stale: true }
  }

  // Fallback to default rates
  cache = {
    rates: FALLBACK_RATES,
    unit: 'IRR',
    updatedAt: new Date().toISOString(),
    stale: true
  }
  cacheExpiresAt = Date.now() + 30_000
  return cache
})
