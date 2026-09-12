import moment from 'jalali-moment'

const numberFormatter = new Intl.NumberFormat('fa-IR')

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
] as const

const jalaliCache = new Map<string, string>()
const MAX_CACHE_SIZE = 1000

export function useFormat() {
  function formatCurrency(amount: number): string {
    return numberFormatter.format(amount || 0) + ' تومان'
  }

  function formatNumber(amount: number): string {
    return numberFormatter.format(amount || 0)
  }

  function toJalali(date: Date | string): string {
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

  function getPersianDayName(date: Date | string): string {
    if (!date) return ''
    let m: moment.Moment
    if (typeof date === 'string' && /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(date.trim())) {
      m = moment(date.trim(), 'jYYYY/jMM/jDD')
    } else {
      m = moment(date)
    }
    return m.isValid() ? m.locale('fa').format('dddd') : ''
  }

  function toJalaliWithDay(date: Date | string): string {
    if (!date) return ''
    const day = getPersianDayName(date)
    const jalali = toJalali(date)
    return day ? `${day}، ${jalali}` : jalali
  }

  function toGregorian(jalaliDate: string): Date {
    return moment(jalaliDate, 'jYYYY/jMM/jDD').toDate()
  }

  function getPersianMonthName(month: number): string {
    return PERSIAN_MONTHS[month - 1] ?? ''
  }

  function getCurrentJalaliMonth(): { year: number; month: number } {
    const now = moment()
    return {
      year: parseInt(now.format('jYYYY')),
      month: parseInt(now.format('jMM'))
    }
  }

  return {
    formatCurrency,
    formatNumber,
    toJalali,
    toJalaliWithDay,
    getPersianDayName,
    toGregorian,
    getPersianMonthName,
    getCurrentJalaliMonth
  }
}
