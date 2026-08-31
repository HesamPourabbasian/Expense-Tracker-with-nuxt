<script setup lang="ts">
import type { BankAccountWithBalance, CashTransaction, Debt } from '~/types'
import moment from 'jalali-moment'

const props = defineProps<{
  debt: Debt
}>()

const emit = defineEmits(['close', 'paid'])
const { formatCurrency } = useFormat()

onKeyStroke('Escape', () => emit('close'))

const { data: accounts, status: accountsStatus } = await useFetch<BankAccountWithBalance[]>('/api/accounts')
const { data: cashTransactions } = await useFetch<CashTransaction[]>('/api/cash/transactions')

const cashBalance = computed(() => {
  if (!cashTransactions.value) return 0
  return cashTransactions.value.reduce((acc, t) => {
    return acc + (t.type === 'income' ? t.amount : -t.amount)
  }, 0)
})

const paymentMethod = ref<'bank' | 'cash'>('bank')
const selectedBankAccountId = ref<number | null>(null)

watchEffect(() => {
  if (accounts.value && accounts.value.length > 0 && selectedBankAccountId.value === null) {
    selectedBankAccountId.value = accounts.value[0]?.id ?? null
  } else if ((!accounts.value || accounts.value.length === 0) && paymentMethod.value === 'bank') {
    paymentMethod.value = 'cash'
  }
})

const defaultDescription = computed(() => {
  if (props.debt.type === 'I_OWE') {
    return props.debt.description ? `پرداخت بدهی به ${props.debt.person} (${props.debt.description})` : `پرداخت بدهی به ${props.debt.person}`
  } else {
    return props.debt.description ? `دریافت طلب از ${props.debt.person} (${props.debt.description})` : `دریافت طلب از ${props.debt.person}`
  }
})

const form = reactive({
  date: moment().format('jYYYY/jMM/jDD'),
  description: defaultDescription.value
})

const selectedBankAccount = computed(() => {
  if (paymentMethod.value !== 'bank') return null
  return accounts.value?.find(a => a.id === selectedBankAccountId.value) || null
})

