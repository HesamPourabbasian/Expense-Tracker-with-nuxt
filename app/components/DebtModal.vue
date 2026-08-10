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
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="emit('close')">
    <div class="modal-panel">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-gray-900">بدهی جدید</h2>
        <button @click="emit('close')" class="p-1 rounded-lg hover:bg-gray-100">
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
            @click="form.type = 'I_OWE'"
            class="flex-1 py-2.5 text-sm font-medium transition-colors"
            :class="form.type === 'I_OWE' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'"
          >بدهی من</button>
          <button
            type="button"
            @click="form.type = 'OWED_TO_ME'"
            class="flex-1 py-2.5 text-sm font-medium border-r border-gray-200 transition-colors"
            :class="form.type === 'OWED_TO_ME' ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'"
          >طلب من</button>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">نام شخص</label>
          <input
            v-model="form.person"
            type="text"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
            placeholder="نام شخص را وارد کنید"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">مبلغ (تومان)</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
            placeholder="مبلغ را وارد کنید"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">تاریخ (شمسی)</label>
          <input
            v-model="form.date"
            type="text"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
            placeholder="1405/05/10"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">توضیحات</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm resize-none"
            placeholder="توضیحات تکمیلی..."
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-xl font-medium text-sm transition-colors"
        >
          {{ loading ? 'در حال ذخیره...' : 'ذخیره بدهی' }}
        </button>
      </form>
    </div>
  </div>
</template>
