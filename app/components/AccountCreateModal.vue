<script setup lang="ts">
const emit = defineEmits(['close', 'created'])

const form = reactive({
  name: '',
  icon: 'bx:bx-bank'
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
    await $fetch('/api/accounts', {
      method: 'POST',
      body: form
    })
    emit('created')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در ایجاد حساب'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="emit('close')">
    <div class="modal-panel">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-gray-900">ایجاد حساب جدید</h2>
        <button @click="emit('close')" class="p-1 rounded-lg hover:bg-gray-100">
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
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
            placeholder="مثال: حساب اصلی"
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
              <span class="text-[10px]" :class="form.icon === icon.value ? 'text-primary-600' : 'text-gray-500'">{{ icon.label }}</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-xl font-medium text-sm transition-colors"
        >
          {{ loading ? 'در حال ایجاد...' : 'ایجاد حساب' }}
        </button>
      </form>
    </div>
  </div>
</template>