const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''

  if (paymentMethod.value === 'bank' && !selectedBankAccountId.value) {
    error.value = 'لطفاً یک حساب بانکی انتخاب کنید'
    return
  }

  if (!form.date) {
    error.value = 'لطفاً تاریخ پرداخت را وارد کنید'
    return
  }

  const gregorianDate = moment(form.date, 'jYYYY/jMM/jDD').toDate()
  if (isNaN(gregorianDate.getTime())) {
    error.value = 'تاریخ وارد شده معتبر نیست'
    return
  }

  loading.value = true
  try {
    await $fetch(`/api/debts/${props.debt.id}`, {
      method: 'PATCH',
      body: {
        status: 'paid',
        paymentMethod: paymentMethod.value,
        bankAccountId: paymentMethod.value === 'bank' ? selectedBankAccountId.value : null,
        paymentDate: gregorianDate.toISOString(),
        description: form.description || props.debt.description || null
      }
    })
    emit('paid')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در ثبت پرداخت'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal-panel max-w-lg">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1"
            :class="debt.type === 'I_OWE' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-amber-500/20' : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 ring-teal-500/20'"
          >
            <Icon :name="debt.type === 'I_OWE' ? 'lucide:arrow-up-right' : 'lucide:arrow-down-left'" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white">
              {{ debt.type === 'I_OWE' ? 'این بدهی را چطور پرداخت کردید؟' : 'این طلب را کجا دریافت کردید؟' }}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {{ debt.type === 'I_OWE' ? `پرداخت بدهی به ${debt.person}` : `دریافت طلب از ${debt.person}` }}
              •
              <bdi class="money font-bold text-slate-800 dark:text-slate-200">{{ formatCurrency(debt.amount) }}</bdi>
            </p>
          </div>
        </div>
        <button @click="emit('close')" class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="بستن پنجره">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <!-- Account Selection Options -->
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            {{ debt.type === 'I_OWE' ? 'منبع پرداخت وجه (کسر از موجودی)' : 'حساب مقصد دریافت وجه (افزایش موجودی)' }}
          </label>

          <div class="space-y-2">
            <!-- Cash Option -->
            <button
              type="button"
              @click="paymentMethod = 'cash'"
              class="w-full flex items-center justify-between p-3.5 rounded-xl border text-right transition"
              :class="paymentMethod === 'cash' ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/60'"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl transition"
                  :class="paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                >
                  <Icon name="lucide:wallet" class="w-5 h-5" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-bold text-slate-900 dark:text-white">کیف پول نقدی (پول نقد)</p>
                    <span v-if="paymentMethod === 'cash'" class="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">انتخاب‌شده</span>
                  </div>
                  <p class="text-xs text-slate-400 font-medium mt-0.5">
                    موجودی فعلی نقد: <bdi class="money font-semibold text-slate-600 dark:text-slate-300">{{ formatCurrency(cashBalance) }}</bdi>
                  </p>
                </div>
              </div>
              <div
                class="flex h-5 w-5 items-center justify-center rounded-full border"
                :class="paymentMethod === 'cash' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'"
              >
                <Icon v-if="paymentMethod === 'cash'" name="lucide:check" class="w-3 h-3 stroke-[3]" />
              </div>
            </button>

            <!-- Bank Accounts List -->
            <div v-if="accounts && accounts.length > 0" class="space-y-2">
              <button
                v-for="acc in accounts"
                :key="acc.id"
                type="button"
                @click="paymentMethod = 'bank'; selectedBankAccountId = acc.id"
                class="w-full flex items-center justify-between p-3.5 rounded-xl border text-right transition"
                :class="paymentMethod === 'bank' && selectedBankAccountId === acc.id ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/60'"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-xl transition"
                    :class="paymentMethod === 'bank' && selectedBankAccountId === acc.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
                  >
                    <Icon :name="acc.icon || 'lucide:landmark'" class="w-5 h-5" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-bold text-slate-900 dark:text-white">{{ acc.name }}</p>
                      <span v-if="paymentMethod === 'bank' && selectedBankAccountId === acc.id" class="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">انتخاب‌شده</span>
                    </div>
                    <p class="text-xs text-slate-400 font-medium mt-0.5">
                      موجودی حساب: <bdi class="money font-semibold text-slate-600 dark:text-slate-300">{{ formatCurrency(acc.balance || 0) }}</bdi>
                    </p>
                  </div>
                </div>
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full border"
                  :class="paymentMethod === 'bank' && selectedBankAccountId === acc.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'"
                >
                  <Icon v-if="paymentMethod === 'bank' && selectedBankAccountId === acc.id" name="lucide:check" class="w-3 h-3 stroke-[3]" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Date Input -->
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {{ debt.type === 'I_OWE' ? 'تاریخ پرداخت (شمسی)' : 'تاریخ دریافت (شمسی)' }}
          </label>
          <input
            v-model="form.date"
            type="text"
            class="form-control text-left font-mono"
            dir="ltr"
            placeholder="1405/06/08"
          />
        </div>

        <!-- Description Input -->
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">توضیحات و شرح تراکنش</label>
          <input
            v-model="form.description"
            type="text"
            class="form-control"
            placeholder="یادداشت برای این پرداخت..."
            spellcheck="false"
            autocomplete="off"
          />
        </div>

        <!-- Impact Information Notice -->
        <div
          class="rounded-xl p-3.5 text-xs font-medium border"
          :class="debt.type === 'I_OWE' ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-300' : 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-200/80 dark:border-teal-800/60 text-teal-900 dark:text-teal-300'"
        >
          <p class="flex items-center gap-1.5 font-bold mb-1">
            <Icon name="lucide:info" class="w-4 h-4" />
            تاثیر بر حساب و موجودی:
          </p>
          <template v-if="debt.type === 'I_OWE'">
            <span v-if="paymentMethod === 'bank' && selectedBankAccount">
              مبلغ <bdi class="money font-bold">{{ formatCurrency(debt.amount) }}</bdi> از موجودی حساب «{{ selectedBankAccount.name }}» کسر خواهد شد و در تاریخچه تراکنش‌های این حساب به‌عنوان هزینه ثبت می‌گردد.
            </span>
            <span v-else>
              مبلغ <bdi class="money font-bold">{{ formatCurrency(debt.amount) }}</bdi> از موجودی کیف پول نقدی کسر خواهد شد و در بخش نقد ثبت می‌گردد.
            </span>
          </template>
          <template v-else>
            <span v-if="paymentMethod === 'bank' && selectedBankAccount">
              مبلغ <bdi class="money font-bold">{{ formatCurrency(debt.amount) }}</bdi> به موجودی حساب «{{ selectedBankAccount.name }}» افزوده خواهد شد و در تاریخچه تراکنش‌های این حساب به‌عنوان درآمد ثبت می‌گردد.
            </span>
            <span v-else>
              مبلغ <bdi class="money font-bold">{{ formatCurrency(debt.amount) }}</bdi> به موجودی کیف پول نقدی افزوده خواهد شد و در بخش نقد ثبت می‌گردد.
            </span>
          </template>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="secondary-button w-1/3"
          >
            انصراف
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="primary-button flex-1"
            :class="debt.type === 'I_OWE' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'"
          >
            <Icon v-if="!loading" name="lucide:check" class="w-4 h-4" />
            <span v-if="loading">در حال ثبت...</span>
            <span v-else>{{ debt.type === 'I_OWE' ? 'ثبت پرداخت و کسر از حساب' : 'ثبت دریافت و افزایش موجودی' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
