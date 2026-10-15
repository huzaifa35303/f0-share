import React, { useState, useEffect, useCallback } from 'react'
import { Navbar } from './components/Navbar'
import { VaultHero } from './components/VaultHero'
import { DropZone } from './components/DropZone'
import { UploadQueue } from './components/UploadQueue'
import { ShareModal } from './components/ShareModal'
import { FileExplorer } from './components/FileExplorer'
import { FilePreviewModal } from './components/FilePreviewModal'
import { SharedPageView } from './components/SharedPageView'
import { SharedLinksList } from './components/SharedLinksList'
import { ShortcutsModal } from './components/ShortcutsModal'
import { MobileNav } from './components/MobileNav'
import { AdminPanel } from './components/AdminPanel'
import { AdminAuthGate } from './components/AdminAuthGate'
import { AuthModal } from './components/AuthModal'
import {
  AppTheme,
  FileRecord,
  FolderRecord,
  StorageStats,
  UploadItem,
  UploadOptions,
  ViewTab,
  User,
} from './types'
import { storageEngine } from './services/storageEngine'
import { authService } from './services/authService'

export const App: React.FC = () => {
  // Theme Management (Default: Studio Slate & Gold, Monochrome, Light)
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('f0_share_theme') as AppTheme) || 'slate'
  })

  useEffect(() => {
    if (currentTheme === 'slate') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
    localStorage.setItem('f0_share_theme', currentTheme)
  }, [currentTheme])

  const cycleTheme = () => {
    const list: AppTheme[] = ['slate', 'monochrome', 'light']
    const nextIdx = (list.indexOf(currentTheme) + 1) % list.length
    setCurrentTheme(list[nextIdx])
  }

  // Check if opened via ?share=SHORTCODE
  const [activeShareCode, setActiveShareCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('share')
  })

  // Current authenticated user session
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<ViewTab>('upload')

  // Storage data
  const [files, setFiles] = useState<FileRecord[]>([])
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [stats, setStats] = useState<StorageStats>({
    totalBytes: 0,
    fileCount: 0,
    downloadCount: 0,
    categoryBreakdown: {
      images: 0,
      videos: 0,
      audio: 0,
      documents: 0,
      code: 0,
      archives: 0,
    },
  })

  // Upload queue
  const [queue, setQueue] = useState<UploadItem[]>([])

  // Modals & previews
  const [shareModalFile, setShareModalFile] = useState<FileRecord | null>(null)
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isSupabase, setIsSupabase] = useState(storageEngine.isSupabase())

  // Load files, folders, and stats
  const refreshData = useCallback(async () => {
    try {
      const [allFiles, allFolders, storageStats] = await Promise.all([
        storageEngine.getFiles(),
        storageEngine.getFolders(),
        storageEngine.getStorageStats(),
      ])
      setFiles(allFiles)
      setFolders(allFolders)
      setStats(storageStats)
      setIsSupabase(storageEngine.isSupabase())

      const activeUser = authService.getCurrentUser()
      if (activeUser) {
        const userFiles = allFiles.filter((f) => f.userId === activeUser.id)
        const userBytes = userFiles.reduce((acc, f) => acc + (f.size || 0), 0)
        authService.syncUserFileStats(activeUser.id, userBytes, userFiles.length)
        setCurrentUser(authService.getCurrentUser())
      }
    } catch (err) {
      console.error('Failed to load storage data:', err)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Listen to Auth State Changes (e.g. Supabase email verification link clicks)
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user)
      if (user) {
        setIsAuthModalOpen(false)
      }
      refreshData()
    })
    return unsubscribe
  }, [refreshData])

  // Global Keyboard Shortcuts (Ctrl+K, U, V, S, A, T, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (e.key === 'Escape') {
        setShareModalFile(null)
        setPreviewFile(null)
        setIsShortcutsOpen(false)
        setIsAuthModalOpen(false)
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCurrentTab('explorer')
        return
      }

      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
          e.preventDefault()
          setIsShortcutsOpen((prev) => !prev)
        } else if (e.key.toLowerCase() === 'u') {
          setCurrentTab('upload')
        } else if (e.key.toLowerCase() === 'v') {
          setCurrentTab('explorer')
        } else if (e.key.toLowerCase() === 's') {
          setCurrentTab('shared')
        } else if (e.key.toLowerCase() === 'a') {
          if (currentUser?.role === 'admin') {
            setCurrentTab('admin')
          }
        } else if (e.key.toLowerCase() === 't') {
          cycleTheme()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTheme])

  // Handle file uploads
  const handleFilesSelected = async (selectedFiles: File[], options: UploadOptions) => {
    const newItems: UploadItem[] = selectedFiles.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'queued',
      speed: 0,
      eta: 0,
    }))

    setQueue((prev) => [...prev, ...newItems])

    for (const item of newItems) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q))
      )

      const startTime = Date.now()

      try {
        const result = await storageEngine.uploadFile(
          item.file,
          {
            ...options,
            userId: currentUser?.id || null,
            userEmail: currentUser?.email || null,
          },
          (progress) => {
            const now = Date.now()
            const elapsedSec = (now - startTime) / 1000
            const currentBytes = (progress / 100) * item.file.size
            const speed = elapsedSec > 0 ? currentBytes / elapsedSec : 0
            const remainingBytes = item.file.size - currentBytes
            const eta = speed > 0 ? remainingBytes / speed : 0

            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? {
                      ...q,
                      progress,
                      speed,
                      eta,
                    }
                  : q
              )
            )
          }
        )

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'completed', progress: 100, result }
              : q
          )
        )

        if (selectedFiles.length === 1) {
          setShareModalFile(result)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: 'error', error: msg } : q
          )
        )
      }
    }

    await refreshData()
  }

  // Direct download file
  const handleDirectDownload = async (file: FileRecord) => {
    try {
      const blob = await storageEngine.getFileBlob(file)
      await storageEngine.incrementDownload(file.shortCode)

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      refreshData()
    } catch (err) {
      console.error('Direct download failed:', err)
      alert('Failed to download file.')
    }
  }

  // Delete file
  const handleDeleteFile = async (file: FileRecord) => {
    try {
      await storageEngine.deleteFile(file)
      await refreshData()
    } catch (err) {
      console.error('Delete file error:', err)
      alert('Failed to delete file.')
    }
  }

  // Batch delete
  const handleBatchDeleteFiles = async (filesToDelete: FileRecord[]) => {
    try {
      await storageEngine.deleteMultipleFiles(filesToDelete)
      await refreshData()
    } catch (err) {
      console.error('Batch delete error:', err)
      alert('Failed to delete files.')
    }
  }

  // Purge expired files
  const handlePurgeExpired = async () => {
    const expired = files.filter((f) => {
      if (!f.expiresAt) return false
      return new Date(f.expiresAt).getTime() < Date.now()
    })
    if (expired.length === 0) return
    if (confirm(`Purge and delete ${expired.length} expired asset(s) permanently?`)) {
      await storageEngine.deleteMultipleFiles(expired)
      await refreshData()
    }
  }

  // Create folder
  const handleCreateFolder = async (name: string) => {
    if (!currentUser) {
      setAuthModalMode('signup')
      setIsAuthModalOpen(true)
      return
    }
    try {
      await storageEngine.createFolder(name, currentFolderId, currentUser.id)
      await refreshData()
    } catch (err) {
      console.error('Create folder error:', err)
      alert('Failed to create folder.')
    }
  }

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    try {
      await storageEngine.deleteFolder(folderId)
      await refreshData()
    } catch (err) {
      console.error('Delete folder error:', err)
      alert('Failed to delete folder.')
    }
  }

  // If viewing a public share link (?share=code)
  if (activeShareCode) {
    return (
      <SharedPageView
        shortCode={activeShareCode}
        onBackToApp={() => {
          window.history.replaceState({}, '', window.location.pathname)
          setActiveShareCode(null)
          refreshData()
        }}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      {/* Top Header & Sticky Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        stats={stats}
        currentTheme={currentTheme}
        onCycleTheme={cycleTheme}
        currentUser={currentUser}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode)
          setIsAuthModalOpen(true)
        }}
        onUserChanged={(user) => {
          setCurrentUser(user)
          refreshData()
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Product Hero (shown on Ingestion desk view) */}
        {currentTab === 'upload' && (
          <VaultHero
            onGoToUpload={() => {
              const el = document.getElementById('ingestion-desk')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            onGoToExplorer={() => setCurrentTab('explorer')}
            onOpenSettings={() => setCurrentTab('admin')}
            stats={stats}
            isSupabase={isSupabase}
            currentUser={currentUser}
          />
        )}

        {/* Tab 1: Upload Desk */}
        {currentTab === 'upload' && (
          <div className="space-y-6" id="ingestion-desk">
            <DropZone
              onFilesSelected={handleFilesSelected}
              folders={folders}
              currentFolderId={currentFolderId}
              currentUser={currentUser}
            />

            <UploadQueue
              queue={queue}
              onOpenShare={(f) => setShareModalFile(f)}
              onClearCompleted={() =>
                setQueue((prev) => prev.filter((item) => item.status !== 'completed'))
              }
            />
          </div>
        )}

        {/* Tab 2: Drive Vault Explorer */}
        {currentTab === 'explorer' && (
          <FileExplorer
            files={currentUser?.role === 'admin' ? files : currentUser ? files.filter((f) => f.userId === currentUser.id) : []}
            folders={currentUser?.role === 'admin' ? folders : currentUser ? folders.filter((f) => f.userId === currentUser.id || !f.userId) : []}
            currentFolderId={currentFolderId}
            currentUser={currentUser}
            onNavigateFolder={setCurrentFolderId}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onOpenFilePreview={(f) => setPreviewFile(f)}
            onOpenShareModal={(f) => setShareModalFile(f)}
            onDirectDownload={handleDirectDownload}
            onDeleteFile={handleDeleteFile}
            onBatchDeleteFiles={handleBatchDeleteFiles}
            onGoToUpload={() => setCurrentTab('upload')}
            onOpenAuth={(mode) => {
              setAuthModalMode(mode || 'login')
              setIsAuthModalOpen(true)
            }}
          />
        )}

        {/* Tab 3: Active Dispatches & Shared Links */}
        {currentTab === 'shared' && (
          <SharedLinksList
            files={currentUser?.role === 'admin' ? files : currentUser ? files.filter((f) => f.userId === currentUser.id) : []}
            onOpenShareModal={(f) => setShareModalFile(f)}
            onOpenFilePreview={(f) => setPreviewFile(f)}
            onOpenSharedPage={(code) => {
              window.history.pushState({}, '', `?share=${code}`)
              setActiveShareCode(code)
            }}
            onDeleteFile={handleDeleteFile}
            onBatchDeleteFiles={handleBatchDeleteFiles}
            onGoToUpload={() => setCurrentTab('upload')}
          />
        )}

        {/* Tab 4: Superadmin Governance Console (Strictly requires custom email & password) */}
        {currentTab === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminPanel
              files={files}
              stats={stats}
              onOpenFilePreview={(f) => setPreviewFile(f)}
              onDirectDownload={handleDirectDownload}
              onDeleteFile={handleDeleteFile}
              onRefreshData={refreshData}
            />
          ) : (
            <AdminAuthGate
              onSuccess={(adminUser) => {
                setCurrentUser(adminUser)
                refreshData()
              }}
              onCancel={() => setCurrentTab('upload')}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer
        className="w-full border-t py-8 text-center text-xs font-mono mt-12"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <p className="font-semibold" style={{ color: 'var(--text-main)' }}>
          f0 / Vault · Enterprise File Sharing &amp; Sovereign Storage
        </p>
        <p className="mt-1" style={{ color: 'var(--text-faint)' }}>
          Engineered by Huzaifa &amp; f0undr Team · Fast, Private, and Autonomous
        </p>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        fileCount={files.length}
        isAdmin={currentUser?.role === 'admin'}
      />

      {/* Authentication Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={(user) => {
          setCurrentUser(user)
          refreshData()
        }}
      />

      {/* Share Modal */}
      <ShareModal
        file={shareModalFile}
        isOpen={Boolean(shareModalFile)}
        onClose={() => setShareModalFile(null)}
        onOpenSharedPage={(code) => {
          setShareModalFile(null)
          window.history.pushState({}, '', `?share=${code}`)
          setActiveShareCode(code)
        }}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        onShare={(f) => {
          setPreviewFile(null)
          setShareModalFile(f)
        }}
        onDownload={handleDirectDownload}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  )
}

export default App
