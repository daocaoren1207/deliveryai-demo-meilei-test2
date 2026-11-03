import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'theme-mode'
const DARK_QUERY = '(prefers-color-scheme: dark)'

interface ThemePreference {
  mode: ThemeMode
  manual: boolean
}

/**
 * 主题模式状态管理 hook。
 * 优先级：用户手动选择（localStorage）> 系统深浅色偏好 > 默认明亮。
 * localStorage 不可用时降级为内存态，不报错不阻塞。
 */
export function useThemeMode() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const initial = getInitialThemePreference()
    applyThemeMode(initial.mode)
    return initial
  })

  useEffect(() => {
    applyThemeMode(preference.mode)
  }, [preference.mode])

  useEffect(() => {
    if (preference.manual || !window.matchMedia) return
    const media = window.matchMedia(DARK_QUERY)
    const syncSystemTheme = (event: MediaQueryListEvent) => {
      setPreference({ mode: event.matches ? 'dark' : 'light', manual: false })
    }
    media.addEventListener('change', syncSystemTheme)
    return () => media.removeEventListener('change', syncSystemTheme)
  }, [preference.manual])

  const toggle = useCallback(() => {
    setPreference((prev) => {
      const next: ThemeMode = prev.mode === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // localStorage 不可用时降级为内存态，不报错
      }
      return { mode: next, manual: true }
    })
  }, [])

  return { mode: preference.mode, toggle }
}

function getInitialThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return { mode: stored, manual: true }
  } catch {
    // localStorage 不可用时继续按系统偏好或默认明亮
  }

  if (window.matchMedia?.(DARK_QUERY).matches) {
    return { mode: 'dark', manual: false }
  }
  return { mode: 'light', manual: false }
}

function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', mode === 'dark' ? '#211f1c' : '#fbf5ea')
  }
}
