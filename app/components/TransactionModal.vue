<script setup lang="ts">
import moment from 'jalali-moment'

const props = defineProps<{ accountId: string }>()
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
  if (!form.date) {
    error.value = 'تاریخ را وارد کنید'
    return
  }

  const gregorianDate = moment(form.date, 'jYYYY/jMM/jDD').toDate()

  loading.value = true
  try {
    await $fetch('/api/transactions', {
      method: 'POST',
      body: {
        bankAccountId: parseInt(props.accountId),
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
        <h2 class="text-lg font-bold text-gray-900">تراکنش جدید</h2>
        <button @click="emit('close')" class="icon-button" aria-label="بستن پنجره">
          <Icon name="bx:bx-x" class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <div class="flex rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            @click="form.type = 'income'"
            class="flex-1 py-2.5 text-sm font-medium transition-colors"
            :class="form.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'"
          >درآمد</button>
          <button
            type="button"
            @click="form.type = 'expense'"
            class="flex-1 py-2.5 text-sm font-medium border-r border-gray-200 transition-colors"
            :class="form.type === 'expense' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'"
          >هزینه</button>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">مبلغ (تومان)</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            class="form-control"
            placeholder="مبلغ را وارد کنید"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">تاریخ (شمسی)</label>
          <input
            v-model="form.date"
            type="text"
            class="form-control text-left"
            dir="ltr"
            placeholder="1405/05/10"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">توضیحات</label>
          <input
            v-model="form.description"
            type="text"
            class="form-control"
            placeholder="توضیحات اختیاری"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-xl font-medium text-sm transition-colors"
        >
          {{ loading ? 'در حال ذخیره...' : 'ذخیره تراکنش' }}
        </button>
      </form>
    </div>
  </div>
</template>
