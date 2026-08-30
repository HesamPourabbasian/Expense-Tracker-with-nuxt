<script setup lang="ts">
import type { BankAccount } from '~/types'

const toast = useToast()
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showTransferModal = ref(false)
const selectedAccount = ref<BankAccount | null>(null)
const { formatCurrency } = useFormat()

const { data: accounts, refresh } = await useFetch<BankAccount[]>('/api/accounts')

function editAccount(account: BankAccount) {
  selectedAccount.value = account
  showEditModal.value = true
}

async function deleteAccount(id: number) {
  if (!confirm('آیا مطمئن هستید؟')) return
  try {
    await $fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    toast.success('حساب با موفقیت حذف شد')
    refresh()
  } catch (e: any) {
    toast.error(e.data?.statusMessage || 'خطا در حذف حساب')
  }
}

async function handleCreated() {
  showCreateModal.value = false
  await refresh()
  toast.success('حساب جدید ایجاد شد')
}

async function handleTransferCreated() {
  showTransferModal.value = false
  await refresh()
  toast.success('انتقال وجه با موفقیت انجام شد')
}

async function handleUpdated() {
  showEditModal.value = false
  selectedAccount.value = null
  await refresh()
  toast.success('حساب با موفقیت ویرایش شد')
}
</script>

<template>
  <div class="page-shell">
    <div class="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">مدیریت موجودی</p>
        <h1 class="page-heading">حساب‌های بانکی</h1>
        <p class="page-kicker">موجودی، گردش مالی و انتقال بین حساب‌ها را مدیریت کن.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
        <button
          @click="showTransferModal = true"
          class="primary-button bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 text-white w-full sm:w-auto"
        >
          <Icon name="lucide:arrow-left-right" class="w-4 h-4" />
          مدیریت نقدینگی
        </button>
        <button
          @click="showCreateModal = true"
          class="primary-button w-full sm:w-auto"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          حساب جدید
        </button>
      </div>
    </div>

    <div v-if="accounts?.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="account in accounts"
        :key="account.id"
        class="surface group relative p-6 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-colors duration-150"
      >
        <div class="flex items-center justify-between mb-5">
          <div class="flex min-w-0 flex-1 items-center gap-3.5">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20 dark:ring-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Icon :name="account.icon" class="w-6 h-6" />
            </div>
            <div class="min-w-0">
              <h3 class="truncate font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">{{ account.name }}</h3>
              <p class="text-xs text-slate-400 font-medium">{{ account._count?.transactions || 0 }} تراکنش ثبت‌شده</p>
            </div>
          </div>
          <div class="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button
              @click="editAccount(account)"
              class="icon-button h-9 w-9 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="ویرایش"
            >
              <Icon name="lucide:pencil" class="w-4 h-4" />
            </button>
            <button
              @click="deleteAccount(account.id)"
              class="icon-button h-9 w-9 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="حذف"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <NuxtLink :to="`/accounts/${account.id}`" class="mt-6 block border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <div class="flex items-end justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs font-medium text-slate-400">موجودی فعلی</p>
              <p class="money mt-1 max-w-full break-words text-xl font-extrabold" :class="(account.balance || 0) >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'">{{ formatCurrency(account.balance || 0) }}</p>
            </div>
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 dark:bg-slate-800 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Icon name="lucide:arrow-up-left" class="h-4 w-4" />
            </div>
          </div>
        </NuxtLink>
      </article>
    </div>

    <div v-else class="empty-state">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
        <Icon name="lucide:landmark" class="w-7 h-7" />
      </div>
      <h3 class="font-bold text-slate-800 dark:text-slate-200">هنوز حسابی ایجاد نشده</h3>
      <p class="mt-1 text-xs text-slate-400">برای مدیریت درآمد و هزینه‌های خود، اولین حساب بانکی‌ات را بساز.</p>
    </div>

    <AccountCreateModal v-if="showCreateModal" @close="showCreateModal = false" @created="handleCreated" />
    <AccountEditModal v-if="showEditModal && selectedAccount" :account="selectedAccount" @close="showEditModal = false" @updated="handleUpdated" />
    <TransferModal v-if="showTransferModal" @close="showTransferModal = false" @created="handleTransferCreated" />
  </div>
</template>
