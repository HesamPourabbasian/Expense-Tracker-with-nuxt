<script setup lang="ts">
const { user, fetchUser, logout } = useAuth()
const route = useRoute()

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
})

const navItems = [
  { to: '/', label: 'خانه', icon: 'lucide:layout-dashboard' },
  { to: '/accounts', label: 'حساب‌ها', icon: 'lucide:landmark' },
  { to: '/cash', label: 'نقدی', icon: 'lucide:wallet' },
  { to: '/debts', label: 'بدهی‌ها', icon: 'lucide:hand-coins' }
]

const mobileMenuOpen = ref(false)

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<template>
  <div v-if="user" class="min-h-screen bg-[#f6f7f4]">
    <aside class="hidden border-l border-gray-200 bg-[#132f28] text-white lg:fixed lg:bottom-0 lg:right-0 lg:top-9 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div class="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div class="flex h-10 w-10 items-center justify-center bg-[#f5c451] text-[#173f35]" style="border-radius: 8px">
          <Icon name="lucide:wallet-cards" class="h-5 w-5" />
        </div>
        <div>
          <h1 class="text-lg font-bold">خرج‌یار</h1>
          <p class="text-xs text-white/55">دفتر مالی شخصی</p>
        </div>
      </div>
      <nav class="flex-1 space-y-2 px-4 py-6">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex min-h-11 items-center gap-3 px-4 text-sm font-medium transition" style="border-radius: 8px"
          :class="isActive(item.to) ? 'bg-white text-[#173f35] shadow-sm' : 'text-white/65 hover:bg-white/10 hover:text-white'"
        >
          <Icon :name="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-white/10 p-4">
        <div class="flex items-center justify-between rounded-lg bg-white/5 p-3">
          <div class="min-w-0">
            <p class="text-xs text-white/45">حساب کاربری</p>
            <span class="block truncate text-sm font-medium">{{ user.username }}</span>
          </div>
          <button @click="logout" class="icon-button text-white/55 hover:bg-white/10 hover:text-white" title="خروج">
            <Icon name="lucide:log-out" class="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>

    <header class="fixed inset-x-0 top-9 z-40 border-b border-gray-200 bg-white/95 backdrop-blur lg:hidden">
      <div class="flex h-16 items-center justify-between px-4">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center bg-primary-600 text-white" style="border-radius: 8px">
            <Icon name="lucide:wallet-cards" class="h-5 w-5" />
          </div>
          <h1 class="font-bold text-gray-950">خرج‌یار</h1>
        </div>
        <button @click="logout" class="icon-button" title="خروج">
          <Icon name="lucide:log-out" class="h-5 w-5" />
        </button>
      </div>
    </header>

    <main class="min-h-screen pb-24 pt-16 lg:mr-64 lg:pb-0 lg:pt-0">
      <div class="p-4 sm:p-6 lg:p-8 xl:p-10">
        <slot />
      </div>
    </main>

    <nav class="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 border border-gray-200 bg-white/95 p-1.5 shadow-lg backdrop-blur lg:hidden" style="border-radius: 8px">
      <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-medium" :class="isActive(item.to) ? 'text-primary-700' : 'text-gray-400'" style="border-radius: 6px">
        <Icon :name="item.icon" class="h-5 w-5" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <Toast />
  </div>
  <div v-else class="flex min-h-screen items-center justify-center bg-[#f6f7f4]">
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
  </div>
</template>
