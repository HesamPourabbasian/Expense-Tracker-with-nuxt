<script setup lang="ts">
import type { BankAccountWithBalance, CashTransaction, Debt } from '~/types'
import moment from 'jalali-moment'

const props = defineProps<{ debt: Debt }>()
const emit = defineEmits(['close', 'updated'])
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

const initialPaymentMethod = props.debt.isCash ? 'cash' : (props.debt.bankAccountId ? 'bank' : 'cash')
const paymentMethod = ref<'bank' | 'cash'>(initialPaymentMethod)
const selectedBankAccountId = ref<number | null>(props.debt.bankAccountId || null)

watchEffect(() => {
  if (paymentMethod.value === 'bank' && !selectedBankAccountId.value && accounts.value && accounts.value.length > 0) {
    selectedBankAccountId.value = accounts.value[0]?.id ?? null
  }
})

const initialPaymentDate = props.debt.paymentDate
  ? moment(props.debt.paymentDate).format('jYYYY/jMM/jDD')
  : moment(props.debt.date).format('jYYYY/jMM/jDD')

const form = reactive({
  person: props.debt.person,
  amount: props.debt.amount,
  type: props.debt.type as 'I_OWE' | 'OWED_TO_ME',
  description: props.debt.description || '',
  date: moment(props.debt.date).format('jYYYY/jMM/jDD'),
  paymentDate: initialPaymentDate,
  status: props.debt.status as 'pending' | 'paid'
})

const selectedBankAccount = computed(() => {
  if (paymentMethod.value !== 'bank') return null
  return accounts.value?.find(a => a.id === selectedBankAccountId.value) || null
})

const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!form.person) {
    error.value = 'نام شخص را وارد کنید'
    return
  }
  if (!form.amount || form.amount <= 0) {
    error.value = 'مبلغ را وارد کنید'
    return
  }

  if (form.status === 'paid' && paymentMethod.value === 'bank' && !selectedBankAccountId.value) {
    error.value = 'لطفاً حساب بانکی را انتخاب کنید'
    return
  }

  const gregorianDate = moment(form.date, 'jYYYY/jMM/jDD').toDate()
  if (isNaN(gregorianDate.getTime())) {
    error.value = 'تاریخ سررسید نامعتبر است'
    return
  }

  const gregorianPaymentDate = form.paymentDate ? moment(form.paymentDate, 'jYYYY/jMM/jDD').toDate() : gregorianDate

  loading.value = true
  try {
    await $fetch(`/api/debts/${props.debt.id}`, {
      method: 'PATCH',
      body: {
        person: form.person,
        amount: form.amount,
        type: form.type,
        description: form.description || null,
        date: gregorianDate.toISOString(),
        status: form.status,
        paymentMethod: form.status === 'paid' ? paymentMethod.value : undefined,
        bankAccountId: form.status === 'paid' && paymentMethod.value === 'bank' ? selectedBankAccountId.value : null,
        paymentDate: form.status === 'paid' ? gregorianPaymentDate.toISOString() : null
      }
    })
    emit('updated')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در ویرایش بدهی'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal-panel max-w-lg">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-base font-extrabold text-slate-900 dark:text-white">ویرایش تعهد</h2>
        <button @click="emit('close')" class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="بستن پنجره">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <!-- Type Selector -->
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
            placeholder="نام شخص"
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

        <!-- Status Selector -->
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">وضعیت تسویه</label>
          <div class="grid grid-cols-2 p-1 gap-1 rounded-xl bg-slate-100/90 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800">
            <button
              type="button"
              @click="form.status = 'pending'"
              class="py-2 text-xs font-bold rounded-lg transition-all"
              :class="form.status === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >در انتظار</button>
            <button
              type="button"
              @click="form.status = 'paid'"
              class="py-2 text-xs font-bold rounded-lg transition-all"
              :class="form.status === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >تسویه شده</button>
          </div>
        </div>

        <!-- Warning when changing from paid to pending -->
        <div
          v-if="debt.status === 'paid' && form.status === 'pending'"
          class="rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 p-3 text-xs text-amber-800 dark:text-amber-300 font-medium"
        >
          <p class="flex items-center gap-1.5 font-bold mb-0.5">
            <Icon name="lucide:alert-triangle" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
            توجه: بازگردانی به وضعیت در انتظار
          </p>
          با ذخیره تغییرات، تراکنش مالی ثبت‌شده در حساب بانکی یا کیف پول نقدی حذف شده و موجودی مربوطه اصلاح می‌شود.
        </div>

        <!-- Payment Account Selector if status is paid -->
        <div v-if="form.status === 'paid'" class="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
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

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">توضیحات تکمیلی</label>
          <textarea
            v-model="form.description"
            rows="2"
            class="form-control resize-none text-sm"
            placeholder="جزئیات و یادداشت..."
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="primary-button w-full mt-2"
        >
          <span v-if="loading">در حال ذخیره...</span>
          <span v-else>ذخیره تغییرات</span>
        </button>
      </form>
    </div>
  </div>
</template>

