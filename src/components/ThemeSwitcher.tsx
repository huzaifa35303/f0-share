import React from 'react'
import { Palette, Check } from 'lucide-react'
import { AppTheme } from '../types'

interface ThemeSwitcherProps {
  currentTheme: AppTheme
  onThemeChange: (theme: AppTheme) => void
}

export const themesConfig: {
  id: AppTheme
  name: string
  subtitle: string
  colors: string[]
  isDark: boolean
}[] = [
  {
    id: 'slate',
    name: 'Studio Slate & Gold',
    subtitle: 'Deep obsidian canvas with brushed champagne accent',
    colors: ['#090c10', '#12161e', '#e5a950'],
    isDark: true,
  },
  {
    id: 'monochrome',
    name: 'Graphite Noir',
    subtitle: 'Pure OLED black and architectural crisp monochrome',
    colors: ['#000000', '#16161a', '#ffffff'],
    isDark: true,
  },
  {
    id: 'light',
    name: 'Bone Alabaster',
    subtitle: 'Crisp editorial daylight with slate typography',
    colors: ['#f6f7f9', '#ffffff', '#0f172a'],
    isDark: false,
  },
]

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme,
  onThemeChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
        <Palette className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <span>Interface Aesthetic</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {themesConfig.map((t) => {
          const isActive = currentTheme === t.id
          return (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className="p-3 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer"
              style={{
                backgroundColor: isActive ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                borderColor: isActive ? 'var(--border-focus)' : 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Color swatches */}
                <div className="flex -space-x-1.5 shrink-0">
                  {t.colors.map((c, i) => (
                    <span
                      key={i}
                      style={{ backgroundColor: c }}
                      className="w-4 h-4 rounded-full border border-black/30 shadow-sm"
                    />
                  ))}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                      {t.name}
                    </span>
                    {!t.isDark && (
                      <span
                        className="text-[9px] font-mono px-1 py-0.2 rounded"
                        style={{
                          backgroundColor: 'var(--accent-muted)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        Light
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{t.subtitle}</p>
                </div>
              </div>

              {isActive && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-2"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
