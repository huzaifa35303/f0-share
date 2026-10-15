import React from 'react'
import { X, Command } from 'lucide-react'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  const shortcuts = [
    { key: 'Ctrl + K', desc: 'Instant search across entire vault' },
    { key: 'Ctrl + V', desc: 'Paste image or file from clipboard to upload' },
    { key: 'U', desc: 'Switch to Upload dropzone' },
    { key: 'V', desc: 'Open Drive Vault file explorer' },
    { key: 'S', desc: 'Open Shared Links manager' },
    { key: 'A', desc: 'Open Superadmin Console (Admins only)' },
    { key: 'T', desc: 'Toggle next aesthetic theme' },
    { key: 'Esc', desc: 'Dismiss active preview or modal' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg card-base p-6 sm:p-7 space-y-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close shortcuts"
          className="absolute top-5 right-5 btn-secondary text-xs"
          style={{ padding: '0.4rem' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Command className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Keyboard Navigation &amp; Hotkeys
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              High-efficiency navigation hotkeys for power users.
            </p>
          </div>
        </div>

        <div
          className="divide-y rounded-xl border overflow-hidden"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-canvas)',
          }}
        >
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 text-xs"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span style={{ color: 'var(--text-main)' }}>{s.desc}</span>
              <kbd
                className="px-2 py-0.8 rounded font-mono text-[11px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--accent)',
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-center pt-1">
          <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            Press <kbd className="px-1.5 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>?</kbd> at any time to open this cheat sheet
          </p>
        </div>
      </div>
    </div>
  )
}
