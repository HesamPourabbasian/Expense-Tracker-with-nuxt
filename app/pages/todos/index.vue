<script setup lang="ts">
import type { Todo, TodoResponse } from '~/types'

const toast = useToast()
const selectedDate = ref(new Date())
const taskInputRef = ref<HTMLInputElement | null>(null)

// Form states
const newTask = ref('')
const newNote = ref('')
const newPriority = ref<'normal' | 'medium' | 'high'>('normal')
const newCategory = ref<'financial' | 'work' | 'personal' | 'shopping' | 'other'>('other')
const showDetails = ref(false)
const saving = ref(false)
const batchLoading = ref(false)

// Edit state
const editingId = ref<number | null>(null)
const editTitle = ref('')
const editNote = ref('')
const editPriority = ref<'normal' | 'medium' | 'high'>('normal')
const editCategory = ref<'financial' | 'work' | 'personal' | 'shopping' | 'other'>('other')

// Filters and search
const searchQuery = ref('')
const statusFilter = ref<'all' | 'pending' | 'completed'>('all')
const categoryFilter = ref<string>('all')
const priorityFilter = ref<string>('all')

// Date utilities
function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(str: string): Date {
  const parts = str.split('-').map(Number)
  const y = parts[0] ?? new Date().getFullYear()
  const m = parts[1] ?? (new Date().getMonth() + 1)
  const d = parts[2] ?? new Date().getDate()
  return new Date(y, m - 1, d)
}

function getTomorrowKey(baseDate: Date): string {
  const tomorrow = new Date(baseDate)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return dateKey(tomorrow)
}

const queryDate = computed(() => dateKey(selectedDate.value))
const { data, refresh, status } = await useFetch<TodoResponse>('/api/todos', {
  query: { date: queryDate }
})

const formattedFullDate = computed(() => {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(selectedDate.value)
})

const todayKey = dateKey(new Date())
const isToday = computed(() => queryDate.value === todayKey)
const isYesterday = computed(() => {
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return queryDate.value === dateKey(y)
})
const isTomorrow = computed(() => {
  const t = new Date()
  t.setDate(t.getDate() + 1)
  return queryDate.value === dateKey(t)
})

function changeDay(amount: number) {
  const next = new Date(selectedDate.value)
  next.setDate(next.getDate() + amount)
  selectedDate.value = next
}

function goToday() {
  selectedDate.value = new Date()
}

function goYesterday() {
  const y = new Date()
  y.setDate(y.getDate() - 1)
  selectedDate.value = y
}

function goTomorrow() {
  const t = new Date()
  t.setDate(t.getDate() + 1)
  selectedDate.value = t
}

function selectDayByDate(dateStr: string) {
  selectedDate.value = parseDateKey(dateStr)
}

// Meta tags parsing & serialization
interface TaskMeta {
  priority: 'high' | 'medium' | 'normal'
  category: 'financial' | 'work' | 'personal' | 'shopping' | 'other'
  note: string
}

function parseTaskDescription(raw: string | null): TaskMeta {
  if (!raw) {
    return { priority: 'normal', category: 'other', note: '' }
  }
  let p: TaskMeta['priority'] = 'normal'
  let c: TaskMeta['category'] = 'other'
  let note = raw

  const pMatch = note.match(/\[p:(high|medium|normal)\]/)
  if (pMatch) {
    p = pMatch[1] as TaskMeta['priority']
    note = note.replace(pMatch[0], '')
  }

  const cMatch = note.match(/\[c:(financial|work|personal|shopping|other)\]/)
  if (cMatch) {
    c = cMatch[1] as TaskMeta['category']
    note = note.replace(cMatch[0], '')
  }

  return { priority: p, category: c, note: note.trim() }
}

function serializeTaskDescription(priority: string, category: string, note: string): string | null {
  const trimmed = note.trim()
  const parts: string[] = []
  if (priority && priority !== 'normal') {
    parts.push(`[p:${priority}]`)
  }
  if (category && category !== 'other') {
    parts.push(`[c:${category}]`)
  }
  if (parts.length === 0 && !trimmed) {
    return null
  }
  return [...parts, trimmed].join(' ').trim()
}

