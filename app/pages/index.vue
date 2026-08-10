<script setup lang="ts">
import type { DashboardData } from '~/types'
import moment from 'jalali-moment'

const { formatCurrency, getPersianMonthName } = useFormat()
const currentJalali = moment()
const year = ref(Number(currentJalali.format('jYYYY')))
const month = ref(Number(currentJalali.format('jMM')))

const { data: dashboard, status } = await useFetch<DashboardData>('/api/dashboard', {
  query: { year, month }
})

const totalAssets = computed(() => (dashboard.value?.totalBankBalance || 0) + (dashboard.value?.cashBalance || 0))
const totalIncome = computed(() => (dashboard.value?.monthlyIncome || 0) + (dashboard.value?.monthlyCashIncome || 0))
const totalExpenses = computed(() => (dashboard.value?.monthlyExpenses || 0) + (dashboard.value?.monthlyCashExpenses || 0))

function prevMonth() {
  if (month.value === 1) {
    month.value = 12
    year.value--
  } else month.value--
}

function nextMonth() {
  if (month.value === 12) {
    month.value = 1
    year.value++
  } else month.value++
}
</script>

<template>
  <div class="page-shell">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-1 text-sm font-semibold text-primary-700">نمای کلی مالی</p>
        <h1 class="page-heading">سلام، امروز حسابت چطوره؟</h1>
        <p class="page-kicker">موجودی‌ها، جریان پول و تعهداتت را یک‌جا ببین.</p>
      </div>
      <div class="surface flex h-11 items-center self-start p-1 sm:self-auto">
        <button @click="prevMonth" class="icon-button h-9 w-9" title="ماه قبل">
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
        </button>
        <span class="min-w-32 text-center text-sm font-bold text-gray-800">{{ getPersianMonthName(month) }} {{ year }}</span>
        <button @click="nextMonth" class="icon-button h-9 w-9" title="ماه بعد">
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
        </button>
      </div>
    </header>

    <div v-if="status === 'pending'" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="item in 3" :key="item" class="h-36 animate-pulse rounded-lg bg-gray-200" />
    </div>

    <template v-else-if="dashboard">
      <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div class="surface relative overflow-hidden border-[#315b4c] bg-[#173f35] p-5 text-white sm:p-6 md:col-span-2 xl:col-span-1">
          <div class="mb-8 flex items-center justify-between">
            <span class="text-sm text-white/65">کل دارایی در دسترس</span>
            <Icon name="lucide:badge-dollar-sign" class="h-5 w-5 text-[#f5c451]" />
          </div>
          <p class="money max-w-full break-words text-2xl font-bold sm:text-3xl">{{ formatCurrency(totalAssets) }}</p>
          <div class="mt-4 grid grid-cols-1 gap-2 border-t border-white/10 pt-4 text-sm text-white/65 sm:grid-cols-2">
            <span>بانک <bdi class="money">{{ formatCurrency(dashboard.totalBankBalance) }}</bdi></span>
            <span>نقد <bdi class="money">{{ formatCurrency(dashboard.cashBalance) }}</bdi></span>
          </div>
        </div>

        <div class="surface p-5">
          <div class="mb-7 flex items-center justify-between">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Icon name="lucide:trending-up" class="h-5 w-5" /></div>
            <span class="text-xs font-medium text-gray-400">این ماه</span>
          </div>
          <p class="text-sm text-gray-500">مجموع درآمد</p>
          <p class="money mt-1 max-w-full break-words text-xl font-bold text-gray-950 sm:text-2xl">{{ formatCurrency(totalIncome) }}</p>
          <p class="mt-2 text-sm text-gray-400"><bdi class="money">{{ formatCurrency(dashboard.monthlyCashIncome) }}</bdi> به‌صورت نقدی</p>
        </div>

        <div class="surface p-5">
          <div class="mb-7 flex items-center justify-between">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Icon name="lucide:trending-down" class="h-5 w-5" /></div>
            <span class="text-xs font-medium text-gray-400">این ماه</span>
          </div>
          <p class="text-sm text-gray-500">مجموع هزینه</p>
          <p class="money mt-1 max-w-full break-words text-xl font-bold text-gray-950 sm:text-2xl">{{ formatCurrency(totalExpenses) }}</p>
          <p class="mt-2 text-sm text-gray-400"><bdi class="money">{{ formatCurrency(dashboard.monthlyCashExpenses) }}</bdi> به‌صورت نقدی</p>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div class="surface p-5 xl:col-span-2">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="font-bold text-gray-950">حساب‌های بانکی</h2>
              <p class="mt-1 text-xs text-gray-400">موجودی فعلی هر حساب</p>
            </div>
            <NuxtLink to="/accounts" class="text-sm font-semibold text-primary-700 hover:text-primary-800">مشاهده همه</NuxtLink>
          </div>
          <div v-if="dashboard.bankAccounts.length" class="divide-y divide-gray-100">
            <NuxtLink v-for="account in dashboard.bankAccounts" :key="account.id" :to="`/accounts/${account.id}`" class="grid grid-cols-[minmax(0,1fr)] gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
              <div class="flex min-w-0 items-center gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700"><Icon :name="account.icon" class="h-5 w-5" /></div>
                <span class="truncate text-sm font-semibold text-gray-800">{{ account.name }}</span>
              </div>
              <span class="money justify-self-start text-sm font-bold sm:justify-self-end" :class="account.balance >= 0 ? 'text-gray-950' : 'text-rose-600'">{{ formatCurrency(account.balance) }}</span>
            </NuxtLink>
          </div>
          <p v-else class="py-8 text-center text-sm text-gray-400">هنوز حساب بانکی نداری.</p>
        </div>

        <div class="space-y-4">
          <div class="surface p-5">
            <p class="text-sm text-gray-500">تراز خالص ماه</p>
            <p class="money mt-2 max-w-full break-words text-xl font-bold sm:text-2xl" :class="dashboard.netBalance >= 0 ? 'text-primary-700' : 'text-rose-600'">{{ formatCurrency(dashboard.netBalance) }}</p>
          </div>
          <NuxtLink to="/debts" class="surface block p-5 transition hover:border-gray-300">
            <div class="mb-4 flex items-center justify-between"><h2 class="font-bold text-gray-950">تعهدات باز</h2><Icon name="lucide:arrow-up-left" class="h-4 w-4 text-gray-400" /></div>
            <div class="space-y-3 text-sm">
              <div class="flex flex-wrap justify-between gap-2"><span class="text-gray-500">بدهی من</span><strong class="money text-amber-700">{{ formatCurrency(dashboard.debtsIOwe) }}</strong></div>
              <div class="flex flex-wrap justify-between gap-2"><span class="text-gray-500">طلب من</span><strong class="money text-teal-700">{{ formatCurrency(dashboard.debtsOwedToMe) }}</strong></div>
            </div>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>
