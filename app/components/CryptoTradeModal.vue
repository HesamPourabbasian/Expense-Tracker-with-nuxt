<script setup lang="ts">
import type { CryptoHolding, CryptoMarketPrice } from '~/types'

const props = defineProps<{ holdings: CryptoHolding[]; prices: Record<string, CryptoMarketPrice> }>()
const emit = defineEmits(['close', 'created'])

const assets = [
  { symbol: 'BTC', name: 'بیت‌کوین', icon: 'tabler:currency-bitcoin', color: '#d99a35' },
  { symbol: 'USDT', name: 'تتر', icon: 'mdi:currency-usd', color: '#26a17b' },
  { symbol: 'ETH', name: 'اتریوم', icon: 'tabler:currency-ethereum', color: '#6877d8' },
  { symbol: 'SOL', name: 'سولانا', icon: 'tabler:currency-solana', color: '#8d6ce6' },
  { symbol: 'LTC', name: 'لایت‌کوین', icon: 'mdi:litecoin', color: '#55708a' },
  { symbol: 'DOGE', name: 'دوج‌کوین', icon: 'tabler:currency-dogecoin', color: '#b59b40' }
]

const form = reactive({ symbol: 'BTC', type: 'BUY' as 'BUY' | 'SELL', quantity: 0, price: 0, note: '' })
const saving = ref(false)
const error = ref('')
const selectedAsset = computed(() => assets.find(asset => asset.symbol === form.symbol)!)
const holding = computed(() => props.holdings.find(item => item.symbol === form.symbol))
const marketPrice = computed(() => props.prices[form.symbol]?.price || 0)
const total = computed(() => form.quantity > 0 && form.price > 0 ? form.quantity * form.price : 0)

watch(marketPrice, (price) => {
  if (price) form.price = price
}, { immediate: true })

async function submit() {
  error.value = ''
  if (!form.quantity || form.quantity <= 0 || !form.price || form.price <= 0) {
    error.value = 'مقدار و قیمت واحد را وارد کنید'
    return
  }

  saving.value = true
  try {
    await $fetch('/api/crypto', {
      method: 'POST',
      body: { ...form, date: new Date().toISOString(), note: form.note.trim() || null }
    })
    emit('created')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در ثبت معامله'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal-panel max-w-lg">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">ثبت در دفتر دارایی</p>
          <h2 class="mt-1 text-base font-extrabold text-slate-900 dark:text-white">معامله رمزارز</h2>
        </div>
        <button class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="بستن پنجره" @click="emit('close')">
          <Icon name="lucide:x" class="h-4 w-4" />
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div v-if="error" role="alert" class="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-300">{{ error }}</div>

        <div class="grid grid-cols-2 p-1 gap-1 rounded-xl bg-slate-100/90 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800">
          <button type="button" class="py-2 text-xs font-bold rounded-lg transition-all" :class="form.type === 'BUY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" @click="form.type = 'BUY'">خرید</button>
          <button type="button" class="py-2 text-xs font-bold rounded-lg transition-all" :class="form.type === 'SELL' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'" @click="form.type = 'SELL'">فروش</button>
        </div>

        <div>
          <label class="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">انتخاب رمزارز</label>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <button 
              v-for="asset in assets" 
              :key="asset.symbol" 
              type="button" 
              class="flex min-h-18 flex-col items-center justify-center gap-1.5 rounded-xl border p-2 transition" 
              :class="form.symbol === asset.symbol ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'" 
              @click="form.symbol = asset.symbol"
            >
              <Icon :name="asset.icon" class="h-6 w-6" :style="{ color: asset.color }" />
              <span class="text-[11px] font-bold">{{ asset.symbol }}</span>
            </button>
          </div>
          <p v-if="form.type === 'SELL'" class="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">موجودی قابل فروش: <bdi class="money font-bold text-slate-800 dark:text-slate-200">{{ holding?.quantity || 0 }} {{ form.symbol }}</bdi></p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">مقدار {{ selectedAsset.name }}</label>
            <input v-model.number="form.quantity" class="form-control text-left font-mono font-bold" dir="ltr" type="number" inputmode="decimal" min="0" step="any" placeholder="0.00">
          </div>
          <div>
            <div class="mb-1.5 flex items-center justify-between gap-2">
              <label class="text-xs font-bold text-slate-700 dark:text-slate-300">قیمت واحد (ریال)</label>
              <button v-if="marketPrice" type="button" class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline" @click="form.price = marketPrice">نرخ لحظه‌ای</button>
            </div>
            <input v-model.number="form.price" class="form-control text-left font-mono font-bold" dir="ltr" type="number" inputmode="decimal" min="0" step="any" placeholder="0">
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">ارزش کل معامله:</span>
            <strong class="money text-base font-black text-slate-900 dark:text-white">{{ new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(total) }} ریال</strong>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">یادداشت</label>
          <input v-model="form.note" class="form-control" maxlength="300" placeholder="نام صرافی، شماره پیگیری یا یادداشت اختیاری">
        </div>

        <button 
          class="primary-button w-full mt-2" 
          :class="form.type === 'SELL' ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/20' : ''" 
          type="submit" 
          :disabled="saving"
        >
          <span v-if="saving">در حال ثبت...</span>
          <span v-else class="flex items-center gap-1.5">
            <Icon :name="form.type === 'BUY' ? 'lucide:arrow-down-left' : 'lucide:arrow-up-right'" class="h-4 w-4" />
            {{ form.type === 'BUY' ? 'ثبت خرید رمزارز' : 'ثبت فروش رمزارز' }}
          </span>
        </button>
      </form>
    </div>
  </div>
</template>
