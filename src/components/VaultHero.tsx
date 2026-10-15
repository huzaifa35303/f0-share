import React from 'react'
import {
  UploadCloud,
  FolderLock,
  ShieldCheck,
  Zap,
  HardDrive,
  Database,
  ArrowRight,
} from 'lucide-react'
import { StorageStats, User } from '../types'
import { formatBytes } from '../utils/formatters'

interface VaultHeroProps {
  onGoToUpload: () => void
  onGoToExplorer: () => void
  onOpenSettings: () => void
  stats: StorageStats
  isSupabase: boolean
  currentUser?: User | null
}

export const VaultHero: React.FC<VaultHeroProps> = ({
  onGoToUpload,
  onGoToExplorer,
  onOpenSettings,
  stats,
  isSupabase,
  currentUser,
}) => {
  const isAdmin = currentUser?.role === 'admin'
  const quotaPercent = currentUser?.quotaBytes
    ? Math.min(100, Math.round(((currentUser.usedBytes || 0) / currentUser.quotaBytes) * 100))
    : 0

  return (
    <div className="w-full max-w-7xl mx-auto pt-2 pb-2 animate-fade-in">
      {/* Product Banner */}
      <div
        className="card-base p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-canvas) 100%)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Ambient Decorative Glow */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none opacity-15 blur-3xl"
          style={{ background: 'var(--accent)' }}
        />

        <div className="max-w-3xl space-y-4 relative z-10">
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium"
            style={{
              backgroundColor: 'var(--accent-muted)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--accent)',
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Sovereign File Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
            High-Speed File Transfer &amp; <span style={{ color: 'var(--accent)' }}>Storage Vault</span>
          </h1>

          <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
            Deposit, encrypt, and dispatch files with instant unthrottled streaming links, client-side SHA-256 passkeys, and direct integration with your private Supabase database or local device memory.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button onClick={onGoToUpload} className="btn-primary">
              <UploadCloud className="w-4 h-4" />
              <span>Deposit Files</span>
            </button>

            <button onClick={onGoToExplorer} className="btn-secondary">
              <FolderLock className="w-4 h-4" />
              <span>Open Drive Vault</span>
            </button>

            {isAdmin && (
              <button onClick={onOpenSettings} className="btn-secondary text-xs">
                <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{isSupabase ? 'Supabase Active' : 'Connect Supabase'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Row (Tailored for Admin vs Normal User) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 mt-8 border-t border-[var(--border-subtle)] text-xs font-mono">
          {isAdmin ? (
            <>
              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>ACTIVE STORAGE</span>
                <p className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{formatBytes(stats.totalBytes)}</p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>CATALOGED ASSETS</span>
                <p className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{stats.fileCount} items</p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>TRANSFERS SERVED</span>
                <p className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{stats.downloadCount}</p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>SYSTEM SECURITY</span>
                <p className="text-lg font-bold flex items-center gap-1" style={{ color: 'var(--success)' }}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dual Engine</span>
                </p>
              </div>
            </>
          ) : currentUser ? (
            <>
              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>MY VAULT USAGE</span>
                <p className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  {formatBytes(currentUser.usedBytes || 0)}
                  <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}> / {formatBytes(currentUser.quotaBytes || 15 * 1024 * 1024 * 1024)}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>MY STORED ASSETS</span>
                <p className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{currentUser.fileCount || 0} items</p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>PERSONAL QUOTA</span>
                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{quotaPercent}% Used</p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>ACCOUNT STATUS</span>
                <p className="text-lg font-bold flex items-center gap-1" style={{ color: 'var(--success)' }}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Member</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-amber-400">SESSION MODE</span>
                <p className="text-lg font-bold text-amber-400">Guest Mode</p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>VAULT PERSISTENCE</span>
                <p className="text-lg font-bold text-rose-400">Not Saved</p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>FILE RETENTION</span>
                <p className="text-lg font-bold text-[var(--text-muted)]">Ephemeral</p>
              </div>

              <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] tracking-wider uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>SAVED ASSETS</span>
                <p className="text-lg font-bold text-[var(--accent)]">Sign In Required</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
