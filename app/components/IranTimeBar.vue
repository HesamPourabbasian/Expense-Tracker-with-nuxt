<script setup lang="ts">
const date = ref('')
const time = ref('')

const dateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'Asia/Tehran',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
  timeZone: 'Asia/Tehran',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

function updateTime() {
  const now = new Date()
  date.value = dateFormatter.format(now)
  time.value = timeFormatter.format(now)
}

let timer: ReturnType<typeof setInterval> | undefined
updateTime()

onMounted(() => {
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center border-b border-white/10 bg-[#102d26] px-4 text-white">
    <div class="flex w-full max-w-7xl items-center justify-between gap-3 text-xs">
      <span class="flex items-center gap-1.5 font-medium text-white/70">
        <svg class="h-3.5 w-3.5 text-[#f5c451]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        زمان ایران
      </span>
      <div class="flex min-w-0 items-center gap-2 sm:gap-4">
        <span class="truncate text-white/65">{{ date || 'تاریخ ایران' }}</span>
        <time class="shrink-0 font-bold tabular-nums text-white" datetime="">{{ time || '--:--:--' }}</time>
      </div>
    </div>
  </div>
</template>
