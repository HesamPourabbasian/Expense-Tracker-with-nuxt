<script setup lang="ts">
import moment from 'jalali-moment'

const emit = defineEmits(['close', 'created'])

const form = reactive({
  person: '',
  amount: 0,
  type: 'I_OWE' as 'I_OWE' | 'OWED_TO_ME',
  description: '',
  date: moment().format('jYYYY/jMM/jDD')
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

  const gregorianDate = moment(form.date, 'jYYYY/jMM/jDD').toDate()

  loading.value = true
  try {
    await $fetch('/api/debts', {
      method: 'POST',
      body: {
        person: form.person,
        amount: form.amount,
        type: form.type,
        description: form.description || null,
        date: gregorianDate.toISOString()
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
    <div class="modal-panel">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-base font-extrabold text-slate-900">ثبت تعهد جدید</h2>
        <button @click="emit('close')" class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700" aria-label="بستن پنجره">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <div class="grid grid-cols-2 p-1 gap-1 rounded-xl bg-slate-100/90 border border-slate-200/90">
          <button
            type="button"
            @click="form.type = 'I_OWE'"
            class="py-2 text-xs font-bold rounded-lg transition-all"
            :class="form.type === 'I_OWE' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >بدهی من</button>
          <button
            type="button"
            @click="form.type = 'OWED_TO_ME'"
            class="py-2 text-xs font-bold rounded-lg transition-all"
            :class="form.type === 'OWED_TO_ME' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >طلب من</button>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">طرف حساب (نام شخص / شرکت)</label>
          <input
            v-model="form.person"
            type="text"
            class="form-control font-bold"
            placeholder="مثال: علی رضایی"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">مبلغ (تومان)</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            class="form-control font-bold"
            placeholder="مبلغ به تومان"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">تاریخ سررسید / ثبت (شمسی)</label>
          <input
            v-model="form.date"
            type="text"
            class="form-control text-left font-mono"
            dir="ltr"
            placeholder="1405/05/10"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">توضیحات تکمیلی</label>
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
