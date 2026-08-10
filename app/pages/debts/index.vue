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
      <div class="min-w-0"><h1 class="page-heading">بدهی‌ها و طلب‌ها</h1><p class="page-kicker">تعهدات باز و تسویه‌شده را دنبال کن.</p></div>
      <button
        @click="showCreateModal = true"
        class="primary-button w-full sm:w-auto"
      >
        <Icon name="bx:bx-plus" class="w-4 h-4" />
        بدهی جدید
      </button>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="surface p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Icon name="bx:bx-right-arrow-alt" class="w-5 h-5 text-orange-600" />
          </div>
          <span class="text-sm text-gray-500">بدهی‌های من</span>
        </div>
        <p class="money max-w-full break-words text-xl font-bold text-orange-600">{{ formatCurrency(totalIOwe) }}</p>
      </div>

      <div class="surface p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <Icon name="bx:bx-left-arrow-alt" class="w-5 h-5 text-teal-600" />
          </div>
          <span class="text-sm text-gray-500">طلب‌های من</span>
        </div>
        <p class="money max-w-full break-words text-xl font-bold text-teal-600">{{ formatCurrency(totalOwedToMe) }}</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="segmented">
      <button
        @click="filterType = ''"
        class="px-3 py-2 text-sm transition-colors"
        :class="!filterType ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'"
      >همه</button>
      <button
        @click="filterType = 'I_OWE'"
        class="px-3 py-2 text-sm border-r border-gray-200 transition-colors"
        :class="filterType === 'I_OWE' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'"
      >بدهی من</button>
      <button
        @click="filterType = 'OWED_TO_ME'"
        class="px-3 py-2 text-sm border-r border-gray-200 transition-colors"
        :class="filterType === 'OWED_TO_ME' ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'"
      >طلب من</button>
    </div>

    <!-- Debts List -->
    <div v-if="debts?.length" class="surface divide-y divide-gray-100 overflow-hidden">
      <div
        v-for="d in debts"
        :key="d.id"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 transition hover:bg-gray-50"
        :class="d.status === 'paid' ? 'opacity-60' : ''"
      >
          <div class="flex min-w-0 items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="d.type === 'I_OWE' ? 'bg-orange-50' : 'bg-teal-50'"
            >
              <Icon
                :name="d.type === 'I_OWE' ? 'bx:bx-right-arrow-alt' : 'bx:bx-left-arrow-alt'"
                class="w-5 h-5"
                :class="d.type === 'I_OWE' ? 'text-orange-600' : 'text-teal-600'"
              />
            </div>
            <div class="min-w-0">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <p class="break-words text-sm font-medium text-gray-900">{{ d.person }}</p>
                <span
                  v-if="d.status === 'paid'"
                  class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                >پرداخت شده</span>
              </div>
              <p class="mt-0.5 text-sm text-gray-400">{{ toJalali(d.date) }}</p>
              <p v-if="d.description" class="mt-1 break-words text-sm leading-6 text-gray-500">{{ d.description }}</p>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <p class="money whitespace-nowrap text-sm font-bold" :class="d.type === 'I_OWE' ? 'text-orange-600' : 'text-teal-600'">
              {{ formatCurrency(d.amount) }}
            </p>
            <div class="flex items-center gap-1">
              <button
                v-if="d.status === 'pending'"
                @click="markPaid(d.id)"
                class="icon-button h-10 w-10 hover:bg-emerald-50 hover:text-emerald-600"
                title="پرداخت شده"
              >
                <Icon name="bx:bx-check" class="w-4 h-4" />
              </button>
              <button @click="editDebt = d" class="icon-button h-10 w-10">
                <Icon name="bx:bx-edit" class="w-4 h-4" />
              </button>
              <button @click="deleteDebt(d.id)" class="icon-button h-10 w-10 hover:bg-red-50 hover:text-red-500">
                <Icon name="bx:bx-trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <Icon name="bx:bx-dollar" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">بدهی ثبت نشده</p>
    </div>

    <DebtModal v-if="showCreateModal" @close="showCreateModal = false" @created="handleCreated" />
    <DebtEditModal v-if="editDebt" :debt="editDebt" @close="editDebt = null" @updated="handleUpdated" />
  </div>
</template>
