<script setup lang="ts">
import type { BankAccountWithBalance, CashTransaction } from '~/types'
import moment from 'jalali-moment'

const emit = defineEmits(['close', 'created'])
const { formatCurrency } = useFormat()

onKeyStroke('Escape', () => emit('close'))

const { data: accounts } = await useFetch<BankAccountWithBalance[]>('/api/accounts')
const { data: cashTransactions } = await useFetch<CashTransaction[]>('/api/cash/transactions')

const cashBalance = computed(() => {
  if (!cashTransactions.value) return 0
  return cashTransactions.value.reduce((acc, t) => {
    return acc + (t.type === 'income' ? t.amount : -t.amount)
  }, 0)
})

const isSettled = ref(false)
const paymentMethod = ref<'bank' | 'cash'>('bank')
const selectedBankAccountId = ref<number | null>(null)

watchEffect(() => {
  if (accounts.value && accounts.value.length > 0 && selectedBankAccountId.value === null) {
    selectedBankAccountId.value = accounts.value[0]?.id ?? null
  } else if ((!accounts.value || accounts.value.length === 0) && paymentMethod.value === 'bank') {
    paymentMethod.value = 'cash'
  }
})

const form = reactive({
  person: '',
  amount: 0,
  type: 'I_OWE' as 'I_OWE' | 'OWED_TO_ME',
  description: '',
  date: moment().format('jYYYY/jMM/jDD'),
  paymentDate: moment().format('jYYYY/jMM/jDD')
})

