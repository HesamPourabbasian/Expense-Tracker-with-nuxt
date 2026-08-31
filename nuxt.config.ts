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
  icon: {
    serverBundle: 'local',
    clientBundle: {
      scan: true,
      sizeLimitKb: 0,
      icons: [
        'lucide:landmark',
        'lucide:credit-card',
        'lucide:wallet',
        'lucide:wallet-cards',
        'lucide:piggy-bank',
        'lucide:vault',
        'lucide:coins',
        'lucide:hand-coins',
        'lucide:building-2',
        'lucide:briefcase',
        'lucide:badge-dollar-sign',
        'lucide:trending-up',
        'lucide:gem',
        'lucide:shield-check',
        'lucide:receipt',
        'lucide:gift',
        'lucide:sun',
        'lucide:moon',
        'lucide:monitor',
        'lucide:laptop'
      ]
    }
  },
  css: ['~/assets/css/main.css'],
  tailwindcss: {
    config: {
      darkMode: 'class',
      content: [],
      theme: {
        extend: {
          fontFamily: {
            sans: ['Vazirmatn', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            mono: ['Vazirmatn', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
          },
          colors: {
            primary: {
              50: '#ecfdf5',
              100: '#d1fae5',
              200: '#a7f3d0',
              300: '#6ee7b7',
              400: '#34d399',
              500: '#10b981',
              600: '#059669',
              700: '#047857',
              800: '#065f46',
              900: '#064e3b',
              950: '#022c22'
            }
          },
          boxShadow: {
            'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
            'card': '0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)',
            'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
            'glow': '0 0 20px -5px rgba(16, 185, 129, 0.25)'
          }
        }
      }
    }
  },
  googleFonts: {
    families: {
      'Vazirmatn': [400, 500, 600, 700, 800]
    },
    display: 'swap',
    prefetch: true,
    preconnect: true
  },
  app: {
    pageTransition: { name: 'page-fade', mode: 'out-in' },
    head: {
      htmlAttrs: { dir: 'rtl', lang: 'fa' },
      title: 'خرج‌یار | مدیریت مالی شخصی',
      meta: [{ name: 'theme-color', content: '#059669' }],
      script: [
        {
          innerHTML: `(function(){try{var stored=localStorage.getItem('expense_tracker_theme');var isDark=false;if(stored==='dark'){isDark=true;}else if(stored==='light'){isDark=false;}else{isDark=window.matchMedia('(prefers-color-scheme: dark)').matches;}if(isDark){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          type: 'text/javascript'
        }
      ]
    }
  },
  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'default-secret'
  }
})
