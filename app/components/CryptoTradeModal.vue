<script setup lang="ts">
import type { CryptoHolding } from '~/types'

const props = defineProps<{ holdings: CryptoHolding[] }>()
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
const total = computed(() => form.quantity > 0 && form.price > 0 ? form.quantity * form.price : 0)

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
        <div><p class="text-sm font-semibold text-primary-700">ثبت در دفتر دارایی</p><h2 class="mt-1 text-xl font-bold text-gray-950">معامله رمزارز</h2></div>
        <button class="icon-button" aria-label="بستن پنجره" @click="emit('close')"><Icon name="lucide:x" class="h-5 w-5" /></button>
      </div>

      <form class="space-y-5" @submit.prevent="submit">
        <div v-if="error" role="alert" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</div>

        <div class="segmented flex w-full">
          <button type="button" class="flex-1" :class="form.type === 'BUY' ? 'bg-primary-700 text-white' : 'text-gray-500'" @click="form.type = 'BUY'">خرید</button>
          <button type="button" class="flex-1" :class="form.type === 'SELL' ? 'bg-rose-600 text-white' : 'text-gray-500'" @click="form.type = 'SELL'">فروش</button>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">انتخاب رمزارز</label>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <button v-for="asset in assets" :key="asset.symbol" type="button" class="flex min-h-20 flex-col items-center justify-center gap-1.5 border bg-white p-2 transition" :class="form.symbol === asset.symbol ? 'border-primary-600 ring-2 ring-primary-500/10' : 'border-gray-200 hover:border-gray-300'" style="border-radius: 8px" @click="form.symbol = asset.symbol">
              <Icon :name="asset.icon" class="h-6 w-6" :style="{ color: asset.color }" />
              <span class="text-xs font-bold text-gray-700">{{ asset.symbol }}</span>
            </button>
          </div>
          <p v-if="form.type === 'SELL'" class="mt-2 text-xs text-gray-500">موجودی قابل فروش: <bdi class="money font-semibold">{{ holding?.quantity || 0 }} {{ form.symbol }}</bdi></p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">مقدار {{ selectedAsset.name }}</label>
            <input v-model.number="form.quantity" class="form-control text-left" dir="ltr" type="number" inputmode="decimal" min="0" step="any" placeholder="0.00">
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">قیمت هر واحد (تومان)</label>
            <input v-model.number="form.price" class="form-control text-left" dir="ltr" type="number" inputmode="decimal" min="0" step="any" placeholder="0">
          </div>
        </div>

        <div class="rounded-lg border border-[#d7b66b]/35 bg-[#f8f4e9] p-4">
          <div class="flex flex-wrap items-center justify-between gap-2"><span class="text-sm text-gray-500">ارزش کل معامله</span><strong class="money text-lg text-gray-950">{{ new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(total) }} تومان</strong></div>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">یادداشت</label>
          <input v-model="form.note" class="form-control" maxlength="300" placeholder="نام صرافی یا توضیح اختیاری">
        </div>

        <button class="primary-button w-full" :class="form.type === 'SELL' ? 'bg-rose-600 hover:bg-rose-700' : ''" type="submit" :disabled="saving">
          <Icon :name="form.type === 'BUY' ? 'lucide:arrow-down-right' : 'lucide:arrow-up-left'" class="h-5 w-5" />
          {{ saving ? 'در حال ثبت...' : form.type === 'BUY' ? 'ثبت خرید' : 'ثبت فروش' }}
        </button>
      </form>
    </div>
  </div>
</template>
