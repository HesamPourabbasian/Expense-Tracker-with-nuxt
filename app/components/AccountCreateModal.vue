<script setup lang="ts">
const emit = defineEmits(['close', 'created'])

const form = reactive({
  name: '',
  icon: 'lucide:landmark'
})

onKeyStroke('Escape', () => emit('close'))

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
  <div class="modal-backdrop" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="modal-panel">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-base font-extrabold text-slate-900">ایجاد حساب جدید</h2>
        <button @click="emit('close')" class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700" aria-label="بستن پنجره">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">نام حساب</label>
          <input
            v-model="form.name"
            type="text"
            class="form-control font-bold"
            placeholder="مثال: بانک سامان / حساب اصلی"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-2">آیکون و نماد بانک</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="icon in bankIcons"
              :key="icon.value"
              type="button"
              @click="form.icon = icon.value"
              class="p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1.5"
              :class="form.icon === icon.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 font-bold' : 'border-slate-200 bg-slate-50/50 hover:bg-white text-slate-600 hover:border-slate-300'"
            >
              <Icon :name="icon.value" class="w-5 h-5" />
              <span class="text-[11px]">{{ icon.label }}</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="primary-button w-full mt-2"
        >
          <span v-if="loading">در حال ایجاد...</span>
          <span v-else>ایجاد حساب</span>
        </button>
      </form>
    </div>
  </div>
</template>
