<script setup lang="ts">
import type { CryptoHolding, CryptoMarketPrice, CryptoTrade } from '~/types'

interface CryptoResponse {
  trades: CryptoTrade[]
  holdings: CryptoHolding[]
  summary: { buyVolume: number; sellVolume: number; realizedProfit: number; tradeCount: number }
}

interface MarketResponse {
  prices: Record<string, CryptoMarketPrice>
  unit: 'IRR'
  source: string
  updatedAt: string
  stale: boolean
}

const toast = useToast()
const { toJalali } = useFormat()
const showTradeModal = ref(false)
const filter = ref<'ALL' | 'BUY' | 'SELL'>('ALL')
const { data, refresh, status } = await useFetch<CryptoResponse>('/api/crypto')
const { data: market, refresh: refreshMarket, status: marketStatus } = await useFetch<MarketResponse>('/api/crypto/prices')

const filteredTrades = computed(() => filter.value === 'ALL' ? data.value?.trades : data.value?.trades.filter(trade => trade.type === filter.value))
const totalInvested = computed(() => data.value?.holdings.reduce((sum, holding) => sum + holding.invested, 0) || 0)
const holdingsWithMarket = computed(() => data.value?.holdings.map(holding => {
  const quote = market.value?.prices[holding.symbol]
  const marketValue = quote ? holding.quantity * quote.price : 0
  return {
    ...holding,
    marketPrice: quote?.price || 0,
    change24h: quote?.change24h || 0,
    marketValue,
    unrealizedProfit: quote ? marketValue - holding.invested : 0
  }
}) || [])
const totalMarketValue = computed(() => holdingsWithMarket.value.reduce((sum, holding) => sum + holding.marketValue, 0))
const totalUnrealized = computed(() => totalMarketValue.value - totalInvested.value)
const marketUpdatedAt = computed(() => market.value?.updatedAt
  ? new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Tehran' }).format(new Date(market.value.updatedAt))
  : '')

let priceTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  priceTimer = setInterval(() => refreshMarket(), 60_000)
})

onUnmounted(() => clearInterval(priceTimer))

const assetMeta: Record<string, { icon: string; color: string }> = {
  BTC: { icon: 'tabler:currency-bitcoin', color: '#d99a35' }, ETH: { icon: 'tabler:currency-ethereum', color: '#6877d8' },
  USDT: { icon: 'mdi:currency-usd', color: '#26a17b' }, LTC: { icon: 'mdi:litecoin', color: '#55708a' },
  SOL: { icon: 'tabler:currency-solana', color: '#8d6ce6' }, DOGE: { icon: 'tabler:currency-dogecoin', color: '#b59b40' }
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 8 }).format(value)
}

