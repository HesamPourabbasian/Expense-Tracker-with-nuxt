<script setup lang="ts">
import type { BankAccount, PaginatedTransactions, Transaction } from '~/types'
import moment from 'jalali-moment'

const route = useRoute()
const accountId = route.params.id as string

const { toJalali, formatCurrency, getPersianMonthName } = useFormat()
const toast = useToast()

const showTransactionModal = ref(false)
const editTransaction = ref<Transaction | null>(null)
const filterType = ref<string>('')
const page = ref(1)

const { data: account, refresh: refreshAccount } = await useFetch<BankAccount>(`/api/accounts/${accountId}`)

const { data: transactionData, status, refresh: refreshTransactions } = await useFetch<PaginatedTransactions>('/api/transactions', {
  query: { bankAccountId: accountId, type: filterType, page }
})

const transactions = computed(() => transactionData.value?.transactions)
const pagination = computed(() => transactionData.value?.pagination)

const groupedTransactions = computed(() => {
  if (!transactions.value?.length) return []

  const groups: {
    key: string
    label: string
    transactions: Transaction[]
    totalIncome: number
    totalExpense: number
    totalUnnecessary: number
  }[] = []

  const groupMap = new Map<string, typeof groups[0]>()

  for (const t of transactions.value) {
    const m = moment(t.date)
    const jYear = Number(m.format('jYYYY'))
    const jMonth = Number(m.format('jMM'))
    const key = `${jYear}-${String(jMonth).padStart(2, '0')}`

    let group = groupMap.get(key)
    if (!group) {
      group = {
        key,
        label: `${getPersianMonthName(jMonth)} ${jYear}`,
        transactions: [],
        totalIncome: 0,
        totalExpense: 0,
        totalUnnecessary: 0
      }
      groupMap.set(key, group)
      groups.push(group)
    }

    group.transactions.push(t)
    if (t.type === 'income') {
      group.totalIncome += t.amount
    } else {
      group.totalExpense += t.amount
      if (t.isUnnecessary) {
        group.totalUnnecessary += t.amount
      }
    }
  }

  return groups
})

function setFilter(type: string) {
  filterType.value = type
  page.value = 1
}

