<script setup lang="ts">
import type { ThemeMode } from '~/composables/useTheme'

const props = withDefaults(defineProps<{
  variant?: 'button' | 'segmented'
}>(), {
  variant: 'button'
})

const { theme, isDark, setTheme, toggleTheme } = useTheme()
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <!-- Segmented 3-mode selector variant -->
  <div v-if="variant === 'segmented'" class="segmented bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-1">
    <button
      type="button"
      @click="setTheme('light')"
      class="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all"
      :class="theme === 'light' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      title="حالت روشن"
    >
      <Icon name="lucide:sun" class="w-3.5 h-3.5" />
      <span>روشن</span>
    </button>
    <button
      type="button"
      @click="setTheme('dark')"
      class="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all"
      :class="theme === 'dark' ? 'bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      title="حالت تاریک"
    >
      <Icon name="lucide:moon" class="w-3.5 h-3.5" />
      <span>تاریک</span>
    </button>
    <button
      type="button"
      @click="setTheme('system')"
      class="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all"
      :class="theme === 'system' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      title="هماهنگ با تم سیستم"
    >
      <Icon name="lucide:monitor" class="w-3.5 h-3.5" />
      <span>سیستم</span>
    </button>
  </div>

  <!-- Quick Toggle Icon Button variant -->
  <button
    v-else
    type="button"
    @click="toggleTheme"
    class="icon-button h-9 w-9 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-transform active:scale-95"
    :title="isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
    :aria-label="isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
  >
    <ClientOnly>
      <Icon v-if="isDark" name="lucide:sun" class="w-4 h-4 text-amber-400 hover:text-amber-300 transition-transform rotate-0 scale-100" />
      <Icon v-else name="lucide:moon" class="w-4 h-4 text-slate-600 hover:text-indigo-600 transition-transform rotate-0 scale-100" />
      <template #fallback>
        <div class="w-4 h-4" />
      </template>
    </ClientOnly>
  </button>
</template>
