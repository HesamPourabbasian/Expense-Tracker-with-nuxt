<script setup lang="ts">
import type { BankAccountWithBalance } from '~/types'
import moment from 'jalali-moment'

const props = defineProps<{
  initialSourceId?: number | string
  initialDestinationId?: number | string
}>()

const emit = defineEmits(['close', 'created'])
const { formatCurrency, formatNumber } = useFormat()

onKeyStroke('Escape', () => emit('close'))

const { data: accounts, status: accountsStatus } = await useFetch<BankAccountWithBalance[]>('/api/accounts')

const form = reactive({
  sourceAccountId: props.initialSourceId ? Number(props.initialSourceId) : null as number | null,
  destinationAccountId: props.initialDestinationId ? Number(props.initialDestinationId) : null as number | null,
  amount: 0,
  description: '',
  date: moment().format('jYYYY/jMM/jDD')
})

// Auto-select defaults if not set and accounts are available
watchEffect(() => {
  if (accounts.value && accounts.value.length > 0) {
    if (!form.sourceAccountId && accounts.value[0]) {
      form.sourceAccountId = accounts.value[0].id
    }
    if (!form.destinationAccountId && accounts.value.length > 1) {
      const otherAccount = accounts.value.find(a => a.id !== form.sourceAccountId)
      if (otherAccount) form.destinationAccountId = otherAccount.id
    }
  }
})

const error = ref('')
const loading = ref(false)

const selectedSourceAccount = computed(() =>
  accounts.value?.find(a => a.id === form.sourceAccountId) || null
)

const selectedDestinationAccount = computed(() =>
  accounts.value?.find(a => a.id === form.destinationAccountId) || null
)

function swapAccounts() {
  const temp = form.sourceAccountId
  form.sourceAccountId = form.destinationAccountId
  form.destinationAccountId = temp
}

async function handleSubmit() {
  error.value = ''

  if (!form.sourceAccountId) {
    error.value = 'حساب مبدأ را انتخاب کنید'
    return
  }

  if (!form.destinationAccountId) {
    error.value = 'حساب مقصد را انتخاب کنید'
    return
  }

  if (form.sourceAccountId === form.destinationAccountId) {
    error.value = 'حساب مبدأ و مقصد نمی‌توانند یکسان باشند'
    return
  }

  if (!form.amount || form.amount <= 0) {
    error.value = 'مبلغ انتقال را وارد کنید'
    return
  }

  if (selectedSourceAccount.value && form.amount > (selectedSourceAccount.value.balance || 0)) {
    error.value = 'موجودی حساب مبدأ برای این انتقال کافی نیست'
    return
  }

  if (!form.date) {
    error.value = 'تاریخ انتقال را وارد کنید'
    return
  }

  const gregorianDate = moment(form.date, 'jYYYY/jMM/jDD').toDate()
  if (isNaN(gregorianDate.getTime())) {
    error.value = 'تاریخ وارد شده معتبر نیست'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/accounts/transfer', {
      method: 'POST',
      body: {
        sourceAccountId: form.sourceAccountId,
        destinationAccountId: form.destinationAccountId,
        amount: form.amount,
        description: form.description || null,
        date: gregorianDate.toISOString()
      }
    })
    emit('created')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در انجام انتقال وجه'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal-panel max-w-lg">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500/20">
            <Icon name="lucide:arrow-left-right" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white">مدیریت نقدینگی</h2>
            <p class="text-xs text-slate-400 font-medium">انتقال پول بین حساب‌های بانکی خود</p>
          </div>
        </div>
        <button @click="emit('close')" class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="بستن پنجره">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <div v-if="!accounts || accounts.length < 2" class="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl p-3.5">
          برای انتقال وجه بین حساب‌ها، حداقل به ۲ حساب بانکی نیاز دارید.
        </div>

        <template v-else>
          <!-- Transfer Source & Destination Selector Grid -->
          <div class="relative space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <!-- Source Account -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-bold text-slate-700 dark:text-slate-300">حساب مبدأ (کسر از حساب)</label>
                <span v-if="selectedSourceAccount" class="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  موجودی: <bdi class="money font-bold text-slate-800 dark:text-slate-200">{{ formatCurrency(selectedSourceAccount.balance || 0) }}</bdi>
                </span>
              </div>
              <div class="relative">
                <select
                  v-model="form.sourceAccountId"
                  class="form-control font-bold pr-3 pl-10"
                >
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id" class="dark:bg-slate-900">
                    {{ acc.name }} (موجودی: {{ formatCurrency(acc.balance || 0) }})
                  </option>
                </select>
              </div>
            </div>

            <!-- Swap Button -->
            <div class="flex justify-center -my-2 relative z-10">
              <button
                type="button"
                @click="swapAccounts"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-300 transition-transform active:scale-95"
                title="جابجایی مبدأ و مقصد"
              >
                <Icon name="lucide:arrow-down-up" class="w-4 h-4" />
              </button>
            </div>

            <!-- Destination Account -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-bold text-slate-700 dark:text-slate-300">حساب مقصد (افزایش به حساب)</label>
                <span v-if="selectedDestinationAccount" class="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  موجودی: <bdi class="money font-bold text-slate-800 dark:text-slate-200">{{ formatCurrency(selectedDestinationAccount.balance || 0) }}</bdi>
                </span>
              </div>
              <div class="relative">
                <select
                  v-model="form.destinationAccountId"
                  class="form-control font-bold pr-3 pl-10"
                >
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id" class="dark:bg-slate-900">
                    {{ acc.name }} (موجودی: {{ formatCurrency(acc.balance || 0) }})
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Transfer Amount -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">مبلغ انتقال (تومان)</label>
              <span v-if="form.amount > 0" class="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {{ formatCurrency(form.amount) }}
              </span>
            </div>
            <input
              v-model.number="form.amount"
              type="number"
              min="1"
              class="form-control font-bold text-base"
              placeholder="مثلاً: ۵۰۰۰۰۰۰"
            />
          </div>

          <!-- Date -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">تاریخ انتقال (شمسی)</label>
            <input
              v-model="form.date"
              type="text"
              class="form-control text-left font-mono"
              dir="ltr"
              placeholder="1405/06/07"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">توضیحات (اختیاری)</label>
            <input
              v-model="form.description"
              type="text"
              class="form-control"
              placeholder="مثال: انتقال پول برای مدیریت موجودی..."
              spellcheck="false"
              autocomplete="off"
            />
          </div>

          <!-- Summary info note -->
          <div class="rounded-xl bg-slate-100/70 dark:bg-slate-800/60 p-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <p class="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold mb-1">
              <Icon name="lucide:info" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              قاعده انتقال نقدینگی:
            </p>
            این انتقال صرفاً موجودی بین حساب‌های شما را جابجا می‌کند و در آمار درآمد یا هزینه شما محاسبه نمی‌شود.
          </div>

          <button
            type="submit"
            :disabled="loading || accounts.length < 2"
            class="primary-button w-full mt-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 text-white"
          >
            <Icon v-if="!loading" name="lucide:arrow-left-right" class="w-4 h-4" />
            <span v-if="loading">در حال انجام انتقال...</span>
            <span v-else>انتقال وجه</span>
          </button>
        </template>
      </form>
    </div>
  </div>
</template>
