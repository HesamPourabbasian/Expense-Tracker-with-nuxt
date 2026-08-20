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
  <div class="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center border-b border-slate-800 bg-slate-950/95 px-4 text-white backdrop-blur-md">
    <div class="flex w-full max-w-7xl items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2 font-medium text-slate-400">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <span class="font-semibold text-slate-300">ایران</span>
      </div>
      <div class="flex min-w-0 items-center gap-2 sm:gap-4 text-xs">
        <span class="truncate text-slate-400">{{ date || 'در حال دریافت...' }}</span>
        <span class="text-slate-600">|</span>
        <time class="shrink-0 font-mono font-bold tracking-wider text-emerald-400" dir="ltr">{{ time || '--:--:--' }}</time>
      </div>
    </div>
  </div>
</template>
