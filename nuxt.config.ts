export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@pinia/nuxt'
  ],
  css: ['~/assets/css/main.css'],
  tailwindcss: {
    config: {
      content: [],
      theme: {
        extend: {
          fontFamily: {
            sans: ['Vazirmatn', 'sans-serif']
          },
           colors: {
             primary: {
              50: '#edf8f3',
              100: '#d5eee3',
              200: '#adddca',
              300: '#7ac4a9',
              400: '#48a886',
              500: '#278c6c',
              600: '#176f55',
              700: '#145945',
              800: '#124738',
              900: '#103b30'
            }
          }
        }
      }
    }
  },
  googleFonts: {
    families: {
      'Vazirmatn': [300, 400, 500, 600, 700]
    }
  },
  app: {
    pageTransition: { name: 'page-fade', mode: 'out-in' },
    head: {
      htmlAttrs: { dir: 'rtl', lang: 'fa' },
      title: 'خرج‌یار | مدیریت مالی شخصی',
      meta: [{ name: 'theme-color', content: '#176f55' }]
    }
  },
  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'default-secret'
  }
})
