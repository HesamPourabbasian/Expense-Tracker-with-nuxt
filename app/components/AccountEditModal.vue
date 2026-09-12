<script setup lang="ts">
import type { BankAccount } from '~/types'

const props = defineProps<{ account: BankAccount }>()
const emit = defineEmits(['close', 'updated'])

const form = reactive({
  name: props.account.name,
  icon: props.account.icon
})

onKeyStroke('Escape', () => emit('close'))

const error = ref('')
const loading = ref(false)
const searchQuery = ref('')

const { bankIcons, detectBankIcon } = useConstants()

function selectIcon(val: string) {
  form.icon = val
}

const filteredBankIcons = computed(() => {
  if (!searchQuery.value.trim()) return bankIcons
  const q = searchQuery.value.trim().toLowerCase()
  return bankIcons.filter(b => 
    b.label.toLowerCase().includes(q) || 
    b.keywords?.some(k => k.toLowerCase().includes(q))
  )
})

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
    <div class="modal-panel max-w-lg">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Icon name="lucide:pencil" class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white">ویرایش حساب</h2>
            <p class="text-xs text-slate-400">تغییر نام یا لوگوی حساب بانکی</p>
          </div>
        </div>
        <button @click="emit('close')" class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="بستن پنجره">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">نام حساب</label>
          <input
            v-model="form.name"
            type="text"
            class="form-control font-bold"
            spellcheck="false"
            autocomplete="off"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">آیکون و نماد بانک</label>
            <span class="text-[11px] text-slate-400">{{ filteredBankIcons.length }} مورد</span>
          </div>

          <!-- Bank search filter -->
          <div class="relative mb-2.5">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="جستجوی نام بانک (مثلا ملی، بلو، پاسارگاد...)"
              class="form-control text-xs pr-8 py-2"
            />
            <Icon name="lucide:search" class="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              type="button"
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <Icon name="lucide:x" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Icons Grid -->
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-2">
            <button
              v-for="icon in filteredBankIcons"
              :key="icon.value"
              type="button"
              @click="selectIcon(icon.value)"
              class="p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1.5 relative group text-center"
              :class="form.icon === icon.value ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/25 font-bold shadow-sm' : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-lg p-0.5 group-hover:scale-110 transition-transform">
                <Icon :name="icon.value" class="w-7 h-7 object-contain" />
              </div>
              <span class="text-[11px] truncate max-w-full font-medium">{{ icon.label }}</span>
              <div v-if="form.icon === icon.value" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Icon name="lucide:check" class="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </button>
            <div v-if="!filteredBankIcons.length" class="col-span-full py-6 text-center text-xs text-slate-400">
              بانکی با این نام یافت نشد
            </div>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="primary-button w-full mt-3"
        >
          <span v-if="loading">در حال ذخیره...</span>
          <span v-else>ذخیره تغییرات</span>
        </button>
      </form>
    </div>
  </div>
</template>
