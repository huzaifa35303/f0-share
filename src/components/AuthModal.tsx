import React, { useState, useEffect } from 'react'
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { authService } from '../services/authService'
import { User } from '../types'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: User) => void
  initialMode?: 'login' | 'signup'
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [issuedCode, setIssuedCode] = useState<string | null>(null)
  const [isSupabaseMail, setIsSupabaseMail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Listen for automatic email verification (e.g. user clicked confirmation link in Supabase email)
  useEffect(() => {
    if (!isOpen) return
    const unsub = authService.onAuthStateChange((user) => {
      if (user && user.isVerified) {
        onAuthSuccess(user)
        onClose()
      }
    })
    return unsub
  }, [isOpen, onAuthSuccess, onClose])

  if (!isOpen) return null

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const res = await authService.login(email, password)
        if (res.success && res.user) {
          onAuthSuccess(res.user)
          onClose()
        } else if (res.requiresVerification) {
          setMode('verify')
          if (res.email) setEmail(res.email)
          if (res.isSupabaseMail) setIsSupabaseMail(true)
          if (res.verificationCode) setIssuedCode(res.verificationCode)
          setInfoMessage(
            res.isSupabaseMail
              ? 'Verification required. We sent an official confirmation email via Supabase to ' + (res.email || email) + '.'
              : 'Account requires email verification. Enter the 6-digit code below.'
          )
        } else {
          setError(res.error || 'Failed to authenticate.')
        }
      } else if (mode === 'signup') {
        const res = await authService.signup(name, email, password)
        if (res.success && res.requiresVerification) {
          setMode('verify')
          if (res.email) setEmail(res.email)
          if (res.isSupabaseMail) setIsSupabaseMail(true)
          if (res.verificationCode) setIssuedCode(res.verificationCode)
          setInfoMessage(
            res.isSupabaseMail
              ? `Verification email dispatched via Supabase to ${res.email}. Check your inbox or enter your 6-digit code.`
              : `Verification code dispatched to ${res.email}. Enter the 6 digits to activate your account.`
          )
        } else {
          setError(res.error || 'Failed to create account.')
        }
      } else if (mode === 'verify') {
        if (!verificationCode || verificationCode.trim().length < 6) {
          setError('Please enter the complete 6-digit verification code.')
          setLoading(false)
          return
        }

        const res = await authService.verifyEmailCode(email, verificationCode.trim())
        if (res.success && res.user) {
          onAuthSuccess(res.user)
          onClose()
        } else {
          setError(res.error || 'Verification failed. Please check the code.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle Resend Verification Code
  const handleResendCode = async () => {
    if (!email) {
      setError('Please provide your email address.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await authService.resendVerificationCode(email)
      if (res.isSupabaseMail) {
        setIsSupabaseMail(true)
        setInfoMessage(`A fresh confirmation email has been dispatched via Supabase to ${email}.`)
      } else if (res.verificationCode) {
        setIssuedCode(res.verificationCode)
        setInfoMessage(`A fresh 6-digit code has been generated for ${email}.`)
      } else {
        setInfoMessage(`Verification notification sent to ${email}.`)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md card-base p-6 sm:p-7 space-y-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-5 right-5 btn-secondary text-xs cursor-pointer"
          style={{ padding: '0.4rem' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium mb-1"
            style={{
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Vault Security Protocol</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            {mode === 'login'
              ? 'Sign In to Your Vault'
              : mode === 'signup'
              ? 'Create Sovereign Account'
              : 'Verify Your Email Address'}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {mode === 'login'
              ? 'Sign in to access your persistent drive, save files, and manage dispatches.'
              : mode === 'signup'
              ? 'Register your account. Email verification is mandatory before files can be saved.'
              : `Enter the 6-digit verification code to activate your vault for ${email}.`}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only visible when not verifying) */}
        {mode !== 'verify' && (
          <div
            className="flex p-1 rounded-lg border text-xs font-semibold"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
                setInfoMessage(null)
              }}
              className="flex-1 py-1.5 rounded text-center transition-all cursor-pointer"
              style={{
                backgroundColor: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
                color: mode === 'login' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
                setInfoMessage(null)
              }}
              className="flex-1 py-1.5 rounded text-center transition-all cursor-pointer"
              style={{
                backgroundColor: mode === 'signup' ? 'var(--bg-surface)' : 'transparent',
                color: mode === 'signup' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: mode === 'signup' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Supabase Official Email Verification Dispatched Card */}
        {mode === 'verify' && isSupabaseMail && (
          <div
            className="p-4 rounded-xl border space-y-2.5 animate-in fade-in"
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              borderColor: 'rgba(56, 189, 248, 0.35)',
            }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#38bdf8' }}>
              <Mail className="w-4 h-4" />
              <span>Official Supabase Verification Email Sent</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              An authentication email was dispatched to <strong style={{ color: 'var(--text-main)' }}>{email}</strong> by Supabase Mailer.
            </p>
            <div
              className="text-[11px] space-y-2 pt-2 border-t"
              style={{ borderColor: 'rgba(56, 189, 248, 0.2)' }}
            >
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 bg-sky-500/20 text-sky-300">
                  1
                </span>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-main)' }}>Click Confirmation Link: </span>
                  <span style={{ color: 'var(--text-muted)' }}>Click the button inside the email to activate this account automatically.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 bg-sky-500/20 text-sky-300">
                  2
                </span>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-main)' }}>Or Enter 6-Digit OTP: </span>
                  <span style={{ color: 'var(--text-muted)' }}>Type the 6-digit code from the email into the input below and click Verify.</span>
                </div>
              </div>
            </div>
            {issuedCode && (
              <div className="pt-1 flex items-center justify-between text-[10px] border-t" style={{ borderColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--text-muted)' }}>
                <span>Dual-engine backup token:</span>
                <button
                  type="button"
                  onClick={() => setVerificationCode(issuedCode)}
                  className="font-mono text-sky-400 hover:underline cursor-pointer"
                >
                  Fill Backup Code ({issuedCode})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Offline / Local Fallback Helper (when Supabase mail is not active) */}
        {mode === 'verify' && !isSupabaseMail && issuedCode && (
          <div
            className="p-3.5 rounded-lg border space-y-1.5 animate-in fade-in"
            style={{
              backgroundColor: 'var(--accent-muted)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              <Sparkles className="w-4 h-4" />
              <span>Offline / Local Verification Token</span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              A verification code was generated for <strong style={{ color: 'var(--text-main)' }}>{email}</strong>:
            </p>
            <div className="flex items-center justify-between pt-1">
              <span
                className="text-base font-mono font-bold tracking-widest px-3 py-1 rounded"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-focus)',
                }}
              >
                {issuedCode}
              </span>
              <button
                type="button"
                onClick={() => setVerificationCode(issuedCode)}
                className="text-[11px] underline font-mono cursor-pointer"
                style={{ color: 'var(--text-main)' }}
              >
                Auto-fill Code
              </button>
            </div>
          </div>
        )}

        {/* Info Message */}
        {infoMessage && (
          <div
            className="p-3 rounded-lg border flex items-center gap-2 text-xs font-mono animate-in fade-in"
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
            }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            className="p-3 rounded-lg border flex items-center gap-2 text-xs font-mono animate-in fade-in"
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

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                Full Name
              </label>
              <div className="relative">
                <UserIcon
                  className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-clean w-full pl-9"
                />
              </div>
            </div>
          )}

          {mode !== 'verify' && (
            <>
              <div className="space-y-1">
                <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="user@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-clean w-full pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold" style={{ color: 'var(--text-main)' }}>
                    Password
                  </label>
                  {mode === 'login' && (
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      Min. 4 characters
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-clean w-full pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-xs cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* VERIFY MODE: 6-DIGIT CODE INPUT */}
          {mode === 'verify' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  6-Digit Verification Token
                </label>
                <div className="relative">
                  <KeyRound
                    className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="input-clean w-full pl-9 font-mono tracking-widest text-center text-sm font-bold"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="flex items-center gap-1 font-mono text-[11px] hover:underline cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resend Verification Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                  className="text-[11px] font-mono hover:underline cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Change Email
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs font-semibold mt-2 cursor-pointer"
          >
            <span>
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In to Vault'
                : mode === 'signup'
                ? 'Create Account & Issue Code'
                : 'Verify & Activate Vault'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Persistent Storage Policy Notice */}
        <div
          className="p-3 rounded-lg border text-[11px] space-y-1"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          <p className="font-semibold" style={{ color: 'var(--text-main)' }}>
            🔒 Sovereign Storage Policy:
          </p>
          <p>
            Files uploaded by verified, signed-in users are permanently saved to personal storage. Unauthenticated guest uploads are strictly ephemeral and will not be preserved.
          </p>
        </div>
      </div>
    </div>
  )
}
