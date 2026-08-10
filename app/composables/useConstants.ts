export function useConstants() {
  const bankIcons = [
    { value: 'bx:bx-bank', label: 'بانک' },
    { value: 'bx:bx-wallet', label: 'کیف پول' },
    { value: 'bx:bx-money', label: 'پول' },
    { value: 'bx:bx-credit-card', label: 'کارت بانکی' },
    { value: 'bx:bx-pie-chart-alt', label: 'نمودار' },
    { value: 'bx:bx-savings', label: 'پس‌انداز' },
    { value: 'bx:bx-safe', label: 'صندوق' },
    { value: 'bx:bx-dollar', label: 'دلار' },
    { value: 'bx:bx-gift', label: 'هدیه' },
    { value: 'bx:bx-briefcase', label: 'کیف کاری' },
    { value: 'bx:bx-home', label: 'خانه' },
    { value: 'bx:bx-car', label: 'خودرو' }
  ]

  const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]

  return { bankIcons, PERSIAN_MONTHS }
}
