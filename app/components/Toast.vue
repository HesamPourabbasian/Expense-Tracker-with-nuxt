<script setup lang="ts">
const { toasts } = useToast()
</script>

<template>
  <div class="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-[65] space-y-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm lg:bottom-4">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="border border-white/10 px-4 py-3 text-sm font-medium text-white shadow-xl backdrop-blur" style="border-radius: 8px"
        :class="{
          'bg-emerald-500': toast.type === 'success',
          'bg-red-500': toast.type === 'error',
          'bg-blue-500': toast.type === 'info'
        }"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