// Category and Priority configs
const priorityConfigs = {
  high: {
    label: 'فوری',
    color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300',
    icon: 'lucide:flame'
  },
  medium: {
    label: 'مهم',
    color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300',
    icon: 'lucide:alert-circle'
  },
  normal: {
    label: 'عادی',
    color: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400',
    icon: null
  }
}

const categoryConfigs = {
  financial: {
    label: 'مالی',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300',
    icon: 'lucide:wallet'
  },
  work: {
    label: 'کاری',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800/60 dark:text-indigo-300',
    icon: 'lucide:briefcase'
  },
  personal: {
    label: 'شخصی',
    color: 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800/60 dark:text-purple-300',
    icon: 'lucide:sparkles'
  },
  shopping: {
    label: 'خرید',
    color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800/60 dark:text-amber-300',
    icon: 'lucide:shopping-cart'
  },
  other: {
    label: 'عمومی',
    color: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400',
    icon: 'lucide:tag'
  }
}

// Quick action financial/productivity templates
const quickTemplates = [
  { label: 'پرداخت قبوض و اقساط ماهانه', category: 'financial', priority: 'high', icon: 'lucide:wallet' },
  { label: 'بررسی صورتحساب و مغایرت‌گیری', category: 'financial', priority: 'medium', icon: 'lucide:receipt' },
  { label: 'خرید هفتگی اقلام سوپرمارکتی', category: 'shopping', priority: 'normal', icon: 'lucide:shopping-cart' },
  { label: 'پیگیری صورتحساب و مطالبات معوق', category: 'work', priority: 'medium', icon: 'lucide:briefcase' },
  { label: 'واریز مبلغ به صندوق پس‌انداز', category: 'financial', priority: 'high', icon: 'lucide:piggy-bank' }
]

function applyTemplate(tpl: typeof quickTemplates[0]) {
  newTask.value = tpl.label
  newCategory.value = tpl.category as TaskMeta['category']
  newPriority.value = tpl.priority as TaskMeta['priority']
  taskInputRef.value?.focus()
}

// Progress & Circular Gauge
const completionPercentage = computed(() => data.value?.summary.percentage || 0)
const circleOffset = computed(() => 251.2 - (251.2 * completionPercentage.value) / 100)

const motivationalQuote = computed(() => {
  const pct = completionPercentage.value
  const total = data.value?.summary.total || 0
  if (total === 0) return 'روزی نو، فرصتی نو! اولین وظیفه یا هدف امروزت را اضافه کن.'
  if (pct === 0) return 'شروع سخت‌ترین بخش است؛ نخستین کار را با تمرکز کامل انجام بده.'
  if (pct < 50) return 'شروع خوبی داشتی! روی کارهای فوری و اولویت‌دار متمرکز شو.'
  if (pct < 100) return 'عالی پیش می‌روی! بیش از نیمی از اهداف تیک خورد، ادامه بده.'
  return 'فوق‌العاده بود! تمام کارهای امروز با موفقیت و انضباط کامل تکمیل شد 🎉'
})

// Filtered and searched todos
const filteredTodos = computed(() => {
  if (!data.value?.todos) return []
  return data.value.todos.filter((todo) => {
    if (statusFilter.value === 'pending' && todo.completed) return false
    if (statusFilter.value === 'completed' && !todo.completed) return false

    const meta = parseTaskDescription(todo.description)

    if (categoryFilter.value !== 'all' && meta.category !== categoryFilter.value) return false
    if (priorityFilter.value !== 'all' && meta.priority !== priorityFilter.value) return false

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const titleMatch = todo.title.toLowerCase().includes(q)
      const noteMatch = meta.note.toLowerCase().includes(q)
      if (!titleMatch && !noteMatch) return false
    }

    return true
  })
})

// Task CRUD
async function addTask() {
  const title = newTask.value.trim()
  if (!title) return
  saving.value = true
  try {
    const description = serializeTaskDescription(newPriority.value, newCategory.value, newNote.value)
    await $fetch('/api/todos', {
      method: 'POST',
      body: {
        title,
        description,
        date: queryDate.value
      }
    })
    newTask.value = ''
    newNote.value = ''
    newPriority.value = 'normal'
    newCategory.value = 'other'
    showDetails.value = false
    await refresh()
    toast.success('کار جدید به برنامه اضافه شد')
  } catch (error: any) {
    toast.error(error.data?.statusMessage || 'خطا در افزودن کار')
  } finally {
    saving.value = false
  }
}