function formatRial(value: number) {
  return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(value)} ریال`
}

async function handleCreated() {
  showTradeModal.value = false
  await refresh()
  toast.success('معامله در دفتر رمزارز ثبت شد')
}

async function deleteTrade(id: number) {
  if (!confirm('این معامله حذف شود؟')) return
  try {
    await $fetch(`/api/crypto/${id}`, { method: 'DELETE' })
    await refresh()
    toast.success('معامله حذف شد')
  } catch (error: any) {
    toast.error(error.data?.statusMessage || 'خطا در حذف معامله')
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">دارایی‌های دیجیتال</p>
        <h1 class="page-heading">سبد رمزارز</h1>
        <p class="page-kicker">قیمت لحظه‌ای و ارزش دارایی‌ها بر اساس بازار ریالی ایران محاسبه می‌شود.</p>
      </div>
      <button class="primary-button w-full sm:w-auto" @click="showTradeModal = true">
        <Icon name="lucide:plus" class="h-5 w-5" />
        معامله جدید
      </button>
    </header>

    <!-- Top Summary Metrics -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="surface relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-950 via-[#07241c] to-slate-950 p-6 text-white shadow-xl shadow-emerald-950/20 sm:col-span-2 xl:col-span-1 ring-1 ring-white/10">
        <div class="mb-7 flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-300">ارزش لحظه‌ای سبد</span>
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
            <Icon name="lucide:gem" class="h-5 w-5" />
          </div>
        </div>
        <p class="money max-w-full break-words text-2xl font-black text-white">{{ formatRial(totalMarketValue) }}</p>
        <p class="mt-2 text-xs text-slate-400 font-medium">بر اساس آخرین نرخ بازار ایران</p>
      </div>

      <div class="surface p-6 hover:-translate-y-0.5 hover:shadow-card-hover">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-medium text-slate-500">بهای تمام‌شده</p>
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon name="lucide:layers-3" class="h-4 w-4" />
          </div>
        </div>
        <p class="money mt-1 max-w-full break-words text-xl font-extrabold text-slate-900">{{ formatRial(totalInvested) }}</p>
      </div>

      <div class="surface p-6 hover:-translate-y-0.5 hover:shadow-card-hover">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-medium text-slate-500">سود محقق‌نشده</p>
          <div class="flex h-9 w-9 items-center justify-center rounded-xl" :class="totalUnrealized >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'">
            <Icon name="lucide:chart-no-axes-combined" class="h-4 w-4" />
          </div>
        </div>
        <p class="money mt-1 max-w-full break-words text-xl font-extrabold" :class="totalUnrealized >= 0 ? 'text-emerald-700' : 'text-rose-600'">{{ formatRial(totalUnrealized) }}</p>
      </div>

      <div class="surface p-6 hover:-translate-y-0.5 hover:shadow-card-hover">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs font-medium text-slate-500">سود تحقق‌یافته</p>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{{ data?.summary.tradeCount || 0 }} معامله</span>
        </div>
        <p class="money mt-1 max-w-full break-words text-xl font-extrabold" :class="(data?.summary.realizedProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'">{{ formatRial(data?.summary.realizedProfit || 0) }}</p>
      </div>
    </section>

    <!-- Market Live Bar -->
    <div class="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <span class="relative flex h-3 w-3">
          <span v-if="marketStatus === 'pending'" class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span class="relative inline-flex h-3 w-3 rounded-full" :class="market?.stale ? 'bg-amber-500' : market ? 'bg-emerald-500' : 'bg-rose-500'" />
        </span>
        <div>
          <p class="text-sm font-bold text-slate-900">قیمت زنده بازار ایران</p>
          <p class="mt-0.5 text-xs text-slate-400 font-medium">
            منبع: {{ market?.source || 'در حال دریافت' }}
            <span v-if="marketUpdatedAt"> · به‌روزرسانی {{ marketUpdatedAt }}</span>
            <span v-if="market?.stale"> · اطلاعات ذخیره‌شده</span>
          </p>
        </div>
      </div>
      <button 
        class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-xs font-bold text-slate-700 hover:bg-slate-200 transition" 
        :disabled="marketStatus === 'pending'" 
        @click="refreshMarket()"
      >
        <Icon name="lucide:refresh-cw" class="h-4 w-4" :class="marketStatus === 'pending' ? 'animate-spin' : ''" />
        به‌روزرسانی قیمت‌ها
      </button>
    </div>

    <!-- Holdings Grid -->
    <section>
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="font-extrabold text-slate-900">دارایی‌های من</h2>
          <p class="mt-0.5 text-xs text-slate-400 font-medium">موجودی و میانگین خرید رمزارزها</p>
        </div>
      </div>
      <div v-if="status === 'pending'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="item in 3" :key="item" class="h-44 animate-pulse rounded-2xl bg-slate-200" />
      </div>
      <div v-else-if="holdingsWithMarket.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article v-for="holding in holdingsWithMarket" :key="holding.symbol" class="surface p-6 hover:-translate-y-1 hover:shadow-card-hover transition-all">
          <div class="flex items-start justify-between gap-4">
            <div class="flex min-w-0 items-center gap-3.5">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100/90 shadow-xs">
                <Icon :name="holding.icon" class="h-6 w-6" :style="{ color: holding.color }" />
              </div>
              <div class="min-w-0">
                <h3 class="font-extrabold text-slate-900">{{ holding.asset }}</h3>
                <p class="text-xs font-bold text-slate-400">{{ holding.symbol }}</p>
              </div>
            </div>
            <span class="rounded-lg px-2.5 py-1 text-xs font-bold" :class="holding.change24h >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'">
              {{ holding.change24h >= 0 ? '+' : '' }}{{ holding.change24h }}٪
            </span>
          </div>
          <p class="money mt-6 max-w-full break-words text-xl font-extrabold text-slate-900">{{ formatQuantity(holding.quantity) }} {{ holding.symbol }}</p>
          <div class="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs font-medium">
            <div>
              <p class="text-slate-400">قیمت لحظه‌ای</p>
              <p class="money mt-1 font-bold text-slate-800">{{ holding.marketPrice ? formatRial(holding.marketPrice) : 'ناموجود' }}</p>
            </div>
            <div>
              <p class="text-slate-400">ارزش کل دارایی</p>
              <p class="money mt-1 font-bold text-slate-800">{{ formatRial(holding.marketValue) }}</p>
            </div>
            <div>
              <p class="text-slate-400">میانگین خرید</p>
              <p class="money mt-1 font-bold text-slate-800">{{ formatRial(holding.averagePrice) }}</p>
            </div>
            <div>
              <p class="text-slate-400">سود / زیان</p>
              <p class="money mt-1 font-bold" :class="holding.unrealizedProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'">{{ formatRial(holding.unrealizedProfit) }}</p>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="empty-state min-h-48">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-3">
          <Icon name="tabler:currency-bitcoin" class="h-8 w-8" />
        </div>
        <h3 class="font-bold text-slate-800">هنوز رمزارزی در سبد نیست</h3>
        <p class="mt-1 text-xs text-slate-400">با ثبت اولین خرید، سبد دارایی دیجیتال شما ساخته می‌شود.</p>
      </div>
    </section>

    <!-- Trade History Section -->
    <section>
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="font-extrabold text-slate-900">تاریخچه معاملات</h2>
          <p class="mt-0.5 text-xs text-slate-400 font-medium">همه خریدها و فروش‌های ثبت‌شده</p>
        </div>
        <div class="segmented">
          <button :class="filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'" @click="filter = 'ALL'">همه</button>
          <button :class="filter === 'BUY' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'" @click="filter = 'BUY'">خرید</button>
          <button :class="filter === 'SELL' ? 'bg-rose-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'" @click="filter = 'SELL'">فروش</button>
        </div>
      </div>

      <div v-if="filteredTrades?.length" class="surface divide-y divide-slate-100 overflow-hidden">
        <article v-for="trade in filteredTrades" :key="trade.id" class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:p-5 transition hover:bg-slate-50/70">
          <div class="flex min-w-0 items-center gap-3.5">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Icon :name="assetMeta[trade.symbol]?.icon || 'tabler:coin'" class="h-6 w-6" :style="{ color: assetMeta[trade.symbol]?.color || '#059669' }" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-bold text-slate-900">{{ trade.asset }}</h3>
                <span class="rounded-md px-2 py-0.5 text-[11px] font-bold" :class="trade.type === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                  {{ trade.type === 'BUY' ? 'خرید' : 'فروش' }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-slate-400 font-medium">{{ toJalali(trade.date) }}<span v-if="trade.note"> · {{ trade.note }}</span></p>
            </div>
          </div>
          <div class="text-left">
            <p class="money whitespace-nowrap text-sm font-extrabold text-slate-900">{{ formatQuantity(trade.quantity) }} {{ trade.symbol }}</p>
            <p class="money mt-0.5 whitespace-nowrap text-xs text-slate-400 font-medium">{{ formatRial(trade.totalValue) }}</p>
            <p v-if="trade.type === 'SELL'" class="money mt-0.5 whitespace-nowrap text-xs font-bold" :class="(trade.realizedProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'">
              سود: {{ formatRial(trade.realizedProfit || 0) }}
            </p>
          </div>
          <button class="icon-button col-span-2 h-9 w-9 justify-self-end text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:col-span-1" title="حذف معامله" @click="deleteTrade(trade.id)">
            <Icon name="lucide:trash-2" class="h-4 w-4" />
          </button>
        </article>
      </div>
      <div v-else class="surface py-12 text-center text-xs font-medium text-slate-400">معامله‌ای در این فیلتر وجود ندارد.</div>
    </section>

    <CryptoTradeModal v-if="showTradeModal" :holdings="data?.holdings || []" :prices="market?.prices || {}" @close="showTradeModal = false" @created="handleCreated" />
  </div>
</template>
