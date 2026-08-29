<script setup lang="ts">
import type { BankAccount, PaginatedTransactions, Transaction } from '~/types'
import moment from 'jalali-moment'

const route = useRoute()
const accountId = route.params.id as string

const { toJalali, formatCurrency, getPersianMonthName } = useFormat()
const toast = useToast()

const showTransactionModal = ref(false)
const showTransferModal = ref(false)
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
    const formatted = moment(t.date).format('jYYYY-jMM')
    const [jYearStr, jMonthStr] = formatted.split('-')
    const jYear = Number(jYearStr)
    const jMonth = Number(jMonthStr)
    const key = formatted

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
    } else if (t.type === 'expense') {
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

function isOutgoingTransfer(t: Transaction): boolean {
  return t.type === 'transfer' && (t.sourceAccountId === Number(accountId) || t.bankAccountId === t.sourceAccountId)
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

async function deleteTransaction(t: Transaction) {
  const isTransfer = t.type === 'transfer'
  const message = isTransfer
    ? 'آیا از حذف این انتقال وجه مطمئن هستید؟ موجودی هر دو حساب به حالت قبلی بازمی‌گردد.'
    : 'آیا از حذف این تراکنش مطمئن هستید؟'
  
  if (!confirm(message)) return

  try {
    await $fetch(`/api/transactions/${t.id}`, { method: 'DELETE' })
    toast.success(isTransfer ? 'انتقال وجه حذف و موجودی حساب‌ها اصلاح شد' : 'تراکنش حذف شد')
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

async function handleTransferCreated() {
  showTransferModal.value = false
  await refreshTransactions()
  await refreshAccount()
  toast.success('انتقال وجه با موفقیت انجام شد')
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
        <NuxtLink to="/accounts" class="icon-button" title="بازگشت به حساب‌ها">
          <Icon name="lucide:arrow-right" class="h-5 w-5" />
        </NuxtLink>
        <div class="flex min-w-0 items-center gap-3.5">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 shadow-xs">
            <Icon :name="account.icon" class="h-6 w-6" />
          </div>
          <div class="min-w-0">
            <h1 class="page-heading text-xl lg:text-2xl">{{ account.name }}</h1>
            <p class="text-xs sm:text-sm font-medium mt-0.5" :class="(account.balance || 0) >= 0 ? 'text-slate-500' : 'text-rose-600'">
              موجودی کل: <bdi class="money font-extrabold text-slate-900">{{ formatCurrency(account.balance || 0) }}</bdi>
            </p>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <button
          @click="showTransferModal = true"
          class="primary-button bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 text-white"
        >
          <Icon name="lucide:arrow-left-right" class="w-4 h-4" />
          مدیریت نقدینگی
        </button>
        <button
          @click="showTransactionModal = true"
          class="primary-button"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          تراکنش جدید
        </button>
      </div>
    </div>

    <div class="segmented">
       <button @click="setFilter('')" :class="!filterType ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'">همه</button>
       <button @click="setFilter('income')" :class="filterType === 'income' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'">درآمد</button>
       <button @click="setFilter('expense')" :class="filterType === 'expense' ? 'bg-rose-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'">هزینه</button>
       <button @click="setFilter('transfer')" :class="filterType === 'transfer' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'">انتقال</button>
       <button @click="setFilter('unnecessary')" class="flex items-center gap-1.5" :class="filterType === 'unnecessary' ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'">
         <Icon name="bx:bxs-star" class="h-4 w-4" :class="filterType === 'unnecessary' ? 'text-white' : 'text-amber-500'" />
         قابل پس‌انداز
       </button>
    </div>

    <div v-if="status === 'pending'" class="empty-state">
      <Icon name="line-md:loading-twotone-loop" class="mx-auto h-10 w-10 text-emerald-600" />
      <p class="text-sm font-medium text-slate-500 mt-2">در حال دریافت تراکنش‌ها...</p>
    </div>

    <div v-else-if="groupedTransactions.length" class="space-y-5">
      <div
        v-for="group in groupedTransactions"
        :key="group.key"
        class="surface overflow-hidden"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div class="flex items-center gap-2.5">
            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Icon name="lucide:calendar" class="h-4 w-4" />
            </div>
            <span class="text-sm font-bold text-slate-900">{{ group.label }}</span>
            <span class="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
              {{ group.transactions.length }} تراکنش
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <span v-if="group.totalIncome > 0" class="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              درآمد: <bdi class="money font-bold">+{{ formatCurrency(group.totalIncome) }}</bdi>
            </span>
            <span v-if="group.totalExpense > 0" class="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
              هزینه: <bdi class="money font-bold">-{{ formatCurrency(group.totalExpense) }}</bdi>
            </span>
            <span v-if="group.totalUnnecessary > 0" class="inline-flex items-center gap-1 text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-200">
              <Icon name="bx:bxs-star" class="h-3.5 w-3.5 text-amber-600" />
              قابل پس‌انداز: <bdi class="money font-bold">{{ formatCurrency(group.totalUnnecessary) }}</bdi>
            </span>
          </div>
        </div>

        <div class="divide-y divide-slate-100">
          <div
            v-for="t in group.transactions"
            :key="t.id"
            class="transaction-row flex items-center justify-between gap-3 p-4 sm:p-5 transition hover:bg-slate-50/70"
            :class="t.isUnnecessary ? 'bg-amber-50/25' : (t.type === 'transfer' ? 'bg-indigo-50/15' : '')"
          >
            <div class="transaction-details flex min-w-0 items-center gap-3.5">
              <!-- Transaction Icon -->
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition"
                :class="t.type === 'transfer'
                  ? (isOutgoingTransfer(t) ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20' : 'bg-teal-50 text-teal-600 ring-1 ring-teal-500/20')
                  : (t.type === 'income' 
                    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' 
                    : (t.isUnnecessary ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/20'))"
              >
                <Icon
                  v-if="t.type === 'transfer'"
                  :name="isOutgoingTransfer(t) ? 'lucide:arrow-up-right' : 'lucide:arrow-down-left'"
                  class="h-5 w-5"
                />
                <Icon
                  v-else
                  :name="t.type === 'income' ? 'lucide:arrow-down-left' : (t.isUnnecessary ? 'bx:bxs-star' : 'lucide:arrow-up-right')"
                  class="h-5 w-5"
                />
              </div>

              <!-- Transaction Labels -->
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <!-- Title -->
                  <p class="break-words text-sm font-bold text-slate-900">
                    <template v-if="t.type === 'transfer'">
                      {{ t.description || (isOutgoingTransfer(t) ? `انتقال به ${t.destinationAccount?.name || 'حساب مقصد'}` : `دریافت از ${t.sourceAccount?.name || 'حساب مبدأ'}`) }}
                    </template>
                    <template v-else>
                      {{ t.description || (t.type === 'income' ? 'درآمد' : 'هزینه') }}
                    </template>
                  </p>

                  <!-- Transfer Badge -->
                  <span
                    v-if="t.type === 'transfer'"
                    class="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800 border border-indigo-200/60"
                  >
                    <Icon name="lucide:arrow-left-right" class="h-3 w-3 text-indigo-600" />
                    انتقال وجه
                  </span>

                  <!-- Unnecessary Expense Badge -->
                  <span
                    v-if="t.isUnnecessary"
                    class="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200/60"
                  >
                    <Icon name="bx:bxs-star" class="h-3 w-3 text-amber-500" />
                    غیرضروری
                  </span>
                </div>

                <!-- Subtitle / Direction & Date -->
                <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
                  <span>{{ toJalali(t.date) }}</span>
                  <template v-if="t.type === 'transfer'">
                    <span>•</span>
                    <span v-if="isOutgoingTransfer(t)" class="text-indigo-600 font-semibold">
                      به: {{ t.destinationAccount?.name || 'حساب مقصد' }}
                    </span>
                    <span v-else class="text-teal-600 font-semibold">
                      از: {{ t.sourceAccount?.name || 'حساب مبدأ' }}
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Transaction Amount and Actions -->
            <div class="transaction-actions flex items-center gap-3">
              <p
                class="money whitespace-nowrap text-sm sm:text-base font-extrabold"
                :class="t.type === 'transfer'
                  ? (isOutgoingTransfer(t) ? 'text-slate-800' : 'text-teal-600')
                  : (t.type === 'income' ? 'text-emerald-600' : (t.isUnnecessary ? 'text-amber-700' : 'text-rose-600'))"
              >
                {{ t.type === 'transfer' ? (isOutgoingTransfer(t) ? '-' : '+') : (t.type === 'income' ? '+' : '-') }} {{ formatCurrency(t.amount) }}
              </p>
              <div class="flex items-center gap-1">
                <button
                  v-if="t.type === 'expense'"
                  @click="toggleUnnecessary(t)"
                  class="icon-button h-9 w-9 transition"
                  :class="t.isUnnecessary ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'"
                  :title="t.isUnnecessary ? 'حذف از هزینه‌های غیرضروری' : 'علامت‌گذاری به‌عنوان هزینه غیرضروری (قابل پس‌انداز)'"
                >
                  <Icon :name="t.isUnnecessary ? 'bx:bxs-star' : 'bx:bx-star'" class="h-5 w-5" />
                </button>
                <button @click="openEdit(t)" class="icon-button h-9 w-9 text-slate-400 hover:text-slate-700" title="ویرایش">
                  <Icon name="lucide:pencil" class="w-4 h-4" />
                </button>
                <button @click="deleteTransaction(t)" class="icon-button h-9 w-9 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="حذف">
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
        <Icon name="lucide:receipt" class="w-7 h-7" />
      </div>
      <h3 class="font-bold text-slate-800">تراکنشی یافت نشد</h3>
      <p class="mt-1 text-xs text-slate-400">برای این حساب هنوز تراکنشی با این فیلتر ثبت نشده است.</p>
    </div>

    <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between gap-3 pt-2">
      <button class="primary-button bg-white text-slate-700 ring-1 ring-inset ring-slate-200 shadow-none hover:bg-slate-50 disabled:opacity-40" :disabled="page === 1" @click="setPage(page - 1)">
        <Icon name="lucide:chevron-right" class="h-4 w-4" />
        قبلی
      </button>
      <p class="text-xs font-bold text-slate-500">صفحه {{ page }} از {{ pagination.totalPages }}</p>
      <button class="primary-button bg-white text-slate-700 ring-1 ring-inset ring-slate-200 shadow-none hover:bg-slate-50 disabled:opacity-40" :disabled="page === pagination.totalPages" @click="setPage(page + 1)">
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

    <TransferModal
      v-if="showTransferModal"
      :initial-source-id="accountId"
      @close="showTransferModal = false"
      @created="handleTransferCreated"
    />

    <TransferEditModal
      v-if="editTransaction && editTransaction.type === 'transfer'"
      :transaction="editTransaction"
      @close="editTransaction = null"
      @updated="handleUpdated"
    />

    <TransactionEditModal
      v-else-if="editTransaction"
      :transaction="editTransaction"
      @close="editTransaction = null"
      @updated="handleUpdated"
    />
  </div>
</template>

