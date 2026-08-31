import moment from 'jalali-moment'

const numberFormatter = new Intl.NumberFormat('fa-IR')

const jalaliCache = new Map<string, string>()
const MAX_CACHE_SIZE = 1000

export function formatCurrency(amount: number): string {
  return numberFormatter.format(amount || 0) + ' تومان'
}

export function formatNumber(amount: number): string {
  return numberFormatter.format(amount || 0)
}

export function toJalali(date: Date | string): string {
  if (!date) return ''
  const key = typeof date === 'string' ? date : date.toISOString()
  const cached = jalaliCache.get(key)
  if (cached) return cached

  const d = typeof date === 'string' ? new Date(date) : date
  const formatted = moment(d).format('jYYYY/jMM/jDD')
  if (jalaliCache.size > MAX_CACHE_SIZE) {
    jalaliCache.clear()
  }
  jalaliCache.set(key, formatted)
  return formatted
}

export function toGregorian(jalaliDate: string): Date {
  return moment(jalaliDate, 'jYYYY/jMM/jDD').toDate()
}

export function getPersianMonthName(month: number): string {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]
  return months[month - 1] ?? ''
}

export function getCurrentJalaliMonth(): { year: number; month: number } {
  const now = moment()
  return {
    year: parseInt(now.format('jYYYY')),
    month: parseInt(now.format('jMM'))
  }
}
