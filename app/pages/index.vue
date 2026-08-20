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
        <p class="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">نمای کلی مالی</p>
        <h1 class="page-heading">سلام، امروز حسابت چطوره؟</h1>
        <p class="page-kicker">موجودی‌ها، جریان درآمد و هزینه‌ها را در یک نگاه رصد کن.</p>
      </div>
      <div class="surface flex h-11 items-center self-start p-1 sm:self-auto gap-1 border-slate-200">
        <button @click="prevMonth" class="icon-button h-9 w-9 text-slate-600 hover:text-slate-900" title="ماه قبل">
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
        </button>
        <span class="min-w-32 text-center text-sm font-bold text-slate-800">{{ getPersianMonthName(month) }} {{ year }}</span>
        <button @click="nextMonth" class="icon-button h-9 w-9 text-slate-600 hover:text-slate-900" title="ماه بعد">
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
        </button>
      </div>
    </header>

    <div v-if="status === 'pending'" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="item in 3" :key="item" class="h-40 animate-pulse rounded-2xl bg-slate-200" />
    </div>

    <template v-else-if="dashboard">
      <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <!-- Hero Total Assets Card -->
        <div class="surface relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-950 via-[#07241c] to-slate-950 p-6 text-white shadow-xl shadow-emerald-950/20 sm:p-7 md:col-span-2 xl:col-span-1 ring-1 ring-white/10">
          <div class="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
          <div class="mb-7 flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-300">کل دارایی در دسترس</span>
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <Icon name="lucide:badge-dollar-sign" class="h-5 w-5" />
            </div>
          </div>
          <p class="money max-w-full break-words text-2xl font-black tracking-tight sm:text-3xl text-white">{{ formatCurrency(totalAssets) }}</p>
          <div class="mt-6 grid grid-cols-1 gap-2 border-t border-white/10 pt-4 text-xs font-medium text-slate-300 sm:grid-cols-2">
            <span class="flex items-center justify-between sm:justify-start gap-1.5">بانک: <bdi class="money font-bold text-white">{{ formatCurrency(dashboard.totalBankBalance) }}</bdi></span>
            <span class="flex items-center justify-between sm:justify-start gap-1.5">نقد: <bdi class="money font-bold text-white">{{ formatCurrency(dashboard.cashBalance) }}</bdi></span>
          </div>
        </div>

        <!-- Monthly Income Card -->
        <div class="surface p-6 hover:-translate-y-0.5 hover:shadow-card-hover">
          <div class="mb-6 flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
              <Icon name="lucide:trending-up" class="h-5 w-5" />
            </div>
            <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">این ماه</span>
          </div>
          <p class="text-xs font-medium text-slate-500">مجموع درآمد</p>
          <p class="money mt-1.5 max-w-full break-words text-xl font-extrabold text-slate-900 sm:text-2xl">{{ formatCurrency(totalIncome) }}</p>
          <p class="mt-3 text-xs text-slate-400"><bdi class="money font-medium text-slate-600">{{ formatCurrency(dashboard.monthlyCashIncome) }}</bdi> به‌صورت نقدی</p>
        </div>

        <!-- Monthly Expense Card -->
        <div class="surface p-6 hover:-translate-y-0.5 hover:shadow-card-hover">
          <div class="mb-6 flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-500/20">
              <Icon name="lucide:trending-down" class="h-5 w-5" />
            </div>
            <span class="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">این ماه</span>
          </div>
          <p class="text-xs font-medium text-slate-500">مجموع هزینه</p>
          <p class="money mt-1.5 max-w-full break-words text-xl font-extrabold text-slate-900 sm:text-2xl">{{ formatCurrency(totalExpenses) }}</p>
          <p class="mt-3 text-xs text-slate-400"><bdi class="money font-medium text-slate-600">{{ formatCurrency(dashboard.monthlyCashExpenses) }}</bdi> به‌صورت نقدی</p>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <!-- Bank Accounts Card -->
        <div class="surface p-6 xl:col-span-2">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="font-extrabold text-slate-900">حساب‌های بانکی</h2>
              <p class="mt-0.5 text-xs text-slate-400">موجودی فعلی هر حساب بانکی</p>
            </div>
            <NuxtLink to="/accounts" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition">مشاهده همه &larr;</NuxtLink>
          </div>
          <div v-if="dashboard.bankAccounts.length" class="divide-y divide-slate-100">
            <NuxtLink 
              v-for="account in dashboard.bankAccounts" 
              :key="account.id" 
              :to="`/accounts/${account.id}`" 
              class="group grid grid-cols-[minmax(0,1fr)] gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 transition"
            >
              <div class="flex min-w-0 items-center gap-3.5">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100/90 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
                  <Icon :name="account.icon" class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <span class="truncate text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition">{{ account.name }}</span>
                </div>
              </div>
              <span class="money justify-self-start text-sm font-bold sm:justify-self-end" :class="account.balance >= 0 ? 'text-slate-900' : 'text-rose-600'">{{ formatCurrency(account.balance) }}</span>
            </NuxtLink>
          </div>
          <p v-else class="py-10 text-center text-sm text-slate-400">هنوز حساب بانکی ثبت نشده است.</p>
        </div>

        <div class="space-y-4">
          <!-- Monthly Net Balance -->
          <div class="surface p-6">
            <p class="text-xs font-medium text-slate-500">تراز خالص این ماه</p>
            <p class="money mt-2 max-w-full break-words text-xl font-extrabold sm:text-2xl" :class="dashboard.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'">{{ formatCurrency(dashboard.netBalance) }}</p>
          </div>

          <!-- Open Debts Card -->
          <NuxtLink to="/debts" class="surface block p-6 transition hover:border-slate-300 hover:shadow-card-hover group">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="font-extrabold text-slate-900 group-hover:text-emerald-700 transition">تعهدات و طلب‌ها</h2>
              <Icon name="lucide:arrow-up-left" class="h-4 w-4 text-slate-400 group-hover:text-emerald-700 transition" />
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex flex-wrap justify-between gap-2">
                <span class="text-xs font-medium text-slate-500">بدهی من:</span>
                <strong class="money text-amber-700 font-bold">{{ formatCurrency(dashboard.debtsIOwe) }}</strong>
              </div>
              <div class="flex flex-wrap justify-between gap-2">
                <span class="text-xs font-medium text-slate-500">طلب من:</span>
                <strong class="money text-teal-700 font-bold">{{ formatCurrency(dashboard.debtsOwedToMe) }}</strong>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>
