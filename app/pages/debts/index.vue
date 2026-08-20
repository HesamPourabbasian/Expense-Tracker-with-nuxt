<script setup lang="ts">
import type { Debt } from '~/types'

const { toJalali, formatCurrency } = useFormat()
const toast = useToast()

const showCreateModal = ref(false)
const editDebt = ref<Debt | null>(null)
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

async function deleteDebt(id: number) {
  if (!confirm('آیا مطمئن هستید؟')) return
  try {
    await $fetch(`/api/debts/${id}`, { method: 'DELETE' })
    toast.success('بدهی حذف شد')
    refresh()
  } catch (e: any) {
    toast.error('خطا در حذف بدهی')
  }
}

async function markPaid(id: number) {
  try {
    await $fetch(`/api/debts/${id}`, {
      method: 'PATCH',
      body: { status: 'paid' }
    })
    toast.success('بدهی به عنوان پرداخت شده علامت‌گذاری شد')
    refresh()
  } catch (e: any) {
    toast.error('خطا در تغییر وضعیت')
  }
}

async function handleCreated() {
  showCreateModal.value = false
  await refresh()
  toast.success('بدهی جدید اضافه شد')
}

async function handleUpdated() {
  editDebt.value = null
  await refresh()
  toast.success('بدهی ویرایش شد')
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
      <div class="surface p-6 hover:-translate-y-0.5 hover:shadow-card-hover">
        <div class="flex items-center justify-between mb-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-500/20">
            <Icon name="lucide:arrow-up-right" class="w-5 h-5" />
          </div>
          <span class="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">بدهی باز</span>
        </div>
        <p class="text-xs font-medium text-slate-500">بدهی‌های من (پرداخت‌نشده)</p>
        <p class="money mt-1.5 max-w-full break-words text-xl sm:text-2xl font-extrabold text-amber-700">{{ formatCurrency(totalIOwe) }}</p>
      </div>

      <div class="surface p-6 hover:-translate-y-0.5 hover:shadow-card-hover">
        <div class="flex items-center justify-between mb-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-teal-500/20">
            <Icon name="lucide:arrow-down-left" class="w-5 h-5" />
          </div>
          <span class="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800">طلب باز</span>
        </div>
        <p class="text-xs font-medium text-slate-500">طلب‌های من (دریافت‌نشده)</p>
        <p class="money mt-1.5 max-w-full break-words text-xl sm:text-2xl font-extrabold text-teal-700">{{ formatCurrency(totalOwedToMe) }}</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="segmented">
      <button
        @click="filterType = ''"
        :class="!filterType ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'"
      >همه</button>
      <button
        @click="filterType = 'I_OWE'"
        :class="filterType === 'I_OWE' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'"
      >بدهی من</button>
      <button
        @click="filterType = 'OWED_TO_ME'"
        :class="filterType === 'OWED_TO_ME' ? 'bg-teal-600 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'"
      >طلب من</button>
    </div>

    <!-- Debts List -->
    <div v-if="debts?.length" class="surface divide-y divide-slate-100 overflow-hidden">
      <div
        v-for="d in debts"
        :key="d.id"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 sm:p-5 transition hover:bg-slate-50/70"
        :class="d.status === 'paid' ? 'opacity-55' : ''"
      >
        <div class="flex min-w-0 items-start gap-3.5">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition text-xs font-bold"
            :class="d.type === 'I_OWE' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20' : 'bg-teal-50 text-teal-700 ring-1 ring-teal-500/20'"
          >
            {{ d.person.slice(0, 2) }}
          </div>
          <div class="min-w-0">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <p class="break-words text-sm font-bold text-slate-900">{{ d.person }}</p>
              <span
                v-if="d.status === 'paid'"
                class="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800"
              >تسویه شده</span>
              <span
                v-else
                class="rounded-md px-2 py-0.5 text-[11px] font-bold"
                :class="d.type === 'I_OWE' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'"
              >{{ d.type === 'I_OWE' ? 'بدهی' : 'طلب' }}</span>
            </div>
            <p class="mt-0.5 text-xs text-slate-400 font-medium">{{ toJalali(d.date) }}</p>
            <p v-if="d.description" class="mt-1 break-words text-xs leading-5 text-slate-500">{{ d.description }}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <p class="money whitespace-nowrap text-sm sm:text-base font-extrabold" :class="d.type === 'I_OWE' ? 'text-amber-700' : 'text-teal-700'">
            {{ formatCurrency(d.amount) }}
          </p>
          <div class="flex items-center gap-1">
            <button
              v-if="d.status === 'pending'"
              @click="markPaid(d.id)"
              class="icon-button h-9 w-9 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700"
              title="علامت‌گذاری به‌عنوان پرداخت‌شده"
            >
              <Icon name="lucide:check" class="w-4 h-4" />
            </button>
            <button @click="editDebt = d" class="icon-button h-9 w-9 text-slate-400 hover:text-slate-700" title="ویرایش">
              <Icon name="lucide:pencil" class="w-4 h-4" />
            </button>
            <button @click="deleteDebt(d.id)" class="icon-button h-9 w-9 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="حذف">
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
        <Icon name="lucide:hand-coins" class="w-7 h-7" />
      </div>
      <h3 class="font-bold text-slate-800">بدهی یا طلبی ثبت نشده</h3>
      <p class="mt-1 text-xs text-slate-400">تعهدات و قرض‌های خود با دیگران را اینجا بنویس.</p>
    </div>

    <DebtModal v-if="showCreateModal" @close="showCreateModal = false" @created="handleCreated" />
    <DebtEditModal v-if="editDebt" :debt="editDebt" @close="editDebt = null" @updated="handleUpdated" />
  </div>
</template>
