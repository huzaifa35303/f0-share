import React from 'react'
import {
  UploadCloud,
  FolderLock,
  Share2,
  Search,
  Sun,
  Moon,
  Sparkles,
  Crown,
} from 'lucide-react'
import { AppTheme, StorageStats, ViewTab, User } from '../types'
import { UserProfileMenu } from './UserProfileMenu'

interface NavbarProps {
  currentTab: ViewTab
  onTabChange: (tab: ViewTab) => void
  stats: StorageStats
  currentTheme: AppTheme
  onCycleTheme: () => void
  currentUser: User | null
  onOpenAuth: (mode?: 'login' | 'signup') => void
  onUserChanged: (user: User | null) => void
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  stats,
  currentTheme,
  onCycleTheme,
  currentUser,
  onOpenAuth,
  onUserChanged,
}) => {
  const isAdmin = currentUser?.role === 'admin'

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-all duration-200">
      {/* Top Luminous Accent Edge for razor-sharp visual boundary */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div
          onClick={() => onTabChange('upload')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-md"
            style={{
              backgroundColor: 'var(--accent-muted)',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
            }}
          >
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight" style={{ color: 'var(--text-main)' }}>
                f0 <span style={{ color: 'var(--accent)' }} className="font-black">/</span> Vault
              </span>
              <span
                className="badge font-bold shadow-sm"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                v2.0
              </span>
            </div>
            <p className="text-[11px] font-mono tracking-wide hidden sm:block font-medium" style={{ color: 'var(--text-muted)' }}>
              Sovereign Encrypted File Platform
            </p>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <nav
          className="hidden md:flex items-center gap-1.5 p-1 rounded-xl border shadow-inner"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-strong)',
          }}
        >
          <button
            onClick={() => onTabChange('upload')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
            style={{
              backgroundColor: currentTab === 'upload' ? 'var(--accent)' : 'transparent',
              color: currentTab === 'upload' ? 'var(--accent-contrast)' : 'var(--text-muted)',
              boxShadow: currentTab === 'upload' ? '0 2px 8px var(--accent-muted)' : 'none',
              transform: currentTab === 'upload' ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Drop &amp; Ingest</span>
          </button>

          <button
            onClick={() => onTabChange('explorer')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
            style={{
              backgroundColor: currentTab === 'explorer' ? 'var(--accent)' : 'transparent',
              color: currentTab === 'explorer' ? 'var(--accent-contrast)' : 'var(--text-muted)',
              boxShadow: currentTab === 'explorer' ? '0 2px 8px var(--accent-muted)' : 'none',
              transform: currentTab === 'explorer' ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <FolderLock className="w-3.5 h-3.5" />
            <span>Drive Vault</span>
            {stats.fileCount > 0 && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold"
                style={{
                  backgroundColor: currentTab === 'explorer' ? 'rgba(0,0,0,0.3)' : 'var(--bg-canvas)',
                  color: currentTab === 'explorer' ? 'var(--accent-contrast)' : 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {stats.fileCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('shared')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
            style={{
              backgroundColor: currentTab === 'shared' ? 'var(--accent)' : 'transparent',
              color: currentTab === 'shared' ? 'var(--accent-contrast)' : 'var(--text-muted)',
              boxShadow: currentTab === 'shared' ? '0 2px 8px var(--accent-muted)' : 'none',
              transform: currentTab === 'shared' ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Active Dispatches</span>
          </button>

          {/* Admin Console Tab (Prompts custom email & password gate if not authenticated) */}
          <button
            onClick={() => onTabChange('admin')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
            style={{
              backgroundColor: currentTab === 'admin' ? 'var(--accent)' : isAdmin ? 'var(--accent-muted)' : 'transparent',
              color: currentTab === 'admin' ? 'var(--accent-contrast)' : isAdmin ? 'var(--accent)' : 'var(--text-muted)',
              border: isAdmin || currentTab === 'admin' ? '1px solid var(--border-strong)' : 'none',
              boxShadow: currentTab === 'admin' ? '0 2px 8px var(--accent-muted)' : 'none',
              transform: currentTab === 'admin' ? 'scale(1.02)' : 'scale(1)',
            }}
            title={isAdmin ? 'Executive Governance Console' : 'Admin Portal Access (Custom Email & Password Required)'}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        </nav>

        {/* Right Tools & Profile Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Search trigger */}
          <button
            onClick={() => onTabChange('explorer')}
            className="btn-secondary hidden xl:inline-flex text-xs py-1.5 px-2.5 font-mono"
            title="Search Assets (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Search...</span>
            <kbd className="text-[10px] px-1 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
              Ctrl K
            </kbd>
          </button>

          {/* Theme switcher */}
          <button
            onClick={onCycleTheme}
            className="btn-secondary text-xs py-1.5 px-2.5"
            title={`Switch Theme (Current: ${currentTheme})`}
          >
            {currentTheme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-[var(--accent)]" />
            ) : currentTheme === 'monochrome' ? (
              <Sparkles className="w-3.5 h-3.5 text-[var(--text-main)]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[var(--accent)]" />
            )}
            <span className="capitalize hidden lg:inline">{currentTheme}</span>
          </button>

          {/* User Profile / Auth Button */}
          <UserProfileMenu
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onUserChanged={onUserChanged}
            onNavigateTab={onTabChange}
          />
        </div>
      </div>
    </header>
  )
}
