import React, { useState } from 'react'
import {
  Crown,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
} from 'lucide-react'
import { authService } from '../services/authService'
import { User } from '../types'

interface AdminAuthGateProps {
  onSuccess: (adminUser: User) => void
  onCancel: () => void
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await authService.verifyAdminLogin(email, password)
      if (res.success && res.user) {
        onSuccess(res.user)
      } else {
        setError(res.error || 'Access Denied: Incorrect custom admin email or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 animate-in fade-in zoom-in-95 duration-200">
      <div
        className="card-base p-6 sm:p-8 space-y-6 border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header Badge & Title */}
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border shadow-lg"
            style={{
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
              borderColor: 'var(--accent)',
            }}
          >
            <Crown className="w-7 h-7" />
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold"
            style={{
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Restricted Governance Perimeter</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
            Admin Portal Access
          </h2>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            The executive governance console is restricted. You must authenticate with the configured custom admin email and master password.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="p-3.5 rounded-lg border flex items-center gap-2 text-xs font-mono animate-in fade-in"
            style={{
              backgroundColor: 'rgba(248, 81, 73, 0.1)',
              borderColor: 'rgba(248, 81, 73, 0.3)',
              color: 'var(--danger)',
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
              Authorized Custom Admin Email
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 absolute left-3 top-3 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="email"
                required
                placeholder="custom-admin@f0.vault"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-clean w-full pl-9 py-2.5 font-mono"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold" style={{ color: 'var(--text-main)' }}>
                Admin Master Password
              </label>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                Protected Entry
              </span>
            </div>
            <div className="relative">
              <KeyRound
                className="w-4 h-4 absolute left-3 top-3 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-clean w-full pl-9 pr-9 py-2.5 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-xs cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs font-bold cursor-pointer"
          >
            <span>{loading ? 'Verifying Admin Credentials...' : 'Unlock Governance Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Back Button */}
        <div className="pt-2 text-center border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Personal Vault</span>
          </button>
        </div>
      </div>
    </div>
  )
}
