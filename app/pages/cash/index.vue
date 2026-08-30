<script setup lang="ts">
import type { CashTransaction } from '~/types'

const { toJalali, formatCurrency } = useFormat()
const toast = useToast()

const showTransactionModal = ref(false)
const editTransaction = ref<CashTransaction | null>(null)
const filterType = ref<string>('')

const { data: allTransactions, refresh } = await useFetch<CashTransaction[]>('/api/cash/transactions')

const transactions = computed(() => filterType.value
  ? allTransactions.value?.filter(transaction => transaction.type === filterType.value)
  : allTransactions.value)

const balance = computed(() => {
  if (!allTransactions.value) return 0
  return allTransactions.value.reduce((acc, t) => {
    return acc + (t.type === 'income' ? t.amount : -t.amount)
  }, 0)
})

async function deleteTransaction(id: number) {
  if (!confirm('آیا مطمئن هستید؟')) return
  try {
    await $fetch(`/api/cash/transactions/${id}`, { method: 'DELETE' })
    toast.success('تراکنش حذف شد')
    refresh()
  } catch (e: any) {
    toast.error('خطا در حذف تراکنش')
  }
}

async function handleCreated() {
  showTransactionModal.value = false
  await refresh()
  toast.success('تراکنش جدید اضافه شد')
}

async function handleUpdated() {
  editTransaction.value = null
  await refresh()
  toast.success('تراکنش ویرایش شد')
}
</script>

<template>
  <div class="page-shell">
    <div class="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">پول نقد فیزیکی</p>
        <h1 class="page-heading">کیف پول نقدی</h1>
        <p class="text-xs sm:text-sm font-medium mt-1" :class="balance >= 0 ? 'text-slate-500 dark:text-slate-400' : 'text-rose-600 dark:text-rose-400'">
          موجودی نقد: <bdi class="money font-extrabold text-slate-900 dark:text-white">{{ formatCurrency(balance) }}</bdi>
        </p>
      </div>
      <button
        @click="showTransactionModal = true"
        class="primary-button w-full sm:w-auto"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        تراکنش جدید
      </button>
    </div>

    <!-- Filter -->
    <div class="segmented">
      <button
        @click="filterType = ''"
        :class="!filterType ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >همه</button>
      <button
        @click="filterType = 'income'"
        :class="filterType === 'income' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >درآمد</button>
      <button
        @click="filterType = 'expense'"
        :class="filterType === 'expense' ? 'bg-rose-600 text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >هزینه</button>
    </div>

    <!-- Transactions -->
    <div v-if="transactions?.length" class="surface divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
      <div
        v-for="t in transactions"
        :key="t.id"
        class="transaction-row flex items-center justify-between gap-3 p-4 sm:p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
      >
        <div class="transaction-details flex min-w-0 items-center gap-3.5">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition"
            :class="t.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20'"
          >
            <Icon
              :name="t.type === 'income' ? 'lucide:arrow-down-left' : 'lucide:arrow-up-right'"
              class="h-5 w-5"
            />
          </div>
          <div class="min-w-0">
            <p class="break-words text-sm font-bold text-slate-900 dark:text-white">{{ t.description || (t.type === 'income' ? 'درآمد نقدی' : 'هزینه نقدی') }}</p>
            <p class="text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">{{ toJalali(t.date) }}</p>
          </div>
        </div>
        <div class="transaction-actions flex items-center gap-3">
          <p class="money whitespace-nowrap text-sm sm:text-base font-extrabold" :class="t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
            {{ t.type === 'income' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
          </p>
          <div class="flex items-center gap-1">
            <button @click="editTransaction = t" class="icon-button h-9 w-9 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title="ویرایش">
              <Icon name="lucide:pencil" class="w-4 h-4" />
            </button>
            <button @click="deleteTransaction(t.id)" class="icon-button h-9 w-9 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400" title="حذف">
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
        <Icon name="lucide:wallet" class="w-7 h-7" />
      </div>
      <h3 class="font-bold text-slate-800 dark:text-slate-200">تراکنش نقدی ثبت نشده</h3>
      <p class="mt-1 text-xs text-slate-400">گردش پول نقد و اسکناس‌های خود را اینجا ثبت کن.</p>
    </div>

    <CashTransactionModal v-if="showTransactionModal" @close="showTransactionModal = false" @created="handleCreated" />
    <CashTransactionEditModal v-if="editTransaction" :transaction="editTransaction" @close="editTransaction = null" @updated="handleUpdated" />
  </div>
</template>
