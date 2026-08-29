<script setup lang="ts">
const { user, fetchUser, logout } = useAuth()
const route = useRoute()

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
})

const navItems = [
  { to: '/', label: 'خانه', mobileLabel: 'خانه', icon: 'lucide:layout-dashboard' },
  { to: '/accounts', label: 'حساب‌ها', mobileLabel: 'حساب', icon: 'lucide:landmark' },
  { to: '/cash', label: 'نقدی', mobileLabel: 'نقدی', icon: 'lucide:wallet' },
  { to: '/debts', label: 'بدهی‌ها', mobileLabel: 'بدهی', icon: 'lucide:hand-coins' },
  { to: '/todos', label: 'برنامه روزانه', mobileLabel: 'روزانه', icon: 'lucide:check-square-2' },
  { to: '/crypto', label: 'رمزارز', mobileLabel: 'رمزارز', icon: 'tabler:currency-bitcoin' }
]

const mobileMenuOpen = ref(false)

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-[calc(100dvh-2.25rem)] bg-slate-50">
    <!-- Desktop Sidebar -->
    <aside class="hidden border-l border-slate-800 bg-[#090e17] text-white lg:fixed lg:bottom-0 lg:right-0 lg:top-9 lg:z-50 lg:flex lg:w-64 lg:flex-col shadow-xl">
      <div class="flex h-20 items-center gap-3 border-b border-slate-800/80 px-6">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 ring-1 ring-white/20">
          <Icon name="lucide:wallet-cards" class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-base font-extrabold tracking-tight text-white">خرج‌یار</h1>
          <p class="text-[11px] font-medium text-emerald-400/90">مدیریت مالی شخصی</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1.5 px-3.5 py-6">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group flex min-h-11 items-center gap-3.5 px-4 text-sm font-medium rounded-xl transition-all"
          :class="isActive(item.to) 
            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm' 
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'"
        >
          <Icon 
            :name="item.icon" 
            class="w-5 h-5 transition-transform group-hover:scale-110" 
            :class="isActive(item.to) ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'" 
          />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="border-t border-slate-800/80 p-4">
        <div class="flex items-center justify-between rounded-xl bg-slate-900/80 border border-slate-800/80 p-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs ring-1 ring-emerald-500/30">
              {{ user?.username ? user.username.slice(0, 1).toUpperCase() : 'U' }}
            </div>
            <div class="min-w-0">
              <span class="block truncate text-xs font-semibold text-slate-200">{{ user?.username || 'کاربر' }}</span>
              <p class="text-[11px] text-slate-400">کاربر فعال</p>
            </div>
          </div>
          <button @click="logout" class="icon-button h-8 w-8 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400" title="خروج">
            <Icon name="lucide:log-out" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Header -->
    <header class="fixed inset-x-0 top-9 z-40 border-b border-slate-200 bg-white/95 lg:hidden transform-gpu">
      <div class="flex h-16 items-center justify-between px-4">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Icon name="lucide:wallet-cards" class="h-5 w-5" />
          </div>
          <h1 class="font-bold text-slate-900">خرج‌یار</h1>
        </div>
        <button @click="logout" class="icon-button text-slate-500 hover:text-rose-600 hover:bg-rose-50" title="خروج">
          <Icon name="lucide:log-out" class="h-5 w-5" />
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="min-h-[calc(100dvh-2.25rem)] pb-28 pt-16 lg:mr-64 lg:pb-10 lg:pt-0">
      <div class="p-4 sm:p-6 lg:p-8 xl:p-10">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Floating Navigation Dock -->
    <nav class="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-6 border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5 rounded-2xl lg:hidden transform-gpu">
      <NuxtLink 
        v-for="item in navItems" 
        :key="item.to" 
        :to="item.to" 
        class="flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-medium rounded-xl transition-colors duration-150"
        :class="isActive(item.to) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-700'"
      >
        <Icon :name="item.icon" class="h-5 w-5" />
        <span>{{ item.mobileLabel }}</span>
      </NuxtLink>
    </nav>

    <Toast />
  </div>
</template>