async function toggleTask(todo: Todo) {
  try {
    await $fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: { completed: !todo.completed }
    })
    await refresh()
  } catch {
    toast.error('خطا در تغییر وضعیت کار')
  }
}

function startEdit(todo: Todo) {
  const meta = parseTaskDescription(todo.description)
  editingId.value = todo.id
  editTitle.value = todo.title
  editNote.value = meta.note
  editPriority.value = meta.priority
  editCategory.value = meta.category
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(id: number) {
  if (!editTitle.value.trim()) return
  try {
    const description = serializeTaskDescription(editPriority.value, editCategory.value, editNote.value)
    await $fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      body: {
        title: editTitle.value.trim(),
        description
      }
    })
    editingId.value = null
    await refresh()
    toast.success('تغییرات با موفقیت ذخیره شد')
  } catch {
    toast.error('خطا در ذخیره تغییرات کار')
  }
}

async function deleteTask(id: number) {
  if (!confirm('آیا از حذف این کار مطمئن هستید؟')) return
  try {
    await $fetch(`/api/todos/${id}`, { method: 'DELETE' })
    await refresh()
    toast.success('کار حذف شد')
  } catch {
    toast.error('خطا در حذف کار')
  }
}

async function moveTaskToTomorrow(todo: Todo) {
  const tomorrowStr = getTomorrowKey(selectedDate.value)
  try {
    await $fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: { date: tomorrowStr }
    })
    await refresh()
    toast.success('کار به برنامه فردا منتقل شد')
  } catch {
    toast.error('خطا در انتقال کار')
  }
}

// Batch Actions
async function movePendingToTomorrow() {
  const pendingCount = data.value?.summary.pending || 0
  if (pendingCount === 0) {
    toast.info('کار باقی‌مانده‌ای برای انتقال وجود ندارد')
    return
  }
  const tomorrowStr = getTomorrowKey(selectedDate.value)
  batchLoading.value = true
  try {
    await $fetch('/api/todos/batch', {
      method: 'POST',
      body: {
        action: 'movePending',
        date: queryDate.value,
        targetDate: tomorrowStr
      }
    })
    await refresh()
    toast.success(`${pendingCount} کار باقی‌مانده به برنامه فردا منتقل شد`)
  } catch (error: any) {
    toast.error(error.data?.statusMessage || 'خطا در انتقال کارها')
  } finally {
    batchLoading.value = false
  }
}

async function markAllCompleted() {
  const pendingCount = data.value?.summary.pending || 0
  if (pendingCount === 0) {
    toast.info('همه کارها قبلاً انجام شده‌اند')
    return
  }
  batchLoading.value = true
  try {
    await $fetch('/api/todos/batch', {
      method: 'POST',
      body: {
        action: 'markAllCompleted',
        date: queryDate.value
      }
    })
    await refresh()
    toast.success('تمام کارهای این روز تکمیل شدند')
  } catch (error: any) {
    toast.error(error.data?.statusMessage || 'خطا در تکمیل کارها')
  } finally {
    batchLoading.value = false
  }
}

async function clearCompleted() {
  const completedCount = data.value?.summary.completed || 0
  if (completedCount === 0) {
    toast.info('کار انجام‌شده‌ای برای پاکسازی وجود ندارد')
    return
  }
  if (!confirm(`آیا از حذف ${completedCount} کار انجام‌شده اطمینان دارید؟`)) return
  batchLoading.value = true
  try {
    await $fetch('/api/todos/batch', {
      method: 'POST',
      body: {
        action: 'clearCompleted',
        date: queryDate.value
      }
    })
    await refresh()
    toast.success('کارهای انجام‌شده با موفقیت پاکسازی شدند')
  } catch (error: any) {
    toast.error(error.data?.statusMessage || 'خطا در پاکسازی')
  } finally {
    batchLoading.value = false
  }
}
</script>

