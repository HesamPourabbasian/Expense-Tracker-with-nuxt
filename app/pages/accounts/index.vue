<script setup lang="ts">
import type { BankAccount } from '~/types'

const toast = useToast()
const showCreateModal = ref(false)
const showEditModal = ref(false)
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

async function handleUpdated() {
  showEditModal.value = false
  selectedAccount.value = null
  await refresh()
  toast.success('حساب با موفقیت ویرایش شد')
}
</script>

<template>
  <div class="page-shell">
    <div class="flex items-end justify-between gap-4">
      <div><h1 class="page-heading">حساب‌های بانکی</h1><p class="page-kicker">موجودی و تراکنش‌های هر حساب را مدیریت کن.</p></div>
      <button
        @click="showCreateModal = true"
        class="primary-button"
      >
        <Icon name="bx:bx-plus" class="w-4 h-4" />
        حساب جدید
      </button>
    </div>

    <div v-if="accounts?.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="account in accounts"
        :key="account.id"
        class="surface group p-5 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
              <Icon :name="account.icon" class="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">{{ account.name }}</h3>
              <p class="text-xs text-gray-400">{{ account._count?.transactions || 0 }} تراکنش</p>
            </div>
          </div>
          <div class="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button
              @click="editAccount(account)"
              class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="bx:bx-edit" class="w-4 h-4" />
            </button>
            <button
              @click="deleteAccount(account.id)"
              class="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Icon name="bx:bx-trash" class="w-4 h-4" />
            </button>
          </div>
        </div>
        <NuxtLink :to="`/accounts/${account.id}`" class="mt-6 block border-t border-gray-100 pt-4">
          <div class="flex items-end justify-between gap-2"><div><p class="text-xs text-gray-400">موجودی فعلی</p><p class="mt-1 text-xl font-bold" :class="(account.balance || 0) >= 0 ? 'text-gray-950' : 'text-rose-600'">{{ formatCurrency(account.balance || 0) }}</p></div><Icon name="lucide:arrow-up-left" class="h-5 w-5 text-gray-300 transition group-hover:text-primary-600" /></div>
        </NuxtLink>
      </article>
    </div>

    <div v-else class="empty-state">
      <Icon name="bx:bx-bank" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">هنوز حسابی ایجاد نشده</p>
    </div>

    <AccountCreateModal v-if="showCreateModal" @close="showCreateModal = false" @created="handleCreated" />
    <AccountEditModal v-if="showEditModal && selectedAccount" :account="selectedAccount" @close="showEditModal = false" @updated="handleUpdated" />
  </div>
</template>