function setPage(nextPage: number) {
  if (!pagination.value || nextPage < 1 || nextPage > pagination.value.totalPages) return
  page.value = nextPage
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openEdit(t: Transaction) {
  editTransaction.value = t
}

async function toggleUnnecessary(t: Transaction) {
  const previousState = t.isUnnecessary
  t.isUnnecessary = !previousState
  try {
    await $fetch(`/api/transactions/${t.id}`, {
      method: 'PATCH',
      body: { isUnnecessary: !previousState }
    })
    toast.success(
      !previousState
        ? 'تراکنش به عنوان هزینه غیرضروری (قابل پس‌انداز) علامت‌گذاری شد'
        : 'تراکنش از هزینه‌های غیرضروری خارج شد'
    )
    await refreshAccount()
  } catch (e: any) {
    t.isUnnecessary = previousState
    toast.error('خطا در به‌روزرسانی وضعیت تراکنش')
  }
}

async function deleteTransaction(id: number) {
  if (!confirm('آیا مطمئن هستید؟')) return
  try {
    await $fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    toast.success('تراکنش حذف شد')
    await refreshTransactions()
    await refreshAccount()
    if (pagination.value && page.value > pagination.value.totalPages) page.value = pagination.value.totalPages || 1
  } catch (e: any) {
    toast.error('خطا در حذف تراکنش')
  }
}

async function handleCreated() {
  showTransactionModal.value = false
  await refreshTransactions()
  await refreshAccount()
  toast.success('تراکنش جدید اضافه شد')
}

async function handleUpdated() {
  editTransaction.value = null
  await refreshTransactions()
  await refreshAccount()
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
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Icon :name="account.icon" class="h-5 w-5 text-primary-600" />
          </div>
          <div class="min-w-0">
            <h1 class="page-heading text-xl lg:text-2xl">{{ account.name }}</h1>
            <div class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <p :class="(account.balance || 0) >= 0 ? 'text-gray-500' : 'text-red-500'">
                موجودی: <bdi class="money font-semibold">{{ formatCurrency(account.balance || 0) }}</bdi>
              </p>
              <span v-if="(account.unnecessaryExpense || 0) > 0" class="inline-flex items-center gap-1 font-semibold text-amber-700">
                <Icon name="bx:bxs-star" class="h-4 w-4 text-amber-500" />
                قابل پس‌انداز: <bdi class="money">{{ formatCurrency(account.unnecessaryExpense || 0) }}</bdi>
              </span>
            </div>
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
       <button @click="setFilter('')" :class="!filterType ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'">همه</button>
       <button @click="setFilter('income')" :class="filterType === 'income' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'">درآمد</button>
       <button @click="setFilter('expense')" :class="filterType === 'expense' ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'">هزینه</button>
       <button @click="setFilter('unnecessary')" class="flex items-center gap-1" :class="filterType === 'unnecessary' ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-gray-600 hover:bg-gray-50'">
         <Icon name="bx:bxs-star" class="h-4 w-4 text-amber-500" />
         قابل پس‌انداز
       </button>
    </div>

    <div v-if="status === 'pending'" class="empty-state">
      <Icon name="line-md:loading-twotone-loop" class="mx-auto h-10 w-10 text-primary-600" />
      <p class="text-gray-500">در حال دریافت تراکنش‌ها</p>
    </div>

    <div v-else-if="groupedTransactions.length" class="space-y-4">
      <div
        v-for="group in groupedTransactions"
        :key="group.key"
        class="surface overflow-hidden"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/75 px-4 py-3 sm:px-5">
          <div class="flex items-center gap-2">
            <Icon name="lucide:calendar" class="h-4 w-4 text-primary-700" />
            <span class="text-sm font-bold text-gray-900">{{ group.label }}</span>
            <span class="rounded-full bg-gray-200/70 px-2 py-0.5 text-xs font-medium text-gray-600">
              {{ group.transactions.length }} تراکنش
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <span v-if="group.totalIncome > 0" class="text-emerald-600">
              درآمد: <bdi class="money">+{{ formatCurrency(group.totalIncome) }}</bdi>
            </span>
            <span v-if="group.totalExpense > 0" class="text-rose-600">
              هزینه: <bdi class="money">-{{ formatCurrency(group.totalExpense) }}</bdi>
            </span>
            <span v-if="group.totalUnnecessary > 0" class="inline-flex items-center gap-1 text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
              <Icon name="bx:bxs-star" class="h-3.5 w-3.5 text-amber-500" />
              قابل پس‌انداز: <bdi class="money">{{ formatCurrency(group.totalUnnecessary) }}</bdi>
            </span>
          </div>
        </div>

        <div class="divide-y divide-gray-100">
          <div
            v-for="t in group.transactions"
            :key="t.id"
            class="transaction-row flex items-center justify-between gap-3 p-4 transition hover:bg-gray-50"
            :class="t.isUnnecessary ? 'bg-amber-50/20' : ''"
          >
            <div class="transaction-details flex min-w-0 items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                :class="t.type === 'income' ? 'bg-emerald-50' : (t.isUnnecessary ? 'bg-amber-50' : 'bg-red-50')"
              >
                <Icon
                  :name="t.type === 'income' ? 'bx:bx-plus' : (t.isUnnecessary ? 'bx:bxs-star' : 'bx:bx-minus')"
                  class="h-5 w-5"
                  :class="t.type === 'income' ? 'text-emerald-600' : (t.isUnnecessary ? 'text-amber-500' : 'text-red-600')"
                />
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="break-words text-sm font-medium leading-6 text-gray-900">{{ t.description || (t.type === 'income' ? 'درآمد' : 'هزینه') }}</p>
                  <span
                    v-if="t.isUnnecessary"
                    class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                  >
                    <Icon name="bx:bxs-star" class="h-3 w-3 text-amber-500" />
                    غیرضروری
                  </span>
                </div>
                <p class="text-xs text-gray-400">{{ toJalali(t.date) }}</p>
              </div>
            </div>
            <div class="transaction-actions flex items-center gap-3">
              <p class="money whitespace-nowrap text-sm font-bold" :class="t.type === 'income' ? 'text-emerald-600' : (t.isUnnecessary ? 'text-amber-700' : 'text-red-600')">
                {{ t.type === 'income' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
              </p>
              <div class="flex items-center gap-1">
                <button
                  v-if="t.type === 'expense'"
                  @click="toggleUnnecessary(t)"
                  class="icon-button h-10 w-10 transition"
                  :class="t.isUnnecessary ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'"
                  :title="t.isUnnecessary ? 'حذف از هزینه‌های غیرضروری' : 'علامت‌گذاری به‌عنوان هزینه غیرضروری (قابل پس‌انداز)'"
                >
                  <Icon :name="t.isUnnecessary ? 'bx:bxs-star' : 'bx:bx-star'" class="h-5 w-5" />
                </button>
                <button @click="openEdit(t)" class="icon-button h-10 w-10" title="ویرایش">
                  <Icon name="bx:bx-edit" class="w-4 h-4" />
                </button>
                <button @click="deleteTransaction(t.id)" class="icon-button h-10 w-10 hover:bg-red-50 hover:text-red-500" title="حذف">
                  <Icon name="bx:bx-trash" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <Icon name="bx:bx-receipt" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">تراکنشی یافت نشد</p>
    </div>

    <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between gap-3">
      <button class="primary-button bg-white text-gray-700 ring-1 ring-inset ring-gray-200 shadow-none hover:bg-gray-50 disabled:hover:bg-white" :disabled="page === 1" @click="setPage(page - 1)">
        <Icon name="lucide:chevron-right" class="h-4 w-4" />
        قبلی
      </button>
      <p class="text-sm text-gray-500">صفحه {{ page }} از {{ pagination.totalPages }}</p>
      <button class="primary-button bg-white text-gray-700 ring-1 ring-inset ring-gray-200 shadow-none hover:bg-gray-50 disabled:hover:bg-white" :disabled="page === pagination.totalPages" @click="setPage(page + 1)">
        بعدی
        <Icon name="lucide:chevron-left" class="h-4 w-4" />
      </button>
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
