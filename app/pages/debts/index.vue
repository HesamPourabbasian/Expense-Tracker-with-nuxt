<script setup lang="ts">
import type { Debt } from '~/types'

const { toJalali, formatCurrency } = useFormat()
const toast = useToast()

const showCreateModal = ref(false)
const editDebt = ref<Debt | null>(null)
const settleDebt = ref<Debt | null>(null)
const filterType = ref<string>('')

const { data: allDebts, refresh } = await useFetch<Debt[]>('/api/debts')
const debts = computed(() => filterType.value
  ? allDebts.value?.filter(debt => debt.type === filterType.value)
  : allDebts.value)

const totalIOwe = computed(() => {
  if (!allDebts.value) return 0
  return allDebts.value
    .filter(d => d.type === 'I_OWE' && d.status === 'pending')
    .reduce((acc, d) => acc + d.amount, 0)
})

const totalOwedToMe = computed(() => {
  if (!allDebts.value) return 0
  return allDebts.value
    .filter(d => d.type === 'OWED_TO_ME' && d.status === 'pending')
    .reduce((acc, d) => acc + d.amount, 0)
})

async function deleteDebt(d: Debt) {
  const message = d.status === 'paid'
    ? 'آیا از حذف این تعهد مطمئن هستید؟ تراکنش مالی ثبت‌شده نیز حذف و موجودی حساب اصلاح خواهد شد.'
    : 'آیا از حذف این تعهد مطمئن هستید؟'

  if (!confirm(message)) return
  try {
    await $fetch(`/api/debts/${d.id}`, { method: 'DELETE' })
    toast.success('تعهد حذف و موجودی حساب اصلاح شد')
    refresh()
  } catch (e: any) {
    toast.error('خطا در حذف تعهد')
  }
}

function openSettle(d: Debt) {
  settleDebt.value = d
}

async function revertPaid(d: Debt) {
  const confirmMsg = 'آیا می‌خواهید وضعیت این مورد را به «در انتظار» تغییر دهید؟\nتراکنش مالی ثبت‌شده حذف و مبلغ به موجودی حساب/کیف پول بازمی‌گردد.'
  if (!confirm(confirmMsg)) return

  try {
    await $fetch(`/api/debts/${d.id}`, {
      method: 'PATCH',
      body: { status: 'pending' }
    })
    toast.success('تعهد به وضعیت در انتظار بازگشت و تراکنش حذف شد')
    await refresh()
  } catch (e: any) {
    toast.error('خطا در بازگردانی وضعیت تعهد')
  }
}

async function handleCreated() {
  showCreateModal.value = false
  await refresh()
  toast.success('تعهد جدید ثبت شد')
}

async function handleUpdated() {
  editDebt.value = null
  await refresh()
  toast.success('تعهد ویرایش شد')
}

async function handlePaid() {
  settleDebt.value = null
  await refresh()
  toast.success('تسویه با موفقیت انجام شد و تراکنش ثبت گردید')
}
</script>

