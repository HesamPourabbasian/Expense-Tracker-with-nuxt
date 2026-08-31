<script setup lang="ts">
import type { Todo } from '~/types'

interface TodoResponse {
  todos: Todo[]
  summary: { total: number; completed: number; pending: number; percentage: number }
}

const toast = useToast()
const selectedDate = ref(new Date())
const newTask = ref('')
const newDescription = ref('')
const showDetails = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const editTitle = ref('')
const editDescription = ref('')

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const queryDate = computed(() => dateKey(selectedDate.value))
const { data, refresh, status } = await useFetch<TodoResponse>('/api/todos', { query: { date: queryDate } })

const formattedDate = computed(() => new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
}).format(selectedDate.value))

const isToday = computed(() => queryDate.value === dateKey(new Date()))
const circleOffset = computed(() => 251.2 - (251.2 * (data.value?.summary.percentage || 0)) / 100)

function changeDay(amount: number) {
  const next = new Date(selectedDate.value)
  next.setDate(next.getDate() + amount)
  selectedDate.value = next
}

function goToday() {
  selectedDate.value = new Date()
}

async function addTask() {
  const title = newTask.value.trim()
  if (!title) return
  saving.value = true
  try {
    await $fetch('/api/todos', {
      method: 'POST',
      body: { title, description: newDescription.value.trim() || null, date: queryDate.value }
    })
    newTask.value = ''
    newDescription.value = ''
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
    await $fetch(`/api/todos/${todo.id}`, { method: 'PATCH', body: { completed: !todo.completed } })
    await refresh()
  } catch {
    toast.error('خطا در تغییر وضعیت کار')
  }
}

function startEdit(todo: Todo) {
  editingId.value = todo.id
  editTitle.value = todo.title
  editDescription.value = todo.description || ''
}

async function saveEdit(id: number) {
  if (!editTitle.value.trim()) return
  try {
    await $fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      body: { title: editTitle.value, description: editDescription.value }
    })
    editingId.value = null
    await refresh()
    toast.success('کار ویرایش شد')
  } catch {
    toast.error('خطا در ویرایش کار')
  }
}

