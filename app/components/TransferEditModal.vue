<script setup lang="ts">
import type { BankAccountWithBalance, Transaction } from '~/types'
import moment from 'jalali-moment'

const props = defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits(['close', 'updated'])
const { formatCurrency } = useFormat()

const { data: accounts } = await useFetch<BankAccountWithBalance[]>('/api/accounts')

const form = reactive({
  sourceAccountId: props.transaction.sourceAccountId ?? props.transaction.bankAccountId,
  destinationAccountId: props.transaction.destinationAccountId ?? props.transaction.bankAccountId,
  amount: props.transaction.amount,
  description: props.transaction.description || '',
  date: moment(props.transaction.date).format('jYYYY/jMM/jDD')
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
    await $fetch(`/api/transactions/${props.transaction.id}`, {
      method: 'PATCH',
      body: {
        sourceAccountId: form.sourceAccountId,
        destinationAccountId: form.destinationAccountId,
        amount: form.amount,
        description: form.description || null,
        date: gregorianDate.toISOString()
      }
    })
    emit('updated')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در ویرایش انتقال وجه'
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
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20">
            <Icon name="lucide:arrow-left-right" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-extrabold text-slate-900">ویرایش انتقال وجه</h2>
            <p class="text-xs text-slate-400 font-medium">اصلاح جزئیات انتقال بین حساب‌ها</p>
          </div>
        </div>
        <button @click="emit('close')" class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700" aria-label="بستن پنجره">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <!-- Transfer Source & Destination Selector Grid -->
        <div class="relative space-y-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <!-- Source Account -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-700">حساب مبدأ (کسر از حساب)</label>
              <span v-if="selectedSourceAccount" class="text-[11px] font-medium text-slate-500">
                موجودی: <bdi class="money font-bold text-slate-800">{{ formatCurrency(selectedSourceAccount.balance || 0) }}</bdi>
              </span>
            </div>
            <select
              v-model="form.sourceAccountId"
              class="form-control font-bold pr-3 pl-10"
            >
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                {{ acc.name }} (موجودی: {{ formatCurrency(acc.balance || 0) }})
              </option>
            </select>
          </div>

          <!-- Swap Button -->
          <div class="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              @click="swapAccounts"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-indigo-600 shadow-xs hover:bg-indigo-50 hover:border-indigo-300 transition-transform active:scale-95"
              title="جابجایی مبدأ و مقصد"
            >
              <Icon name="lucide:arrow-down-up" class="w-4 h-4" />
            </button>
          </div>

          <!-- Destination Account -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-700">حساب مقصد (افزایش به حساب)</label>
              <span v-if="selectedDestinationAccount" class="text-[11px] font-medium text-slate-500">
                موجودی: <bdi class="money font-bold text-slate-800">{{ formatCurrency(selectedDestinationAccount.balance || 0) }}</bdi>
              </span>
            </div>
            <select
              v-model="form.destinationAccountId"
              class="form-control font-bold pr-3 pl-10"
            >
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                {{ acc.name }} (موجودی: {{ formatCurrency(acc.balance || 0) }})
              </option>
            </select>
          </div>
        </div>

        <!-- Transfer Amount -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-bold text-slate-700">مبلغ انتقال (تومان)</label>
            <span v-if="form.amount > 0" class="text-xs font-bold text-indigo-600">
              {{ formatCurrency(form.amount) }}
            </span>
          </div>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            class="form-control font-bold text-base"
            placeholder="مبلغ به تومان"
          />
        </div>

        <!-- Date -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">تاریخ انتقال (شمسی)</label>
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
          <label class="block text-xs font-bold text-slate-700 mb-1.5">توضیحات (اختیاری)</label>
          <input
            v-model="form.description"
            type="text"
            class="form-control"
            placeholder="عنوان یا توضیحات انتقال..."
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="primary-button w-full mt-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
        >
          <span v-if="loading">در حال ذخیره...</span>
          <span v-else>ذخیره تغییرات</span>
        </button>
      </form>
    </div>
  </div>
</template>
