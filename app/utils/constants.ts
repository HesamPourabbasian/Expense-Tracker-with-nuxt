export const bankIcons = [
  { value: 'bank:blubank', label: 'بلوبانک', keywords: ['بلو', 'blu', 'سامان'] },
  { value: 'bank:wepod', label: 'ویپاد', keywords: ['ویپاد', 'wepod', 'پاد', 'ترابانک'] },
  { value: 'bank:melli', label: 'بانک ملی', keywords: ['ملی', 'bmi', 'بام'] },
  { value: 'bank:mellat', label: 'بانک ملت', keywords: ['ملت'] },
  { value: 'bank:saderat', label: 'بانک صادرات', keywords: ['صادرات', 'سپهر', 'bsi'] },
  { value: 'bank:tejarat', label: 'بانک تجارت', keywords: ['تجارت'] },
  { value: 'bank:sepah', label: 'بانک سپه', keywords: ['سپه', 'انصار', 'حکمت', 'قوامین', 'کوثر'] },
  { value: 'bank:pasargad', label: 'بانک پاسارگاد', keywords: ['پاسارگاد', 'bpi'] },
  { value: 'bank:saman', label: 'بانک سامان', keywords: ['سامان'] },
  { value: 'bank:parsian', label: 'بانک پارسیان', keywords: ['پارسیان'] },
  { value: 'bank:resalat', label: 'بانک رسالت', keywords: ['رسالت'] },
  { value: 'bank:mehriran', label: 'بانک مهر ایران', keywords: ['مهر ایران', 'مهر'] },
  { value: 'bank:keshavarzi', label: 'بانک کشاورزی', keywords: ['کشاورزی'] },
  { value: 'bank:maskan', label: 'بانک مسکن', keywords: ['مسکن'] },
  { value: 'bank:ayandeh', label: 'بانک آینده', keywords: ['آینده', 'آبانک'] },
  { value: 'bank:shahr', label: 'بانک شهر', keywords: ['شهر'] },
  { value: 'bank:refah', label: 'بانک رفاه', keywords: ['رفاه', 'کارگران'] },
  { value: 'bank:sina', label: 'بانک سینا', keywords: ['سینا'] },
  { value: 'bank:eghtesad', label: 'اقتصاد نوین', keywords: ['اقتصاد', 'نوین'] },
  { value: 'bank:dey', label: 'بانک دی', keywords: ['دی'] },
  { value: 'bank:karafarin', label: 'بانک کارآفرین', keywords: ['کارآفرین'] },
  { value: 'bank:gardeshgari', label: 'گردشگری', keywords: ['گردشگری', 'توبانک'] },
  { value: 'bank:sarmaye', label: 'بانک سرمایه', keywords: ['سرمایه'] },
  { value: 'bank:post', label: 'پست بانک', keywords: ['پست بانک', 'پست'] },
  { value: 'bank:sanatmadan', label: 'صنعت و معدن', keywords: ['صنعت', 'معدن'] },
  { value: 'bank:tosetaavon', label: 'توسعه تعاون', keywords: ['توسعه تعاون', 'تعاون'] },
  { value: 'bank:tosesaderat', label: 'توسعه صادرات', keywords: ['توسعه صادرات'] },
  { value: 'bank:iranzamin', label: 'ایران زمین', keywords: ['ایران زمین'] },
  { value: 'bank:khavarmianeh', label: 'خاورمیانه', keywords: ['خاورمیانه'] },
  { value: 'bank:central', label: 'بانک مرکزی', keywords: ['مرکزی'] },
  { value: 'bank:wallet', label: 'کیف پول / نقد', keywords: ['کیف', 'نقد', 'اسکناس', 'جیب', 'تنخواه'] },
  { value: 'bank:general', label: 'سایر / عمومی', keywords: ['سایر', 'حساب', 'عمومی', 'متفرقه'] }
]

export function detectBankIcon(accountName: string): string | null {
  if (!accountName || typeof accountName !== 'string') return null
  const clean = accountName.trim().toLowerCase()
  for (const bank of bankIcons) {
    if (clean.includes(bank.label.toLowerCase())) return bank.value
    if (bank.keywords) {
      for (const kw of bank.keywords) {
        if (clean.includes(kw.toLowerCase())) return bank.value
      }
    }
  }
  return null
}

export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]
