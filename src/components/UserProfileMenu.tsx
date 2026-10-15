import React, { useState, useRef, useEffect } from 'react'
import {
  User as UserIcon,
  ShieldAlert,
  LogOut,
  ChevronDown,
  HardDrive,
  Crown,
  UserCheck,
  Zap,
} from 'lucide-react'
import { User, ViewTab } from '../types'
import { authService } from '../services/authService'
import { formatBytes } from '../utils/formatters'

interface UserProfileMenuProps {
  currentUser: User | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
  onUserChanged: (user: User | null) => void
  onNavigateTab: (tab: ViewTab) => void
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  onOpenAuth,
  onUserChanged,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!currentUser) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onOpenAuth('login')}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <span>Sign In</span>
        </button>
        <button
          onClick={() => onOpenAuth('signup')}
          className="btn-primary text-xs py-1.5 px-3"
        >
          <span>Sign Up</span>
        </button>
      </div>
    )
  }

  const isAdmin = currentUser.role === 'admin'
  const quotaPercent = Math.min(
    100,
    Math.round(((currentUser.usedBytes || 0) / (currentUser.quotaBytes || 1)) * 100)
  )

  const handleLogout = () => {
    authService.logout()
    onUserChanged(null)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border transition-all cursor-pointer"
        style={{
          backgroundColor: isOpen ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
          borderColor: isOpen ? 'var(--border-focus)' : 'var(--border-subtle)',
        }}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs"
          style={{
            backgroundColor: isAdmin ? 'var(--accent)' : 'var(--bg-canvas)',
            color: isAdmin ? 'var(--accent-contrast)' : 'var(--text-main)',
            border: isAdmin ? 'none' : '1px solid var(--border-subtle)',
          }}
        >
          {currentUser.avatar || currentUser.name.charAt(0).toUpperCase()}
        </div>

        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold max-w-[110px] truncate" style={{ color: 'var(--text-main)' }}>
              {currentUser.name}
            </span>
            {isAdmin && (
              <span
                className="text-[9px] font-mono px-1 py-0.2 rounded font-bold"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                ADMIN
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className="w-3.5 h-3.5 transition-transform"
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 card-base p-4 space-y-3.5 z-50 animate-slide-down duration-150"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-strong)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.65)',
          }}
        >
          {/* User Identification */}
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-sm"
              style={{
                backgroundColor: isAdmin ? 'var(--accent)' : 'var(--bg-canvas)',
                color: isAdmin ? 'var(--accent-contrast)' : 'var(--text-main)',
                border: isAdmin ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              {currentUser.avatar || currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>
                  {currentUser.name}
                </span>
                <span
                  className="text-[9px] font-mono px-1 rounded uppercase tracking-wider font-semibold"
                  style={{
                    backgroundColor: isAdmin ? 'var(--accent-muted)' : 'rgba(255,255,255,0.06)',
                    color: isAdmin ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[11px] truncate font-mono" style={{ color: 'var(--text-muted)' }}>
                {currentUser.email}
              </p>
            </div>
          </div>

          {/* Personal Storage Quota Bar */}
          <div
            className="p-3 rounded-lg border space-y-2"
            style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <HardDrive className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span>Storage Quota</span>
              </span>
              <span className="font-semibold" style={{ color: 'var(--text-main)' }}>
                {quotaPercent}%
              </span>
            </div>

            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(quotaPercent, 2)}%`,
                  backgroundColor: 'var(--accent)',
                }}
              />
            </div>

            <p className="text-[10px] font-mono" style={{ color: 'var(--text-faint)' }}>
              {formatBytes(currentUser.usedBytes || 0)} used of {formatBytes(currentUser.quotaBytes)}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-1 text-xs">
            {isAdmin ? (
              <button
                onClick={() => {
                  onNavigateTab('admin')
                  setIsOpen(false)
                }}
                className="w-full p-2 rounded-md text-left flex items-center gap-2 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                <Crown className="w-4 h-4" />
                <span className="font-semibold">Executive Admin Console</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onNavigateTab('admin')
                  setIsOpen(false)
                }}
                className="w-full p-2 rounded-md text-left flex items-center gap-2 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer text-xs"
                style={{ color: 'var(--accent)' }}
              >
                <Crown className="w-4 h-4" />
                <span>Admin Portal Login</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full p-2 rounded-md text-left flex items-center gap-2 hover:bg-rose-500/10 text-rose-400 transition-colors cursor-pointer text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
