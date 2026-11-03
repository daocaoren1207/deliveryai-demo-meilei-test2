import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ThemeMode } from '@/hooks/useThemeMode'

interface ThemeToggleProps {
  mode: ThemeMode
  onToggle: () => void
  compact?: boolean
  className?: string
}

export function ThemeToggle({ mode, onToggle, compact, className }: ThemeToggleProps) {
  const { t } = useTranslation()
  const nextMode = mode === 'dark' ? 'light' : 'dark'
  const Icon = nextMode === 'dark' ? Moon : Sun

  return (
    <Button
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      onClick={onToggle}
      className={cn(className)}
      aria-label={t(nextMode === 'dark' ? 'common.aria_theme_dark' : 'common.aria_theme_light')}
      aria-pressed={mode === 'dark'}
      title={t(nextMode === 'dark' ? 'common.aria_theme_dark' : 'common.aria_theme_light')}
    >
      <Icon size={compact ? 18 : 16} />
      {!compact && t(nextMode === 'dark' ? 'common.theme_dark' : 'common.theme_light')}
    </Button>
  )
}
