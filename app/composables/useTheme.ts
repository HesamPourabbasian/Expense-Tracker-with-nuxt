export type ThemeMode = 'system' | 'light' | 'dark'

export function useTheme() {
  const theme = useState<ThemeMode>('app-theme-mode', () => 'system')
  const isDark = useState<boolean>('app-is-dark', () => false)

  function applyTheme(targetMode: ThemeMode) {
    theme.value = targetMode
    if (import.meta.client) {
      try {
        localStorage.setItem('expense_tracker_theme', targetMode)
      } catch (e) {}

      let activeDark = false
      if (targetMode === 'dark') {
        activeDark = true
      } else if (targetMode === 'light') {
        activeDark = false
      } else {
        activeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      }

      isDark.value = activeDark
      if (activeDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.style.colorScheme = 'dark'
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.style.colorScheme = 'light'
      }
    }
  }

  function initTheme() {
    if (import.meta.client) {
      let stored: ThemeMode = 'system'
      try {
        const val = localStorage.getItem('expense_tracker_theme')
        if (val === 'dark' || val === 'light' || val === 'system') {
          stored = val
        }
      } catch (e) {}
      applyTheme(stored)

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = (e: MediaQueryListEvent) => {
        if (theme.value === 'system') {
          isDark.value = e.matches
          if (e.matches) {
            document.documentElement.classList.add('dark')
            document.documentElement.style.colorScheme = 'dark'
          } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.style.colorScheme = 'light'
          }
        }
      }
      mediaQuery.addEventListener('change', listener)
    }
  }

  function toggleTheme() {
    if (isDark.value) {
      applyTheme('light')
    } else {
      applyTheme('dark')
    }
  }

  return {
    theme,
    isDark,
    setTheme: applyTheme,
    toggleTheme,
    initTheme
  }
}
