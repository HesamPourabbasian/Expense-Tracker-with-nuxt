import moment from 'jalali-moment'

const numberFormatter = new Intl.NumberFormat('fa-IR')

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
] as const

export function useFormat() {
  function formatCurrency(amount: number): string {
    return numberFormatter.format(amount || 0) + ' تومان'
  }

  function formatNumber(amount: number): string {
    return numberFormatter.format(amount || 0)
  }

  function toJalali(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return moment(d).format('jYYYY/jMM/jDD')
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
    toGregorian,
    getPersianMonthName,
    getCurrentJalaliMonth
  }
}
