<script setup lang="ts">
const { toasts } = useToast()
</script>

<template>
  <div class="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-[65] space-y-2 sm:left-auto sm:right-5 sm:w-full sm:max-w-sm lg:bottom-6 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center gap-3 border px-4 py-3 text-sm font-medium shadow-xl rounded-2xl transform-gpu"
        :class="{
          'bg-emerald-950 text-emerald-100 border-emerald-500/40 shadow-emerald-950/20': toast.type === 'success',
          'bg-rose-950 text-rose-100 border-rose-500/40 shadow-rose-950/20': toast.type === 'error',
          'bg-slate-900 text-slate-100 border-slate-700/60 shadow-slate-950/20': toast.type === 'info'
        }"
      >
        <Icon
          :name="toast.type === 'success' ? 'lucide:check-circle-2' : (toast.type === 'error' ? 'lucide:alert-circle' : 'lucide:info')"
          class="h-5 w-5 shrink-0"
          :class="{
            'text-emerald-400': toast.type === 'success',
            'text-rose-400': toast.type === 'error',
            'text-sky-400': toast.type === 'info'
          }"
        />
        <span class="flex-1 leading-5">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: opacity 0.2s ease-out, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translate3d(0, 10px, 0);
}
.toast-leave-to {
  opacity: 0;
  transform: translate3d(0, -6px, 0);
}
</style>
