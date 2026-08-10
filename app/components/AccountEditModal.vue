<script setup lang="ts">
import type { BankAccount } from '~/types'

const props = defineProps<{ account: BankAccount }>()
const emit = defineEmits(['close', 'updated'])

const form = reactive({
  name: props.account.name,
  icon: props.account.icon
})

const error = ref('')
const loading = ref(false)

const { bankIcons } = useConstants()

async function handleSubmit() {
  if (!form.name) {
    error.value = 'نام حساب را وارد کنید'
    return
  }

  loading.value = true
  try {
    await $fetch(`/api/accounts/${props.account.id}`, {
      method: 'PATCH',
      body: form
    })
    emit('updated')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در ویرایش حساب'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal-panel">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-gray-900">ویرایش حساب</h2>
        <button @click="emit('close')" class="icon-button" aria-label="بستن پنجره">
          <Icon name="bx:bx-x" class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">نام حساب</label>
          <input
            v-model="form.name"
            type="text"
            class="form-control"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">آیکون</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="icon in bankIcons"
              :key="icon.value"
              type="button"
              @click="form.icon = icon.value"
              class="p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1"
              :class="form.icon === icon.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <Icon :name="icon.value" class="w-5 h-5" :class="form.icon === icon.value ? 'text-primary-600' : 'text-gray-600'" />
              <span class="text-xs" :class="form.icon === icon.value ? 'text-primary-600' : 'text-gray-500'">{{ icon.label }}</span>
            </button>
          </div>
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
