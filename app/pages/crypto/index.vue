<script setup lang="ts">
import type { CryptoHolding, CryptoTrade } from '~/types'

interface CryptoResponse {
  trades: CryptoTrade[]
  holdings: CryptoHolding[]
  summary: { buyVolume: number; sellVolume: number; realizedProfit: number; tradeCount: number }
}

const toast = useToast()
const { formatCurrency, toJalali } = useFormat()
const showTradeModal = ref(false)
const filter = ref<'ALL' | 'BUY' | 'SELL'>('ALL')
const { data, refresh, status } = await useFetch<CryptoResponse>('/api/crypto')

const filteredTrades = computed(() => filter.value === 'ALL' ? data.value?.trades : data.value?.trades.filter(trade => trade.type === filter.value))
const totalInvested = computed(() => data.value?.holdings.reduce((sum, holding) => sum + holding.invested, 0) || 0)

const assetMeta: Record<string, { icon: string; color: string }> = {
  BTC: { icon: 'tabler:currency-bitcoin', color: '#d99a35' }, ETH: { icon: 'tabler:currency-ethereum', color: '#6877d8' },
  USDT: { icon: 'mdi:currency-usd', color: '#26a17b' }, LTC: { icon: 'mdi:litecoin', color: '#55708a' },
  SOL: { icon: 'tabler:currency-solana', color: '#8d6ce6' }, DOGE: { icon: 'tabler:currency-dogecoin', color: '#b59b40' }
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 8 }).format(value)
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
      <div><p class="mb-1 text-sm font-semibold text-primary-700">دارایی دیجیتال</p><h1 class="page-heading">سبد رمزارز</h1><p class="page-kicker">خرید و فروش‌های خود را ثبت کن و موجودی و سود تحقق‌یافته را ببین.</p></div>
      <button class="primary-button w-full sm:w-auto" @click="showTradeModal = true"><Icon name="lucide:plus" class="h-5 w-5" />معامله جدید</button>
    </header>

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="surface border-[#315b4c] bg-[#173f35] p-5 text-white sm:col-span-2 xl:col-span-1">
        <div class="mb-7 flex items-center justify-between"><span class="text-sm text-white/60">سرمایه باقی‌مانده</span><Icon name="lucide:gem" class="h-5 w-5 text-[#d7b66b]" /></div>
        <p class="money max-w-full break-words text-2xl font-bold">{{ formatCurrency(totalInvested) }}</p>
        <p class="mt-2 text-xs text-white/45">بر اساس میانگین قیمت خرید</p>
      </div>
      <div class="surface p-5"><p class="text-sm text-gray-500">حجم خرید</p><p class="money mt-5 max-w-full break-words text-xl font-bold text-gray-950">{{ formatCurrency(data?.summary.buyVolume || 0) }}</p><Icon name="lucide:arrow-down-right" class="mt-4 h-5 w-5 text-primary-700" /></div>
      <div class="surface p-5"><p class="text-sm text-gray-500">حجم فروش</p><p class="money mt-5 max-w-full break-words text-xl font-bold text-gray-950">{{ formatCurrency(data?.summary.sellVolume || 0) }}</p><Icon name="lucide:arrow-up-left" class="mt-4 h-5 w-5 text-rose-600" /></div>
      <div class="surface p-5"><p class="text-sm text-gray-500">سود تحقق‌یافته</p><p class="money mt-5 max-w-full break-words text-xl font-bold" :class="(data?.summary.realizedProfit || 0) >= 0 ? 'text-primary-700' : 'text-rose-600'">{{ formatCurrency(data?.summary.realizedProfit || 0) }}</p><p class="mt-4 text-xs text-gray-400">از {{ data?.summary.tradeCount || 0 }} معامله</p></div>
    </section>

    <section>
      <div class="mb-3 flex items-center justify-between"><div><h2 class="font-bold text-gray-950">دارایی‌های من</h2><p class="mt-1 text-sm text-gray-400">موجودی و میانگین خرید</p></div></div>
      <div v-if="status === 'pending'" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"><div v-for="item in 3" :key="item" class="h-36 animate-pulse rounded-lg bg-gray-200" /></div>
      <div v-else-if="data?.holdings.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article v-for="holding in data.holdings" :key="holding.symbol" class="surface p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex min-w-0 items-center gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50"><Icon :name="holding.icon" class="h-6 w-6" :style="{ color: holding.color }" /></div><div class="min-w-0"><h3 class="font-bold text-gray-900">{{ holding.asset }}</h3><p class="text-xs font-semibold text-gray-400">{{ holding.symbol }}</p></div></div>
            <span class="rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700">فعال</span>
          </div>
          <p class="money mt-6 max-w-full break-words text-xl font-bold text-gray-950">{{ formatQuantity(holding.quantity) }} {{ holding.symbol }}</p>
          <div class="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm"><div><p class="text-xs text-gray-400">میانگین خرید</p><p class="money mt-1 font-semibold text-gray-700">{{ formatCurrency(holding.averagePrice) }}</p></div><div><p class="text-xs text-gray-400">بهای باقی‌مانده</p><p class="money mt-1 font-semibold text-gray-700">{{ formatCurrency(holding.invested) }}</p></div></div>
        </article>
      </div>
      <div v-else class="empty-state min-h-48"><Icon name="tabler:currency-bitcoin" class="mb-3 h-10 w-10 text-[#d99a35]" /><p class="font-semibold text-gray-800">هنوز رمزارزی در سبد نیست</p><p class="mt-2 text-sm text-gray-500">با ثبت اولین خرید، سبد شما ساخته می‌شود.</p></div>
    </section>

    <section>
      <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 class="font-bold text-gray-950">تاریخچه معاملات</h2><p class="mt-1 text-sm text-gray-400">همه خریدها و فروش‌های ثبت‌شده</p></div><div class="segmented"><button :class="filter === 'ALL' ? 'bg-primary-50 text-primary-700' : 'text-gray-500'" @click="filter = 'ALL'">همه</button><button :class="filter === 'BUY' ? 'bg-primary-50 text-primary-700' : 'text-gray-500'" @click="filter = 'BUY'">خرید</button><button :class="filter === 'SELL' ? 'bg-rose-50 text-rose-600' : 'text-gray-500'" @click="filter = 'SELL'">فروش</button></div></div>

      <div v-if="filteredTrades?.length" class="surface divide-y divide-gray-100 overflow-hidden">
        <article v-for="trade in filteredTrades" :key="trade.id" class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:p-5">
          <div class="flex min-w-0 items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50"><Icon :name="assetMeta[trade.symbol]?.icon || 'tabler:coin'" class="h-5 w-5" :style="{ color: assetMeta[trade.symbol]?.color || '#176f55' }" /></div><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold text-gray-900">{{ trade.asset }}</h3><span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="trade.type === 'BUY' ? 'bg-primary-50 text-primary-700' : 'bg-rose-50 text-rose-600'">{{ trade.type === 'BUY' ? 'خرید' : 'فروش' }}</span></div><p class="mt-1 text-sm text-gray-400">{{ toJalali(trade.date) }}<span v-if="trade.note"> · {{ trade.note }}</span></p></div></div>
          <div class="text-left"><p class="money whitespace-nowrap text-sm font-bold text-gray-950">{{ formatQuantity(trade.quantity) }} {{ trade.symbol }}</p><p class="money mt-1 whitespace-nowrap text-xs text-gray-400">{{ formatCurrency(trade.totalValue) }}</p><p v-if="trade.type === 'SELL'" class="money mt-1 whitespace-nowrap text-xs font-semibold" :class="(trade.realizedProfit || 0) >= 0 ? 'text-primary-700' : 'text-rose-600'">سود: {{ formatCurrency(trade.realizedProfit || 0) }}</p></div>
          <button class="icon-button col-span-2 h-10 w-10 justify-self-end hover:bg-red-50 hover:text-red-600 sm:col-span-1" title="حذف معامله" @click="deleteTrade(trade.id)"><Icon name="lucide:trash-2" class="h-4 w-4" /></button>
        </article>
      </div>
      <div v-else class="surface py-10 text-center text-sm text-gray-400">معامله‌ای در این فیلتر وجود ندارد.</div>
    </section>

    <CryptoTradeModal v-if="showTradeModal" :holdings="data?.holdings || []" @close="showTradeModal = false" @created="handleCreated" />
  </div>
</template>
