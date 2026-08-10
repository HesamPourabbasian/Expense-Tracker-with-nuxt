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
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="page-heading">کیف پول نقدی</h1>
        <p class="text-sm text-gray-500 mt-1" :class="balance >= 0 ? '' : 'text-red-500'">
          موجودی: {{ formatCurrency(balance) }}
        </p>
      </div>
      <button
        @click="showTransactionModal = true"
        class="primary-button"
      >
        <Icon name="bx:bx-plus" class="w-4 h-4" />
        تراکنش جدید
      </button>
    </div>

    <!-- Filter -->
    <div class="segmented">
      <button
        @click="filterType = ''"
        class="px-3 py-2 text-sm transition-colors"
        :class="!filterType ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'"
      >همه</button>
      <button
        @click="filterType = 'income'"
        class="px-3 py-2 text-sm border-r border-gray-200 transition-colors"
        :class="filterType === 'income' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'"
      >درآمد</button>
      <button
        @click="filterType = 'expense'"
        class="px-3 py-2 text-sm border-r border-gray-200 transition-colors"
        :class="filterType === 'expense' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'"
      >هزینه</button>
    </div>

    <!-- Transactions -->
    <div v-if="transactions?.length" class="surface divide-y divide-gray-100 overflow-hidden">
      <div
        v-for="t in transactions"
        :key="t.id"
        class="transaction-row flex items-center justify-between gap-3 p-4 transition hover:bg-gray-50"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :class="t.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'"
          >
            <Icon
              :name="t.type === 'income' ? 'bx:bx-plus' : 'bx:bx-minus'"
              class="w-5 h-5"
              :class="t.type === 'income' ? 'text-emerald-600' : 'text-red-600'"
            />
          </div>
          <div>
            <p class="font-medium text-gray-900 text-sm">{{ t.description || (t.type === 'income' ? 'درآمد نقدی' : 'هزینه نقدی') }}</p>
            <p class="text-xs text-gray-400">{{ toJalali(t.date) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <p class="font-bold text-sm" :class="t.type === 'income' ? 'text-emerald-600' : 'text-red-600'">
            {{ t.type === 'income' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
          </p>
          <div class="flex items-center gap-1">
            <button @click="editTransaction = t" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <Icon name="bx:bx-edit" class="w-4 h-4" />
            </button>
            <button @click="deleteTransaction(t.id)" class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
              <Icon name="bx:bx-trash" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <Icon name="bx:bx-wallet" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">تراکنش نقدی ثبت نشده</p>
    </div>

    <CashTransactionModal v-if="showTransactionModal" @close="showTransactionModal = false" @created="handleCreated" />
    <CashTransactionEditModal v-if="editTransaction" :transaction="editTransaction" @close="editTransaction = null" @updated="handleUpdated" />
  </div>
</template>