const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!form.person) {
    error.value = 'نام طرف حساب را وارد کنید'
    return
  }
  if (!form.amount || form.amount <= 0) {
    error.value = 'مبلغ را وارد کنید'
    return
  }

  if (isSettled.value && paymentMethod.value === 'bank' && !selectedBankAccountId.value) {
    error.value = 'لطفاً حساب بانکی را انتخاب کنید'
    return
  }

  const gregorianDate = moment(form.date, 'jYYYY/jMM/jDD').toDate()
  if (isNaN(gregorianDate.getTime())) {
    error.value = 'تاریخ سررسید نامعتبر است'
    return
  }

  const gregorianPaymentDate = isSettled.value && form.paymentDate
    ? moment(form.paymentDate, 'jYYYY/jMM/jDD').toDate()
    : gregorianDate

  loading.value = true
  try {
    await $fetch('/api/debts', {
      method: 'POST',
      body: {
        person: form.person,
        amount: form.amount,
        type: form.type,
        description: form.description || null,
        date: gregorianDate.toISOString(),
        status: isSettled.value ? 'paid' : 'pending',
        paymentMethod: isSettled.value ? paymentMethod.value : undefined,
        bankAccountId: isSettled.value && paymentMethod.value === 'bank' ? selectedBankAccountId.value : null,
        paymentDate: isSettled.value ? gregorianPaymentDate.toISOString() : null
      }
    })
    emit('created')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در ایجاد بدهی'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal-panel max-w-lg">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-base font-extrabold text-slate-900 dark:text-white">ثبت تعهد جدید</h2>
        <button @click="emit('close')" class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="بستن پنجره">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <div class="grid grid-cols-2 p-1 gap-1 rounded-xl bg-slate-100/90 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800">
          <button
            type="button"
            @click="form.type = 'I_OWE'"
            class="py-2 text-xs font-bold rounded-lg transition-all"
            :class="form.type === 'I_OWE' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
          >بدهی من</button>
          <button
            type="button"
            @click="form.type = 'OWED_TO_ME'"
            class="py-2 text-xs font-bold rounded-lg transition-all"
            :class="form.type === 'OWED_TO_ME' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
          >طلب من</button>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">طرف حساب (نام شخص / شرکت)</label>
          <input
            v-model="form.person"
            type="text"
            class="form-control font-bold"
            placeholder="مثال: علی رضایی"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">مبلغ (تومان)</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            class="form-control font-bold text-base"
            placeholder="مبلغ به تومان"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">تاریخ سررسید / ثبت (شمسی)</label>
          <input
            v-model="form.date"
            type="text"
            class="form-control text-left font-mono"
            dir="ltr"
            placeholder="1405/05/10"
          />
        </div>

        <!-- Optional Settlement Checkbox -->
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <label class="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="isSettled"
              class="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-white dark:bg-slate-900"
            />
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
              این تعهد قبلاً پرداخت / دریافت شده است (ثبت همزمان تراکنش مالی)
            </span>
          </label>

          <!-- Account selector if settled immediately -->
          <div v-if="isSettled" class="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
              {{ form.type === 'I_OWE' ? 'این بدهی را چطور پرداخت کردید؟' : 'این طلب را کجا دریافت کردید؟' }}
            </label>

            <div class="space-y-2">
              <!-- Cash Option -->
              <button
                type="button"
                @click="paymentMethod = 'cash'"
                class="w-full flex items-center justify-between p-3 rounded-xl border text-right transition"
                :class="paymentMethod === 'cash' ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'"
              >
                <div class="flex items-center gap-2.5">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg" :class="paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'">
                    <Icon name="lucide:wallet" class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-xs font-bold text-slate-900 dark:text-white">کیف پول نقدی (نقد)</p>
                    <p class="text-[11px] text-slate-400 font-medium mt-0.5">موجودی: {{ formatCurrency(cashBalance) }}</p>
                  </div>
                </div>
                <div class="flex h-4 w-4 items-center justify-center rounded-full border" :class="paymentMethod === 'cash' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'">
                  <Icon v-if="paymentMethod === 'cash'" name="lucide:check" class="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </button>

              <!-- Bank Accounts List -->
              <div v-if="accounts && accounts.length > 0" class="space-y-2">
                <button
                  v-for="acc in accounts"
                  :key="acc.id"
                  type="button"
                  @click="paymentMethod = 'bank'; selectedBankAccountId = acc.id"
                  class="w-full flex items-center justify-between p-3 rounded-xl border text-right transition"
                  :class="paymentMethod === 'bank' && selectedBankAccountId === acc.id ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'"
                >
                  <div class="flex items-center gap-2.5">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg" :class="paymentMethod === 'bank' && selectedBankAccountId === acc.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'">
                      <Icon :name="acc.icon || 'lucide:landmark'" class="w-4 h-4" />
                    </div>
                    <div>
                      <p class="text-xs font-bold text-slate-900 dark:text-white">{{ acc.name }}</p>
                      <p class="text-[11px] text-slate-400 font-medium mt-0.5">موجودی: {{ formatCurrency(acc.balance || 0) }}</p>
                    </div>
                  </div>
                  <div class="flex h-4 w-4 items-center justify-center rounded-full border" :class="paymentMethod === 'bank' && selectedBankAccountId === acc.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'">
                    <Icon v-if="paymentMethod === 'bank' && selectedBankAccountId === acc.id" name="lucide:check" class="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </button>
              </div>
            </div>

            <!-- Payment Date -->
            <div class="pt-1">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {{ form.type === 'I_OWE' ? 'تاریخ پرداخت (شمسی)' : 'تاریخ دریافت (شمسی)' }}
              </label>
              <input
                v-model="form.paymentDate"
                type="text"
                class="form-control text-left font-mono"
                dir="ltr"
                placeholder="1405/06/08"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">توضیحات تکمیلی</label>
          <textarea
            v-model="form.description"
            rows="2"
            class="form-control resize-none text-sm"
            placeholder="جزئیات و یادداشت این بدهی یا طلب..."
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="primary-button w-full mt-2"
        >
          <span v-if="loading">در حال ذخیره...</span>
          <span v-else>ذخیره تعهد</span>
        </button>
      </form>
    </div>
  </div>
</template>

