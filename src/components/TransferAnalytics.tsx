import React from 'react'
import {
  ShieldCheck,
  Clock,
  Lock,
  TrendingUp,
  HardDrive,
  Trash2,
  Activity,
  Server,
  Zap,
} from 'lucide-react'
import { FileRecord, StorageStats } from '../types'
import { formatBytes } from '../utils/formatters'
import { StorageMeter } from './StorageMeter'

interface TransferAnalyticsProps {
  files: FileRecord[]
  stats: StorageStats
  onPurgeExpired: () => void
}

export const TransferAnalytics: React.FC<TransferAnalyticsProps> = ({
  files,
  stats,
  onPurgeExpired,
}) => {
  const protectedCount = files.filter((f) => f.isPasswordProtected).length
  const expiringCount = files.filter((f) => f.expiresAt !== null).length
  const permanentCount = files.length - expiringCount

  const expiredCount = files.filter((f) => {
    if (!f.expiresAt) return false
    return new Date(f.expiresAt).getTime() < Date.now()
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Workspace Telemetry
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Vault Health &amp; Security Protocols
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Monitor real-time storage allocations, passkey encryption levels, and ephemeral auto-expiration rules.
          </p>
        </div>

        {expiredCount > 0 && (
          <button
            onClick={onPurgeExpired}
            className="btn-secondary text-xs shrink-0"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger-muted)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge {expiredCount} Expired Asset{expiredCount > 1 ? 's' : ''}</span>
          </button>
        )}
      </div>

      {/* Storage Capacity Segmented Meter */}
      <StorageMeter stats={stats} />

      {/* 4 Signal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Deposit */}
        <div
          className="card-base p-4 relative overflow-hidden"
          style={{ borderTop: '2px solid var(--accent)' }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Total Storage
            </span>
            <HardDrive className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-main)' }}>
            {formatBytes(stats.totalBytes)}
          </p>
          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
            {stats.fileCount} assets cataloged
          </p>
        </div>

        {/* Card 2: Transfers Served */}
        <div
          className="card-base p-4 relative overflow-hidden"
          style={{ borderTop: '2px solid var(--accent)' }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Transfers Served
            </span>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-main)' }}>
            {stats.downloadCount}
          </p>
          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--accent)' }}>
            Direct streaming throughput
          </p>
        </div>

        {/* Card 3: Passkey Protected */}
        <div
          className="card-base p-4 relative overflow-hidden"
          style={{ borderTop: '2px solid var(--accent)' }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Passkey Protected
            </span>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-main)' }}>
            {protectedCount}
          </p>
          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
            {stats.fileCount > 0 ? Math.round((protectedCount / stats.fileCount) * 100) : 0}% encrypted
          </p>
        </div>

        {/* Card 4: Ephemeral Timers */}
        <div
          className="card-base p-4 relative overflow-hidden"
          style={{ borderTop: '2px solid var(--accent)' }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Auto-Expiry Timers
            </span>
            <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-main)' }}>
            {expiringCount}
          </p>
          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
            {permanentCount} permanent assets
          </p>
        </div>
      </div>

      {/* Security & Data Hygiene Details */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
              Security &amp; Data Hygiene Standards
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Enterprise cryptographic specifications applied to all transfers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div
            className="p-3.5 rounded-lg border space-y-1.5"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                Zero Ad Surveillance
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              No third-party trackers, ad scripts, or behavioral cookies. Transfers execute unthrottled and clean.
            </p>
          </div>

          <div
            className="p-3.5 rounded-lg border space-y-1.5"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                Client-Side SHA-256
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Passkey hashes are evaluated client-side via subtle Web Crypto API before granting access tokens.
            </p>
          </div>

          <div
            className="p-3.5 rounded-lg border space-y-1.5"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                Dual-Engine Redundancy
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Immediate offline IndexedDB binary storage with seamless upgrade path to Supabase Cloud Storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
