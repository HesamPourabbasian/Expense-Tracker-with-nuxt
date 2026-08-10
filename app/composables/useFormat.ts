import moment from 'jalali-moment'

export function useFormat() {
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
  }

  function formatNumber(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount)
  }

  function toJalali(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return moment(d).format('jYYYY/jMM/jDD')
  }

  function toGregorian(jalaliDate: string): Date {
    return moment(jalaliDate, 'jYYYY/jMM/jDD').toDate()
  }

  function getPersianMonthName(month: number): string {
    const months = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ]
    return months[month - 1] ?? ''
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