<template>
  <div class="page-shell space-y-6">
    <!-- Header Section -->
    <header class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div class="mb-1.5 flex items-center gap-2">
          <span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <Icon name="lucide:calendar-days" class="h-3.5 w-3.5" />
            مدیریت وظایف روزانه
          </span>
          <span v-if="isToday" class="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
            امروز
          </span>
        </div>
        <h1 class="page-heading">برنامه و وظایف روزانه</h1>
        <p class="page-kicker">برنامه‌ریزی دقیق، ثبت امور مالی و شخصی، و رصد پیشرفت گام‌به‌گام اهداف.</p>
      </div>

      <!-- Date Navigator & Fast Shortcuts -->
      <div class="flex flex-wrap items-center gap-2 sm:self-auto">
        <!-- Fast date jumps -->
        <div class="segmented hidden sm:inline-flex">
          <button
            type="button"
            :class="isYesterday ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            @click="goYesterday"
          >
            دیروز
          </button>
          <button
            type="button"
            :class="isToday ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            @click="goToday"
          >
            امروز
          </button>
          <button
            type="button"
            :class="isTomorrow ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            @click="goTomorrow"
          >
            فردا
          </button>
        </div>

        <!-- Date navigation stepper -->
        <div class="surface flex items-center justify-between p-1.5 gap-1 border-slate-200 dark:border-slate-800 shadow-xs">
          <button class="icon-button h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" title="روز قبل" @click="changeDay(-1)">
            <Icon name="lucide:chevron-right" class="h-4 w-4" />
          </button>
          <div class="min-w-0 px-3 text-center sm:min-w-52">
            <p class="truncate text-sm font-extrabold text-slate-900 dark:text-white">{{ formattedFullDate }}</p>
            <button v-if="!isToday" class="mt-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline" @click="goToday">
              بازگشت به امروز
            </button>
            <span v-else class="mt-0.5 block text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              امروز فعال است
            </span>
          </div>
          <button class="icon-button h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" title="روز بعد" @click="changeDay(1)">
            <Icon name="lucide:chevron-left" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- 7-Day Persian Week Strip (شنبه تا جمعه) -->
    <nav v-if="data?.weekDays?.length" aria-label="تقویم هفتگی" class="surface p-3 sm:p-4 overflow-hidden shadow-xs">
      <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
        <button
          v-for="day in data.weekDays"
          :key="day.date"
          type="button"
          class="flex flex-col items-center justify-between rounded-xl py-2 px-1 text-center transition-all duration-150 relative border"
          :class="day.date === queryDate 
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-white shadow-xs ring-2 ring-emerald-500/20' 
            : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'"
          @click="selectDayByDate(day.date)"
        >
          <!-- Today indicator pin -->
          <span v-if="day.date === todayKey" class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>

          <span class="text-[11px] font-semibold tracking-tight text-slate-500 dark:text-slate-400">
            <span class="hidden sm:inline">{{ day.dayName }}</span>
            <span class="sm:hidden">{{ day.shortDayName }}</span>
          </span>

          <span class="my-0.5 text-base sm:text-lg font-black" :class="day.date === queryDate ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'">
            {{ day.jalaliDay }}
          </span>

          <!-- Task count status badge -->
          <div class="h-4 flex items-center justify-center">
            <template v-if="day.total > 0">
              <span 
                v-if="day.pending === 0" 
                class="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 rounded-full px-1.5 py-0.5"
                title="همه انجام شده"
              >
                <Icon name="lucide:check" class="h-2.5 w-2.5 stroke-[3]" />
                {{ day.total }}
              </span>
              <span 
                v-else 
                class="inline-flex items-center gap-0.5 text-[10px] font-bold rounded-full px-1.5 py-0.5"
                :class="day.completed > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'"
                :title="`${day.completed} از ${day.total} انجام شده`"
              >
                {{ day.completed }}/{{ day.total }}
              </span>
            </template>
            <span v-else class="text-[11px] text-slate-300 dark:text-slate-600">-</span>
          </div>
        </button>
      </div>
    </nav>

    <!-- Main Layout: Tasks Area + Sidebar -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <!-- Left / Main Column -->
      <main class="space-y-5">
        <!-- 100% Completion Celebration Banner -->
        <div 
          v-if="completionPercentage === 100 && (data?.summary.total || 0) > 0"
          class="surface border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 p-4 sm:p-5 flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3.5">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <Icon name="lucide:trophy" class="h-6 w-6" />
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-emerald-900 dark:text-emerald-100 sm:text-base">آفرین! تمام برنامه‌های امروز کامل شد 🎉</h3>
              <p class="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">تمام وظایف ثبت‌شده برای این روز با موفقیت تیک خوردند.</p>
            </div>
          </div>
          <span class="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
            <Icon name="lucide:check-check" class="h-3.5 w-3.5" />
            ۱۰۰٪ تکمیل
          </span>
        </div>

        <!-- Add Task Card -->
        <section class="surface p-5 shadow-sm">
          <form @submit.prevent="addTask" class="space-y-3.5">
            <div class="flex flex-col gap-3 sm:flex-row">
              <div class="relative min-w-0 flex-1">
                <Icon name="lucide:plus" class="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  ref="taskInputRef"
                  v-model="newTask"
                  class="form-control pr-11 text-sm font-medium"
                  type="text"
                  maxlength="160"
                  placeholder="عنوان وظیفه یا کار جدید را بنویسید (مثلاً پرداخت قبض، خرید ملزومات...)"
                  spellcheck="false"
                  autocomplete="off"
                >
              </div>
              <button
                class="primary-button w-full sm:w-auto shrink-0"
                type="submit"
                :disabled="saving || !newTask.trim()"
              >
                <Icon name="lucide:plus" class="h-4 w-4" />
                <span>{{ saving ? 'در حال ثبت...' : 'افزودن کار' }}</span>
              </button>
            </div>

            <!-- Priority & Category Pickers -->
            <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div class="flex flex-wrap items-center gap-2">
                <!-- Priority selector -->
                <div class="flex items-center gap-1">
                  <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">اولویت:</span>
                  <div class="segmented p-0.5">
                    <button
                      type="button"
                      class="min-h-7 px-2.5 text-[11px] font-bold"
                      :class="newPriority === 'normal' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'"
                      @click="newPriority = 'normal'"
                    >
                      عادی
                    </button>
                    <button
                      type="button"
                      class="min-h-7 px-2.5 text-[11px] font-bold"
                      :class="newPriority === 'medium' ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 shadow-xs' : 'text-slate-500 dark:text-slate-400'"
                      @click="newPriority = 'medium'"
                    >
                      مهم
                    </button>
                    <button
                      type="button"
                      class="min-h-7 px-2.5 text-[11px] font-bold"
                      :class="newPriority === 'high' ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 shadow-xs' : 'text-slate-500 dark:text-slate-400'"
                      @click="newPriority = 'high'"
                    >
                      فوری
                    </button>
                  </div>
                </div>

                <!-- Category selector -->
                <div class="flex items-center gap-1">
                  <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">دسته‌بندی:</span>
                  <select
                    v-model="newCategory"
                    class="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
                  >
                    <option value="other">عمومی</option>
                    <option value="financial">مالی</option>
                    <option value="work">کاری</option>
                    <option value="personal">شخصی</option>
                    <option value="shopping">خرید</option>
                  </select>
                </div>
              </div>

              <!-- Toggle optional note/details -->
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                @click="showDetails = !showDetails"
              >
                <Icon name="lucide:align-left" class="h-3.5 w-3.5" />
                <span>{{ showDetails ? 'بستن یادداشت' : '+ افزودن یادداشت' }}</span>
              </button>
            </div>

            <!-- Optional Note textarea -->
            <div v-if="showDetails" class="pt-1">
              <textarea
                v-model="newNote"
                class="form-control resize-none text-xs"
                rows="2"
                maxlength="400"
                placeholder="یادداشت، شماره پیگیری، یا جزئیات تکمیلی این کار..."
                spellcheck="false"
              />
            </div>

            <!-- Quick Template Chips -->
            <div class="border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <p class="mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">الگوهای آماده برای ثبت سریع امور مالی و روزانه:</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="(tpl, idx) in quickTemplates"
                  :key="idx"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors"
                  @click="applyTemplate(tpl)"
                >
                  <Icon :name="tpl.icon" class="h-3 w-3 text-slate-400" />
                  <span>{{ tpl.label }}</span>
                </button>
              </div>
            </div>
          </form>
        </section>

        <!-- Filters & Search Toolbar -->
        <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <!-- Status Tabs -->
          <div class="segmented">
            <button
              type="button"
              :class="statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'"
              @click="statusFilter = 'all'"
            >
              همه ({{ data?.summary.total || 0 }})
            </button>
            <button
              type="button"
              :class="statusFilter === 'pending' ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'"
              @click="statusFilter = 'pending'"
            >
              در انتظار ({{ data?.summary.pending || 0 }})
            </button>
            <button
              type="button"
              :class="statusFilter === 'completed' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold' : 'text-slate-500 dark:text-slate-400'"
              @click="statusFilter = 'completed'"
            >
              انجام‌شده ({{ data?.summary.completed || 0 }})
            </button>
          </div>

          <!-- Search & Filter Controls -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Search bar -->
            <div class="relative min-w-36 flex-1 sm:w-48 sm:flex-initial">
              <Icon name="lucide:search" class="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                class="form-control h-9 pr-8 text-xs placeholder:text-xs"
                placeholder="جستجو در وظایف..."
              >
              <button
                v-if="searchQuery"
                type="button"
                class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                @click="searchQuery = ''"
              >
                <Icon name="lucide:x" class="h-3 w-3" />
              </button>
            </div>

            <!-- Category filter dropdown -->
            <select
              v-model="categoryFilter"
              class="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">دسته‌ها: همه</option>
              <option value="financial">دسته‌ها: مالی</option>
              <option value="work">دسته‌ها: کاری</option>
              <option value="personal">دسته‌ها: شخصی</option>
              <option value="shopping">دسته‌ها: خرید</option>
              <option value="other">دسته‌ها: عمومی</option>
            </select>

            <!-- Priority filter dropdown -->
            <select
              v-model="priorityFilter"
              class="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">اولویت: همه</option>
              <option value="high">اولویت: فوری</option>
              <option value="medium">اولویت: مهم</option>
              <option value="normal">اولویت: عادی</option>
            </select>
          </div>
        </section>

        <!-- Batch Operations Bar (if tasks exist) -->
        <section 
          v-if="data?.todos?.length" 
          class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-2.5 text-xs"
        >
          <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Icon name="lucide:list-todo" class="h-4 w-4 text-emerald-600" />
            <span class="font-bold">عملیات دسته‌جمعی:</span>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <!-- Move Pending to Tomorrow -->
            <button
              v-if="(data?.summary.pending || 0) > 0"
              type="button"
              :disabled="batchLoading"
              class="inline-flex items-center gap-1 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors disabled:opacity-50"
              @click="movePendingToTomorrow"
            >
              <Icon name="lucide:forward" class="h-3.5 w-3.5" />
              انتقال باقی‌مانده‌ها به فردا
            </button>

            <!-- Mark all completed -->
            <button
              v-if="(data?.summary.pending || 0) > 0"
              type="button"
              :disabled="batchLoading"
              class="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-50"
              @click="markAllCompleted"
            >
              <Icon name="lucide:check-check" class="h-3.5 w-3.5" />
              تکمیل همه
            </button>

            <!-- Clear completed -->
            <button
              v-if="(data?.summary.completed || 0) > 0"
              type="button"
              :disabled="batchLoading"
              class="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-bold text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 hover:border-rose-200 transition-colors disabled:opacity-50"
              @click="clearCompleted"
            >
              <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
              پاکسازی انجام‌شده‌ها
            </button>
          </div>
        </section>

        <!-- Loading Skeletons -->
        <div v-if="status === 'pending'" class="space-y-3">
          <div v-for="item in 3" :key="item" class="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>

        <!-- Task List Items -->
        <div v-else-if="filteredTodos.length" class="surface divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-sm">
          <article
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="group p-4 sm:p-5 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            :class="todo.completed ? 'bg-emerald-50/20 dark:bg-emerald-950/15' : ''"
          >
            <!-- Inline Edit Mode -->
            <div v-if="editingId === todo.id" class="space-y-3">
              <input
                v-model="editTitle"
                class="form-control font-bold"
                maxlength="160"
                placeholder="عنوان کار..."
                spellcheck="false"
                autocomplete="off"
                @keyup.enter="saveEdit(todo.id)"
                @keyup.esc="cancelEdit"
              >

              <div class="flex flex-wrap items-center gap-2 text-xs">
                <!-- Priority picker in edit -->
                <div class="flex items-center gap-1">
                  <span class="font-bold text-slate-500">اولویت:</span>
                  <select
                    v-model="editPriority"
                    class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-1 outline-none"
                  >
                    <option value="normal">عادی</option>
                    <option value="medium">مهم</option>
                    <option value="high">فوری</option>
                  </select>
                </div>

                <!-- Category picker in edit -->
                <div class="flex items-center gap-1">
                  <span class="font-bold text-slate-500">دسته‌بندی:</span>
                  <select
                    v-model="editCategory"
                    class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-1 outline-none"
                  >
                    <option value="other">عمومی</option>
                    <option value="financial">مالی</option>
                    <option value="work">کاری</option>
                    <option value="personal">شخصی</option>
                    <option value="shopping">خرید</option>
                  </select>
                </div>
              </div>

              <textarea
                v-model="editNote"
                class="form-control resize-none text-xs"
                rows="2"
                maxlength="400"
                placeholder="یادداشت و جزئیات..."
                spellcheck="false"
              />

              <div class="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  class="min-h-9 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  @click="cancelEdit"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  class="primary-button min-h-9 text-xs px-4"
                  @click="saveEdit(todo.id)"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </div>

            <!-- View / Normal Mode -->
            <div v-else class="grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <!-- Checkbox -->
              <button
                class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-150 sm:mt-0"
                :class="todo.completed ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-transparent hover:border-emerald-500 hover:bg-emerald-50/50'"
                :aria-label="todo.completed ? 'علامت‌گذاری به عنوان انجام‌نشده' : 'علامت‌گذاری به عنوان انجام‌شده'"
                @click="toggleTask(todo)"
              >
                <Icon name="lucide:check" class="h-4 w-4 stroke-[3]" />
              </button>

              <!-- Content and Badges -->
              <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <!-- Priority badge -->
                  <template v-if="parseTaskDescription(todo.description).priority !== 'normal'">
                    <span
                      class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
                      :class="priorityConfigs[parseTaskDescription(todo.description).priority].color"
                    >
                      <Icon
                        v-if="priorityConfigs[parseTaskDescription(todo.description).priority].icon"
                        :name="priorityConfigs[parseTaskDescription(todo.description).priority].icon!"
                        class="h-3 w-3"
                      />
                      {{ priorityConfigs[parseTaskDescription(todo.description).priority].label }}
                    </span>
                  </template>

                  <!-- Category badge -->
                  <template v-if="parseTaskDescription(todo.description).category !== 'other'">
                    <span
                      class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
                      :class="categoryConfigs[parseTaskDescription(todo.description).category].color"
                    >
                      <Icon
                        :name="categoryConfigs[parseTaskDescription(todo.description).category].icon"
                        class="h-3 w-3"
                      />
                      {{ categoryConfigs[parseTaskDescription(todo.description).category].label }}
                    </span>
                  </template>
                </div>

                <h2
                  class="break-words text-sm font-bold leading-6 sm:text-base transition"
                  :class="todo.completed ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'"
                >
                  {{ todo.title }}
                </h2>

                <p
                  v-if="parseTaskDescription(todo.description).note"
                  class="break-words text-xs leading-5"
                  :class="todo.completed ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'"
                >
                  {{ parseTaskDescription(todo.description).note }}
                </p>
              </div>

              <!-- Action buttons -->
              <div class="col-span-2 flex items-center justify-end gap-1 border-t border-slate-100 dark:border-slate-800 pt-2 sm:col-span-1 sm:border-0 sm:pt-0 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <!-- Reschedule to tomorrow -->
                <button
                  v-if="!todo.completed"
                  type="button"
                  class="icon-button h-8 w-8 text-slate-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
                  title="انتقال به برنامه فردا"
                  @click="moveTaskToTomorrow(todo)"
                >
                  <Icon name="lucide:forward" class="h-4 w-4" />
                </button>

                <!-- Edit -->
                <button
                  type="button"
                  class="icon-button h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="ویرایش"
                  @click="startEdit(todo)"
                >
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </button>

                <!-- Delete -->
                <button
                  type="button"
                  class="icon-button h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  title="حذف"
                  @click="deleteTask(todo.id)"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty State (No tasks matching current filter or empty list) -->
        <div v-else class="empty-state">
          <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Icon name="lucide:check-square-2" class="h-7 w-7" />
          </div>
          <template v-if="data?.todos?.length">
            <h2 class="font-bold text-slate-800 dark:text-slate-200">موردی با فیلترهای انتخابی یافت نشد</h2>
            <p class="mt-1 text-xs text-slate-400">عبارت جستجو یا فیلترهای وضعیت، دسته‌بندی و اولویت را بازنشانی کنید.</p>
            <button
              type="button"
              class="secondary-button mt-4 min-h-8 text-xs"
              @click="searchQuery = ''; statusFilter = 'all'; categoryFilter = 'all'; priorityFilter = 'all'"
            >
              پاک کردن همه فیلترها
            </button>
          </template>
          <template v-else>
            <h2 class="font-bold text-slate-800 dark:text-slate-200">برنامه این روز هنوز خالی است</h2>
            <p class="mt-1 text-xs text-slate-400">یک وظیفه جدید ثبت کن یا از الگوهای آماده بالا برای شروع سریع استفاده کن.</p>
          </template>
        </div>
      </main>

      <!-- Right Column: Productivity & Performance Sidebar -->
      <aside class="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <!-- Progress Ring Card -->
        <div class="surface p-6 shadow-sm">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="font-extrabold text-slate-900 dark:text-white">عملکرد روزانه</h2>
              <p class="mt-0.5 text-xs text-slate-400 font-medium">میزان پیشرفت و تکمیل اهداف</p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Icon name="lucide:activity" class="h-4 w-4" />
            </div>
          </div>

          <!-- Circular SVG Gauge -->
          <div class="relative mx-auto h-36 w-36">
            <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="40" fill="none" class="stroke-slate-100 dark:stroke-slate-800" stroke-width="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10b981"
                stroke-width="8"
                stroke-linecap="round"
                stroke-dasharray="251.2"
                :stroke-dashoffset="circleOffset"
                class="transition-all duration-700 ease-out"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <strong class="money text-3xl font-black text-slate-900 dark:text-white">{{ completionPercentage }}٪</strong>
              <span class="mt-0.5 text-[11px] font-bold text-slate-400">تکمیل شده</span>
            </div>
          </div>

          <!-- Counter Stats -->
          <div class="mt-6 grid grid-cols-3 divide-x-reverse divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 pt-5 text-center">
            <div>
              <strong class="money block text-lg font-extrabold text-slate-900 dark:text-white">{{ data?.summary.total || 0 }}</strong>
              <span class="text-[11px] font-medium text-slate-400">کل کارها</span>
            </div>
            <div>
              <strong class="money block text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{{ data?.summary.completed || 0 }}</strong>
              <span class="text-[11px] font-medium text-slate-400">انجام‌شده</span>
            </div>
            <div>
              <strong class="money block text-lg font-extrabold text-amber-600 dark:text-amber-400">{{ data?.summary.pending || 0 }}</strong>
              <span class="text-[11px] font-medium text-slate-400">باقی‌مانده</span>
            </div>
          </div>
        </div>

        <!-- Dynamic Motivation Widget -->
        <div class="surface relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-950 via-[#07241c] to-slate-950 p-6 text-white shadow-md ring-1 ring-white/10">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="lucide:sparkles" class="h-4 w-4 text-emerald-400" />
            <span class="text-xs font-bold text-emerald-400">پیام انگیزه و بهره‌وری</span>
          </div>
          <p class="text-xs leading-6 text-slate-300 font-medium">
            {{ motivationalQuote }}
          </p>
        </div>

        <!-- Weekly summary card -->
        <div class="surface p-5 shadow-sm space-y-3">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-slate-800 dark:text-slate-200">وضعیت کل این هفته</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-extrabold">
              {{ data?.weekDays?.reduce((acc, d) => acc + d.completed, 0) || 0 }} انجام‌شده
            </span>
          </div>
          <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              class="h-full bg-emerald-500 transition-all duration-500"
              :style="{
                width: `${data?.weekDays?.reduce((acc, d) => acc + d.total, 0) ? Math.round(((data?.weekDays?.reduce((acc, d) => acc + d.completed, 0) || 0) / (data?.weekDays?.reduce((acc, d) => acc + d.total, 0) || 1)) * 100) : 0}%`
              }"
            />
          </div>
          <div class="flex justify-between text-[11px] text-slate-400">
            <span>مجموع اهداف ثبت‌شده: {{ data?.weekDays?.reduce((acc, d) => acc + d.total, 0) || 0 }} کار</span>
            <span>
              {{ data?.weekDays?.reduce((acc, d) => acc + d.total, 0) ? Math.round(((data?.weekDays?.reduce((acc, d) => acc + d.completed, 0) || 0) / (data?.weekDays?.reduce((acc, d) => acc + d.total, 0) || 1)) * 100) : 0 }}٪
            </span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

