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
  <div class="relative flex min-h-[calc(100dvh-2.25rem)] items-center justify-center bg-slate-900 p-4 sm:p-6 overflow-hidden">
    <!-- Ambient Background Glows -->
    <div class="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-600/20 blur-[120px] pointer-events-none"></div>
    <div class="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-600/20 blur-[120px] pointer-events-none"></div>

    <div class="relative z-10 w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/25 ring-1 ring-white/20">
          <Icon name="lucide:wallet-cards" class="h-8 w-8" />
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-white">خرج‌یار</h1>
        <p class="mt-2 text-sm leading-6 text-slate-400">سامانه مدرن مدیریت دارایی و زندگی مالی شما</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
        <div v-if="error" class="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-2">نام کاربری</label>
          <div class="relative">
            <input
              v-model="form.username"
              type="text"
              autocomplete="username"
              autofocus
              class="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
              placeholder="نام کاربری خود را وارد کنید"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-2">رمز عبور</label>
          <div class="relative">
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              class="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
              placeholder="رمز عبور خود را وارد کنید"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="primary-button w-full h-12 text-sm font-bold mt-2"
        >
          <span v-if="loading" class="flex items-center gap-2">
            <Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />
            در حال ورود...
          </span>
          <span v-else>ورود به حساب کاربری</span>
        </button>
      </form>
    </div>
  </div>
</template>
