<script setup lang="ts">
import type { Debt } from '~/types'
import moment from 'jalali-moment'

const props = defineProps<{ debt: Debt }>()
const emit = defineEmits(['close', 'updated'])

const form = reactive({
  person: props.debt.person,
  amount: props.debt.amount,
  type: props.debt.type as 'I_OWE' | 'OWED_TO_ME',
  description: props.debt.description || '',
  date: moment(props.debt.date).format('jYYYY/jMM/jDD'),
  status: props.debt.status as 'pending' | 'paid'
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
    await $fetch(`/api/debts/${props.debt.id}`, {
      method: 'PATCH',
      body: {
        person: form.person,
        amount: form.amount,
        type: form.type,
        description: form.description || null,
        date: gregorianDate.toISOString(),
        status: form.status
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
    <div class="modal-panel">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-gray-900">ویرایش بدهی</h2>
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
            class="form-control"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">مبلغ (تومان)</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            class="form-control"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">تاریخ (شمسی)</label>
          <input
            v-model="form.date"
            type="text"
            class="form-control text-left"
            dir="ltr"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">وضعیت</label>
          <div class="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              @click="form.status = 'pending'"
              class="flex-1 py-2.5 text-sm font-medium transition-colors"
              :class="form.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'text-gray-600 hover:bg-gray-50'"
            >در انتظار</button>
            <button
              type="button"
              @click="form.status = 'paid'"
              class="flex-1 py-2.5 text-sm font-medium border-r border-gray-200 transition-colors"
              :class="form.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'"
            >پرداخت شده</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">توضیحات</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="form-control resize-none"
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-xl font-medium text-sm transition-colors"
        >
          {{ loading ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}
        </button>
      </form>
    </div>
  </div>
</template>