<template>
  <div class="page-shell">
    <div class="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">تعهدات مالی</p>
        <h1 class="page-heading">بدهی‌ها و طلب‌ها</h1>
        <p class="page-kicker">تعهدات باز، موعدها و مطالبات تسویه‌شده را دنبال کن.</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="primary-button w-full sm:w-auto"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        ثبت تعهد جدید
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="surface p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 dark:ring-amber-500/30">
            <Icon name="lucide:arrow-up-right" class="w-5 h-5" />
          </div>
          <span class="rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">بدهی باز</span>
        </div>
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400">بدهی‌های من (پرداخت‌نشده)</p>
        <p class="money mt-1.5 max-w-full break-words text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400">{{ formatCurrency(totalIOwe) }}</p>
      </div>

      <div class="surface p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500/20 dark:ring-teal-500/30">
            <Icon name="lucide:arrow-down-left" class="w-5 h-5" />
          </div>
          <span class="rounded-full bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 text-[11px] font-bold text-teal-800 dark:text-teal-300">طلب باز</span>
        </div>
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400">طلب‌های من (دریافت‌نشده)</p>
        <p class="money mt-1.5 max-w-full break-words text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-400">{{ formatCurrency(totalOwedToMe) }}</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="segmented">
      <button
        @click="filterType = ''"
        :class="!filterType ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >همه</button>
      <button
        @click="filterType = 'I_OWE'"
        :class="filterType === 'I_OWE' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >بدهی من</button>
      <button
        @click="filterType = 'OWED_TO_ME'"
        :class="filterType === 'OWED_TO_ME' ? 'bg-teal-600 text-white shadow-sm font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >طلب من</button>
    </div>

    <!-- Debts List -->
    <div v-if="debts?.length" class="surface divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
      <div
        v-for="d in debts"
        :key="d.id"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 sm:p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
        :class="d.status === 'paid' ? 'opacity-70 bg-slate-50/40 dark:bg-slate-900/40' : ''"
      >
        <div class="flex min-w-0 items-start gap-3.5">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition text-xs font-bold"
            :class="d.type === 'I_OWE' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20' : 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 ring-1 ring-teal-500/20'"
          >
            {{ d.person.slice(0, 2) }}
          </div>
          <div class="min-w-0">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <p class="break-words text-sm font-bold text-slate-900 dark:text-white">{{ d.person }}</p>

              <!-- Status & Settlement Badges -->
              <template v-if="d.status === 'paid'">
                <span
                  v-if="d.isCash"
                  class="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50"
                >
                  <Icon name="lucide:wallet" class="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  تسویه نقدی
                </span>
                <span
                  v-else-if="d.bankAccount"
                  class="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50"
                >
                  <Icon :name="d.bankAccount.icon || 'lucide:landmark'" class="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  تسویه: {{ d.bankAccount.name }}
                </span>
                <span
                  v-else
                  class="rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300"
                >تسویه شده</span>
              </template>

              <span
                v-else
                class="rounded-md px-2 py-0.5 text-[11px] font-bold"
                :class="d.type === 'I_OWE' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'"
              >{{ d.type === 'I_OWE' ? 'بدهی' : 'طلب' }}</span>
            </div>

            <div class="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-400 font-medium">
              <span>سررسید: {{ toJalali(d.date) }}</span>
              <template v-if="d.status === 'paid' && d.paymentDate">
                <span>•</span>
                <span class="text-emerald-700 dark:text-emerald-400 font-semibold">پرداخت: {{ toJalali(d.paymentDate) }}</span>
              </template>
            </div>

            <p v-if="d.description" class="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">{{ d.description }}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <p class="money whitespace-nowrap text-sm sm:text-base font-extrabold" :class="d.type === 'I_OWE' ? 'text-amber-700 dark:text-amber-400' : 'text-teal-700 dark:text-teal-400'">
            {{ formatCurrency(d.amount) }}
          </p>
          <div class="flex items-center gap-1">
            <!-- Settle / Pay Button (for pending debts) -->
            <button
              v-if="d.status === 'pending'"
              @click="openSettle(d)"
              class="icon-button h-9 w-9 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
              :title="d.type === 'I_OWE' ? 'ثبت پرداخت بدهی' : 'ثبت وصول طلب'"
            >
              <Icon name="lucide:check" class="w-4 h-4" />
            </button>

            <!-- Revert / Undo Button (for paid debts) -->
            <button
              v-if="d.status === 'paid'"
              @click="revertPaid(d)"
              class="icon-button h-9 w-9 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:text-amber-700 dark:hover:text-amber-300 transition"
              title="بازگردانی به وضعیت در انتظار (حذف تراکنش)"
            >
              <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
            </button>

            <!-- Edit Button -->
            <button @click="editDebt = d" class="icon-button h-9 w-9 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title="ویرایش">
              <Icon name="lucide:pencil" class="w-4 h-4" />
            </button>

            <!-- Delete Button -->
            <button @click="deleteDebt(d)" class="icon-button h-9 w-9 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400" title="حذف">
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
        <Icon name="lucide:hand-coins" class="w-7 h-7" />
      </div>
      <h3 class="font-bold text-slate-800 dark:text-slate-200">بدهی یا طلبی ثبت نشده</h3>
      <p class="mt-1 text-xs text-slate-400">تعهدات و قرض‌های خود با دیگران را اینجا بنویس.</p>
    </div>

    <DebtModal v-if="showCreateModal" @close="showCreateModal = false" @created="handleCreated" />
    <DebtEditModal v-if="editDebt" :debt="editDebt" @close="editDebt = null" @updated="handleUpdated" />
    <DebtPayModal v-if="settleDebt" :debt="settleDebt" @close="settleDebt = null" @paid="handlePaid" />
  </div>
</template>
