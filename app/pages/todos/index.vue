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
        <p class="mb-1 text-sm font-semibold text-primary-700">تمرکز و عملکرد</p>
        <h1 class="page-heading">برنامه روزانه</h1>
        <p class="page-kicker">کارهای هر روز را ثبت کن و روند انجام آن‌ها را زیر نظر داشته باش.</p>
      </div>

      <div class="surface flex w-full items-center justify-between p-1 sm:w-auto">
        <button class="icon-button" title="روز قبل" @click="changeDay(-1)"><Icon name="lucide:chevron-right" class="h-5 w-5" /></button>
        <div class="min-w-0 px-2 text-center sm:min-w-56">
          <p class="truncate text-sm font-bold text-gray-900">{{ formattedDate }}</p>
          <button v-if="!isToday" class="mt-0.5 text-xs font-semibold text-primary-700" @click="goToday">بازگشت به امروز</button>
          <p v-else class="mt-0.5 text-xs text-gray-400">امروز</p>
        </div>
        <button class="icon-button" title="روز بعد" @click="changeDay(1)"><Icon name="lucide:chevron-left" class="h-5 w-5" /></button>
      </div>
    </header>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="space-y-4">
        <form class="surface p-4 sm:p-5" @submit.prevent="addTask">
          <div class="flex flex-col gap-3 sm:flex-row">
            <div class="relative min-w-0 flex-1">
              <Icon name="lucide:plus" class="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-700" />
              <input v-model="newTask" class="form-control pr-12" type="text" maxlength="160" placeholder="امروز چه کاری باید انجام شود؟">
            </div>
            <button class="primary-button w-full sm:w-auto" type="submit" :disabled="saving || !newTask.trim()">
              <Icon name="lucide:arrow-up" class="h-4 w-4" />
              {{ saving ? 'در حال افزودن' : 'افزودن کار' }}
            </button>
          </div>
          <button type="button" class="mt-3 flex min-h-10 items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800" @click="showDetails = !showDetails">
            <Icon name="lucide:align-left" class="h-4 w-4" />
            {{ showDetails ? 'بستن توضیحات' : 'افزودن توضیحات' }}
          </button>
          <textarea v-if="showDetails" v-model="newDescription" class="form-control mt-2 resize-none" rows="2" maxlength="500" placeholder="جزئیات اختیاری این کار" />
        </form>

        <div v-if="status === 'pending'" class="space-y-2">
          <div v-for="item in 3" :key="item" class="h-20 animate-pulse rounded-lg bg-gray-200" />
        </div>

        <div v-else-if="data?.todos.length" class="surface divide-y divide-gray-100 overflow-hidden">
          <article v-for="todo in data.todos" :key="todo.id" class="group p-4 sm:p-5" :class="todo.completed ? 'bg-primary-50/30' : ''">
            <div v-if="editingId === todo.id" class="space-y-3">
              <input v-model="editTitle" class="form-control" maxlength="160" @keyup.enter="saveEdit(todo.id)">
              <textarea v-model="editDescription" class="form-control resize-none" rows="2" maxlength="500" placeholder="توضیحات" />
              <div class="flex flex-wrap justify-end gap-2">
                <button class="min-h-10 px-4 text-sm font-semibold text-gray-500" @click="editingId = null">انصراف</button>
                <button class="primary-button" @click="saveEdit(todo.id)">ذخیره تغییرات</button>
              </div>
            </div>

            <div v-else class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <button class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border-2 transition sm:mt-0" :class="todo.completed ? 'border-primary-700 bg-primary-700 text-white' : 'border-gray-300 bg-white text-transparent hover:border-primary-500'" style="border-radius: 7px" :aria-label="todo.completed ? 'بازگرداندن به انجام نشده' : 'علامت‌گذاری به عنوان انجام شده'" @click="toggleTask(todo)">
                <Icon name="lucide:check" class="h-4 w-4" />
              </button>

              <div class="min-w-0">
                <h2 class="break-words text-sm font-semibold leading-6 sm:text-base" :class="todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'">{{ todo.title }}</h2>
                <p v-if="todo.description" class="mt-1 break-words text-sm leading-6" :class="todo.completed ? 'text-gray-300' : 'text-gray-500'">{{ todo.description }}</p>
              </div>

              <div class="col-span-2 flex justify-end gap-1 border-t border-gray-100 pt-2 sm:col-span-1 sm:border-0 sm:pt-0 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <button class="icon-button h-10 w-10" title="ویرایش" @click="startEdit(todo)"><Icon name="lucide:pencil" class="h-4 w-4" /></button>
                <button class="icon-button h-10 w-10 hover:bg-red-50 hover:text-red-600" title="حذف" @click="deleteTask(todo.id)"><Icon name="lucide:trash-2" class="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-50 text-primary-700"><Icon name="lucide:notebook-pen" class="h-7 w-7" /></div>
          <h2 class="font-bold text-gray-900">برنامه این روز خالی است</h2>
          <p class="mt-2 max-w-sm text-sm leading-6 text-gray-500">اولین کار را اضافه کن تا مسیر پیشرفت این روز ساخته شود.</p>
        </div>
      </div>

      <aside class="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <div class="surface p-5">
          <div class="mb-5 flex items-center justify-between">
            <div><h2 class="font-bold text-gray-950">عملکرد روز</h2><p class="mt-1 text-sm text-gray-400">درصد انجام برنامه</p></div>
            <Icon name="lucide:activity" class="h-5 w-5 text-[#c9a45b]" />
          </div>

          <div class="relative mx-auto h-36 w-36">
            <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e8e6df" stroke-width="7" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#176f55" stroke-width="7" stroke-linecap="round" stroke-dasharray="251.2" :stroke-dashoffset="circleOffset" class="transition-all duration-500" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center"><strong class="money text-3xl text-gray-950">{{ data?.summary.percentage || 0 }}٪</strong><span class="mt-1 text-xs text-gray-400">تکمیل شده</span></div>
          </div>

          <div class="mt-6 grid grid-cols-3 divide-x-reverse divide-x divide-gray-100 border-t border-gray-100 pt-5 text-center">
            <div><strong class="money block text-lg text-gray-950">{{ data?.summary.total || 0 }}</strong><span class="text-xs text-gray-400">همه</span></div>
            <div><strong class="money block text-lg text-primary-700">{{ data?.summary.completed || 0 }}</strong><span class="text-xs text-gray-400">انجام‌شده</span></div>
            <div><strong class="money block text-lg text-amber-700">{{ data?.summary.pending || 0 }}</strong><span class="text-xs text-gray-400">باقی‌مانده</span></div>
          </div>
        </div>

        <div class="surface border-[#d7b66b]/40 bg-[#173f35] p-5 text-white">
          <Icon name="lucide:quote" class="mb-4 h-5 w-5 text-[#d7b66b]" />
          <p class="text-sm leading-7 text-white/80">پیشرفت بزرگ، نتیجه تکرار قدم‌های کوچک و کامل‌شده است.</p>
        </div>
      </aside>
    </section>
  </div>
</template>
