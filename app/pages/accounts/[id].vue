<script setup lang="ts">
import type { BankAccount, Transaction } from '~/types'

const route = useRoute()
const accountId = route.params.id as string

const { toJalali, formatCurrency } = useFormat()
const toast = useToast()

const showTransactionModal = ref(false)
const editTransaction = ref<Transaction | null>(null)
const filterType = ref<string>('')

const { data: account } = await useFetch<BankAccount>(`/api/accounts/${accountId}`)

const { data: allTransactions, refresh } = await useFetch<Transaction[]>('/api/transactions', {
  query: { bankAccountId: accountId }
})

const transactions = computed(() => filterType.value
  ? allTransactions.value?.filter(transaction => transaction.type === filterType.value)
  : allTransactions.value)

function openEdit(t: Transaction) {
  editTransaction.value = t
}

async function deleteTransaction(id: number) {
  if (!confirm('آیا مطمئن هستید؟')) return
  try {
    await $fetch(`/api/transactions/${id}`, { method: 'DELETE' })
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
  <div v-if="account" class="page-shell">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div class="flex items-center gap-3">
        <NuxtLink to="/accounts" class="icon-button">
          <Icon name="lucide:arrow-right" class="h-5 w-5" />
        </NuxtLink>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Icon :name="account.icon" class="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 class="page-heading text-xl lg:text-2xl">{{ account.name }}</h1>
            <p class="text-sm" :class="(account.balance || 0) >= 0 ? 'text-gray-500' : 'text-red-500'">
              موجودی: {{ formatCurrency(account.balance || 0) }}
            </p>
          </div>
        </div>
      </div>
      <button
        @click="showTransactionModal = true"
        class="primary-button"
      >
        <Icon name="bx:bx-plus" class="w-4 h-4" />
        تراکنش جدید
      </button>
    </div>

    <div class="segmented">
      <button @click="filterType = ''" :class="!filterType ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'">همه</button>
      <button @click="filterType = 'income'" :class="filterType === 'income' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'">درآمد</button>
      <button @click="filterType = 'expense'" :class="filterType === 'expense' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'">هزینه</button>
    </div>

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
            <p class="font-medium text-gray-900 text-sm">{{ t.description || (t.type === 'income' ? 'درآمد' : 'هزینه') }}</p>
            <p class="text-xs text-gray-400">{{ toJalali(t.date) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <p class="font-bold text-sm" :class="t.type === 'income' ? 'text-emerald-600' : 'text-red-600'">
            {{ t.type === 'income' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
          </p>
          <div class="flex items-center gap-1">
            <button @click="openEdit(t)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
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
      <Icon name="bx:bx-receipt" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">تراکنشی ثبت نشده</p>
    </div>

    <TransactionModal
      v-if="showTransactionModal"
      :account-id="accountId"
      @close="showTransactionModal = false"
      @created="handleCreated"
    />

    <TransactionEditModal
      v-if="editTransaction"
      :transaction="editTransaction"
      @close="editTransaction = null"
      @updated="handleUpdated"
    />
  </div>
</template>
