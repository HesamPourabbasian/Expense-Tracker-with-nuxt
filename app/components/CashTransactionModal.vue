<script setup lang="ts">
import moment from 'jalali-moment'

const emit = defineEmits(['close', 'created'])

const form = reactive({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  description: '',
  date: moment().format('jYYYY/jMM/jDD')
})

const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!form.amount || form.amount <= 0) {
    error.value = 'مبلغ را وارد کنید'
    return
  }

  const gregorianDate = moment(form.date, 'jYYYY/jMM/jDD').toDate()

  loading.value = true
  try {
    await $fetch('/api/cash/transactions', {
      method: 'POST',
      body: {
        type: form.type,
        amount: form.amount,
        description: form.description || null,
        date: gregorianDate.toISOString()
      }
    })
    emit('created')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در ایجاد تراکنش'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal-panel">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-base font-extrabold text-slate-900 dark:text-white">تراکنش نقدی جدید</h2>
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
            @click="form.type = 'income'"
            class="py-2 text-xs font-bold rounded-lg transition-all"
            :class="form.type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
          >درآمد نقدی (+)</button>
          <button
            type="button"
            @click="form.type = 'expense'"
            class="py-2 text-xs font-bold rounded-lg transition-all"
            :class="form.type === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
          >هزینه نقدی (-)</button>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">مبلغ (تومان)</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            class="form-control font-bold"
            placeholder="مبلغ به تومان"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">تاریخ (شمسی)</label>
          <input
            v-model="form.date"
            type="text"
            class="form-control text-left font-mono"
            dir="ltr"
            placeholder="1405/05/10"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">توضیحات</label>
          <input
            v-model="form.description"
            type="text"
            class="form-control"
            placeholder="عنوان یا توضیحات اختیاری..."
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="primary-button w-full mt-2"
        >
          <span v-if="loading">در حال ذخیره...</span>
          <span v-else>ذخیره تراکنش نقدی</span>
        </button>
      </form>
    </div>
  </div>
</template>
