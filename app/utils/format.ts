import moment from 'jalali-moment'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount)
}

export function toJalali(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return moment(d).format('jYYYY/jMM/jDD')
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
