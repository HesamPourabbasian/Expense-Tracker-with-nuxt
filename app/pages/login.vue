<script setup lang="ts">
definePageMeta({ layout: false })

const { login, loading } = useAuth()
const toast = useToast()

const form = reactive({
  username: '',
  password: ''
})

const error = ref('')

async function handleLogin() {
  error.value = ''
  if (!form.username || !form.password) {
    error.value = 'نام کاربری و رمز عبور را وارد کنید'
    return
  }

  try {
    await login(form.username, form.password)
    toast.success('ورود موفقیت‌آمیز بود')
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'خطا در ورود'
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100dvh-2.25rem)] items-center justify-center bg-[#f3f1eb] p-4 sm:p-6">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mb-5 inline-flex h-16 w-16 items-center justify-center border border-[#315b4c] bg-[#173f35] text-[#d7b66b] shadow-lg" style="border-radius: 10px">
          <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 11h3.75a2 2 0 0 1 1.6.8l.45.6a4 4 0 0 0 6.4 0l.45-.6a2 2 0 0 1 1.6-.8H21M3 7h18" />
            <rect width="18" height="18" x="3" y="3" rx="2" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-[#17231f]">خرج‌یار</h1>
        <p class="mt-2 text-sm leading-6 text-gray-500">دفتر خصوصی مدیریت زندگی مالی شما</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5 border bg-[#fffdf9] p-5 shadow-xl shadow-gray-900/5 sm:p-8" style="border-color: rgba(29, 54, 44, .12); border-radius: 10px">
        <div v-if="error" class="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">نام کاربری</label>
          <input
            v-model="form.username"
            type="text"
            autocomplete="username"
            autofocus
            class="form-control"
            placeholder="نام کاربری خود را وارد کنید"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">رمز عبور</label>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="form-control"
            placeholder="رمز عبور خود را وارد کنید"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="primary-button w-full"
        >
          <span v-if="loading">در حال ورود...</span>
          <span v-else>ورود</span>
        </button>
      </form>
    </div>
  </div>
</template>