async function deleteTask(id: number) {
  if (!confirm('این کار حذف شود؟')) return
  try {
    await $fetch(`/api/todos/${id}`, { method: 'DELETE' })
    await refresh()
    toast.success('کار حذف شد')
  } catch {
    toast.error('خطا در حذف کار')
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p class="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">برنامه‌ریزی و بهره‌وری</p>
        <h1 class="page-heading">برنامه روزانه</h1>
        <p class="page-kicker">اهداف و وظایف روزانه را ثبت و مسیر موفقیت را گام به گام دنبال کن.</p>
      </div>

      <div class="surface flex w-full items-center justify-between p-1.5 sm:w-auto gap-1 border-slate-200 dark:border-slate-800">
        <button class="icon-button h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" title="روز قبل" @click="changeDay(-1)">
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
        </button>
        <div class="min-w-0 px-3 text-center sm:min-w-56">
          <p class="truncate text-sm font-extrabold text-slate-900 dark:text-white">{{ formattedDate }}</p>
          <button v-if="!isToday" class="mt-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline" @click="goToday">بازگشت به امروز</button>
          <p v-else class="mt-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">امروز</p>
        </div>
        <button class="icon-button h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" title="روز بعد" @click="changeDay(1)">
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
        </button>
      </div>
    </header>

    <section class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div class="space-y-4">
        <!-- Add Task Form -->
        <form class="surface p-5 shadow-sm" @submit.prevent="addTask">
          <div class="flex flex-col gap-3 sm:flex-row">
            <div class="relative min-w-0 flex-1">
              <Icon name="lucide:plus" class="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input v-model="newTask" class="form-control pr-12" type="text" maxlength="160" placeholder="امروز چه کاری باید انجام شود؟" spellcheck="false" autocomplete="off">
            </div>
            <button class="primary-button w-full sm:w-auto" type="submit" :disabled="saving || !newTask.trim()">
              <Icon name="lucide:plus" class="h-4 w-4" />
              {{ saving ? 'در حال افزودن...' : 'افزودن کار' }}
            </button>
          </div>
          <button type="button" class="mt-3 flex min-h-8 items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-150" @click="showDetails = !showDetails">
            <Icon name="lucide:align-left" class="h-3.5 w-3.5" />
            {{ showDetails ? 'بستن توضیحات اختیاری' : '+ افزودن توضیحات اختیاری' }}
          </button>
          <textarea v-if="showDetails" v-model="newDescription" class="form-control mt-2.5 resize-none" rows="2" maxlength="500" placeholder="جزئیات تکمیلی این کار..." spellcheck="false" />
        </form>

        <div v-if="status === 'pending'" class="space-y-3">
          <div v-for="item in 3" :key="item" class="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>

        <div v-else-if="data?.todos.length" class="surface divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          <article v-for="todo in data.todos" :key="todo.id" class="group p-4 sm:p-5 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/40" :class="todo.completed ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''">
            <div v-if="editingId === todo.id" class="space-y-3">
              <input v-model="editTitle" class="form-control font-bold" maxlength="160" @keyup.enter="saveEdit(todo.id)" spellcheck="false" autocomplete="off">
              <textarea v-model="editDescription" class="form-control resize-none text-sm" rows="2" maxlength="500" placeholder="توضیحات..." spellcheck="false" />
              <div class="flex flex-wrap justify-end gap-2">
                <button class="min-h-9 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200" @click="editingId = null">انصراف</button>
                <button class="primary-button min-h-9 text-xs px-4" @click="saveEdit(todo.id)">ذخیره تغییرات</button>
              </div>
            </div>

            <div v-else class="grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <button 
                class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors duration-150 sm:mt-0" 
                :class="todo.completed ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-transparent hover:border-emerald-500'" 
                :aria-label="todo.completed ? 'بازگرداندن به انجام نشده' : 'علامت‌گذاری به عنوان انجام شده'" 
                @click="toggleTask(todo)"
              >
                <Icon name="lucide:check" class="h-4 w-4 stroke-[3]" />
              </button>

              <div class="min-w-0">
                <h2 class="break-words text-sm font-bold leading-6 sm:text-base transition" :class="todo.completed ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'">{{ todo.title }}</h2>
                <p v-if="todo.description" class="mt-0.5 break-words text-xs leading-5" :class="todo.completed ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'">{{ todo.description }}</p>
              </div>

              <div class="col-span-2 flex justify-end gap-1 border-t border-slate-100 dark:border-slate-800 pt-2 sm:col-span-1 sm:border-0 sm:pt-0 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <button class="icon-button h-9 w-9 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title="ویرایش" @click="startEdit(todo)"><Icon name="lucide:pencil" class="h-4 w-4" /></button>
                <button class="icon-button h-9 w-9 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400" title="حذف" @click="deleteTask(todo.id)"><Icon name="lucide:trash-2" class="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Icon name="lucide:check-square-2" class="h-7 w-7" />
          </div>
          <h2 class="font-bold text-slate-800 dark:text-slate-200">برنامه این روز خالی است</h2>
          <p class="mt-1 text-xs text-slate-400">اولین کار را اضافه کن تا درصد پیشرفت روزانه‌ات محاسبه شود.</p>
        </div>
      </div>

      <!-- Performance Sidebar -->
      <aside class="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <div class="surface p-6">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <h2 class="font-extrabold text-slate-900 dark:text-white">عملکرد امروز</h2>
              <p class="mt-0.5 text-xs text-slate-400 font-medium">درصد تکمیل اهداف روز</p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Icon name="lucide:activity" class="h-4 w-4" />
            </div>
          </div>

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
              <strong class="money text-3xl font-black text-slate-900 dark:text-white">{{ data?.summary.percentage || 0 }}٪</strong>
              <span class="mt-0.5 text-[11px] font-bold text-slate-400">تکمیل شده</span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-3 divide-x-reverse divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 pt-5 text-center">
            <div>
              <strong class="money block text-lg font-extrabold text-slate-900 dark:text-white">{{ data?.summary.total || 0 }}</strong>
              <span class="text-[11px] font-medium text-slate-400">همه</span>
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

        <div class="surface relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-950 via-[#07241c] to-slate-950 p-6 text-white shadow-md ring-1 ring-white/10">
          <Icon name="lucide:quote" class="mb-3 h-5 w-5 text-emerald-400 opacity-80" />
          <p class="text-xs leading-6 text-slate-300 font-medium">پیشرفت‌های بزرگ، حاصل تکرار منظم کارهای کوچک و روزمره هستند.</p>
        </div>
      </aside>
    </section>
  </div>
</template>
