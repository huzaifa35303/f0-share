import React, { useState, useMemo } from 'react'
import {
  Folder,
  FolderPlus,
  Search,
  Download,
  Trash2,
  Share2,
  Eye,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  Lock,
  ChevronRight,
  HardDrive,
  PackageCheck,
  CheckSquare,
  Square,
  Grid,
  List as ListIcon,
} from 'lucide-react'
import { FileCategory, FileRecord, FolderRecord, SortMode, User } from '../types'
import { formatBytes, formatDate, getFileCategory } from '../utils/formatters'
import { downloadFilesAsZip } from '../services/zip'

interface FileExplorerProps {
  files: FileRecord[]
  folders: FolderRecord[]
  currentFolderId: string | null
  currentUser?: User | null
  onNavigateFolder: (folderId: string | null) => void
  onCreateFolder: (name: string) => void
  onDeleteFolder: (folderId: string) => void
  onOpenFilePreview: (file: FileRecord) => void
  onOpenShareModal: (file: FileRecord) => void
  onDirectDownload: (file: FileRecord) => void
  onDeleteFile: (file: FileRecord) => void
  onBatchDeleteFiles: (files: FileRecord[]) => void
  onGoToUpload: () => void
  onOpenAuth?: (mode?: 'login' | 'signup') => void
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  folders,
  currentFolderId,
  currentUser,
  onNavigateFolder,
  onCreateFolder,
  onDeleteFolder,
  onOpenFilePreview,
  onOpenShareModal,
  onDirectDownload,
  onDeleteFile,
  onBatchDeleteFiles,
  onGoToUpload,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('all')
  const isAdmin = currentUser?.role === 'admin'
  const [ownershipScope, setOwnershipScope] = useState<'all' | 'mine'>(
    currentUser?.role === 'admin' ? 'all' : 'mine'
  )
  const [sortMode, setSortMode] = useState<SortMode>('date-desc')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [newFolderName, setNewFolderName] = useState('')
  const [showFolderInput, setShowFolderInput] = useState(false)
  const [isZipping, setIsZipping] = useState(false)

  const currentFolder = folders.find((f) => f.id === currentFolderId)
  const currentSubfolders = folders.filter((f) =>
    currentFolderId === null ? !f.parentId : f.parentId === currentFolderId
  )

  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const inThisFolder = currentFolderId === null ? !file.folderId : file.folderId === currentFolderId
        if (!inThisFolder) return false

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          if (!file.name.toLowerCase().includes(q) && !file.shortCode.toLowerCase().includes(q)) {
            return false
          }
        }

        if (selectedCategory !== 'all') {
          const cat = getFileCategory(file.mimeType, file.name)
          if (cat !== selectedCategory) return false
        }

        // Strict role separation: Normal users ONLY see their own files
        if (!isAdmin && currentUser) {
          if (file.userId && file.userId !== currentUser.id) return false
        } else if (ownershipScope === 'mine' && currentUser) {
          if (file.userId && file.userId !== currentUser.id) return false
        }

        return true
      })
      .sort((a, b) => {
        switch (sortMode) {
          case 'date-desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case 'date-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          case 'name-asc':
            return a.name.localeCompare(b.name)
          case 'name-desc':
            return b.name.localeCompare(a.name)
          case 'size-desc':
            return b.size - a.size
          case 'size-asc':
            return a.size - b.size
          case 'downloads-desc':
            return (b.downloadCount || 0) - (a.downloadCount || 0)
          default:
            return 0
        }
      })
  }, [files, currentFolderId, searchQuery, selectedCategory, sortMode, ownershipScope, currentUser])

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)))
    }
  }

  const handleBatchZipDownload = async () => {
    const selectedFiles = filteredFiles.filter((f) => selectedIds.has(f.id))
    if (selectedFiles.length === 0) return
    setIsZipping(true)
    try {
      await downloadFilesAsZip(selectedFiles, `f0-vault-${Date.now()}.zip`)
    } finally {
      setIsZipping(false)
    }
  }

  const handleBatchDelete = () => {
    const selectedFiles = filteredFiles.filter((f) => selectedIds.has(f.id))
    if (selectedFiles.length === 0) return
    if (confirm(`Permanently delete ${selectedFiles.length} selective file(s)?`)) {
      onBatchDeleteFiles(selectedFiles)
      setSelectedIds(new Set())
    }
  }

  const handleDeleteAllFiles = () => {
    if (filteredFiles.length === 0) return
    const count = filteredFiles.length
    if (
      confirm(
        `⚠️ DELETE ALL FILES CONFIRMATION\n\nPermanently delete all ${count} file(s) currently in this vault view?\n\nThis will erase the assets from storage and cancel all active share dispatches.`
      )
    ) {
      onBatchDeleteFiles(filteredFiles)
      setSelectedIds(new Set())
    }
  }

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    onCreateFolder(newFolderName.trim())
    setNewFolderName('')
    setShowFolderInput(false)
  }

  const renderFileIcon = (file: FileRecord) => {
    const cat = getFileCategory(file.mimeType, file.name)
    switch (cat) {
      case 'images':
        return <FileImage className="w-4 h-4 text-emerald-400" />
      case 'videos':
        return <FileVideo className="w-4 h-4 text-sky-400" />
      case 'audio':
        return <FileAudio className="w-4 h-4 text-amber-400" />
      case 'code':
        return <FileCode className="w-4 h-4 text-violet-400" />
      case 'archives':
        return <FileArchive className="w-4 h-4 text-orange-400" />
      default:
        return <FileText className="w-4 h-4 text-[var(--accent)]" />
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pt-4">
      {/* Header & Breadcrumb Bar */}
      <div className="card-base p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs flex-wrap font-mono">
          <button
            onClick={() => onNavigateFolder(null)}
            className={`px-2 py-1 rounded transition-colors ${
              currentFolderId === null
                ? 'font-bold text-[var(--accent)] bg-[var(--accent-muted)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            ROOT VAULT
          </button>

          {currentFolder && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="font-bold text-[var(--accent)] px-1">
                {currentFolder.name}
              </span>
            </>
          )}

          <span className="text-[11px] text-[var(--text-muted)] pl-1">
            ({filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'})
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filteredFiles.length > 0 && (
            <>
              {/* Select All / Deselect All Toggle */}
              <button
                type="button"
                onClick={handleSelectAll}
                className="btn-secondary text-xs"
                title={selectedIds.size === filteredFiles.length ? "Deselect all items" : "Select all items in vault"}
              >
                {selectedIds.size === filteredFiles.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>
                  {selectedIds.size === filteredFiles.length
                    ? 'Deselect All'
                    : `Select All (${filteredFiles.length})`}
                </span>
              </button>

              {/* Del All (Delete All Files) Button */}
              <button
                type="button"
                onClick={handleDeleteAllFiles}
                className="btn-secondary text-xs hover:text-rose-400 hover:border-rose-500"
                style={{
                  color: 'var(--danger)',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                }}
                title="Delete all files in this view"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Del All ({filteredFiles.length})</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowFolderInput(true)}
            className="btn-secondary text-xs"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>New Folder</span>
          </button>

          <button
            onClick={onGoToUpload}
            className="btn-primary text-xs"
          >
            <span>+ Deposit File</span>
          </button>
        </div>
      </div>

      {/* New Folder Form */}
      {showFolderInput && (
        <form
          onSubmit={handleCreateFolderSubmit}
          className="card-base p-3 flex items-center gap-2 border-[var(--accent)] animate-in fade-in"
        >
          <Folder className="w-4 h-4 text-[var(--accent)] shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 input-clean"
          />
          <button type="submit" className="btn-primary text-xs">
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowFolderInput(false)}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Subfolders Grid */}
      {currentSubfolders.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[var(--accent)] uppercase font-mono tracking-wider">
            Directories ({currentSubfolders.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {currentSubfolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => onNavigateFolder(folder.id)}
                className="card-base card-hover p-3 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--text-main)] truncate group-hover:text-[var(--accent)]">
                    {folder.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete folder "${folder.name}"?`)) onDeleteFolder(folder.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Mode Warning Banner */}
      {!currentUser && (
        <div
          className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-400">Guest Mode Active (Files Not Saved to Vault)</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                You are currently browsing without logging in. Files uploaded without an account are strictly ephemeral and will not be saved. Sign up and verify your account to permanently store and access files.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenAuth && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="btn-secondary text-xs py-1.5 px-3 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="btn-primary text-xs py-1.5 px-3 cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search & Scope */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or shortcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full input-clean pl-8 text-xs font-mono"
            />
          </div>

          {isAdmin && (
            <div
              className="hidden sm:flex items-center p-0.5 rounded-lg border text-xs font-mono shrink-0"
              style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}
            >
              <button
                type="button"
                onClick={() => setOwnershipScope('all')}
                className="px-2.5 py-1 rounded transition-colors cursor-pointer"
                style={{
                  backgroundColor: ownershipScope === 'all' ? 'var(--accent)' : 'transparent',
                  color: ownershipScope === 'all' ? 'var(--accent-contrast)' : 'var(--text-muted)',
                  fontWeight: ownershipScope === 'all' ? 700 : 400,
                }}
              >
                Global Vault
              </button>
              <button
                type="button"
                onClick={() => setOwnershipScope('mine')}
                className="px-2.5 py-1 rounded transition-colors cursor-pointer"
                style={{
                  backgroundColor: ownershipScope === 'mine' ? 'var(--accent)' : 'transparent',
                  color: ownershipScope === 'mine' ? 'var(--accent-contrast)' : 'var(--text-muted)',
                  fontWeight: ownershipScope === 'mine' ? 700 : 400,
                }}
              >
                My Files
              </button>
            </div>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 font-mono text-xs scrollbar-none">
          {(
            [
              ['all', 'All'],
              ['documents', 'Docs'],
              ['images', 'Images'],
              ['videos', 'Videos'],
              ['audio', 'Audio'],
              ['code', 'Code'],
              ['archives', 'Archives'],
            ] as const
          ).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort and View Mode */}
        <div className="flex items-center gap-2 self-end md:self-auto font-mono text-xs">
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="input-clean text-xs cursor-pointer py-1.5"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="size-desc">Largest Size</option>
            <option value="size-asc">Smallest Size</option>
            <option value="downloads-desc">Most Transfers</option>
          </select>

          <div className="flex items-center rounded-lg border border-[var(--border-subtle)] p-0.5 bg-[var(--bg-surface)]">
            <button
              onClick={() => setViewMode('list')}
              aria-label="List View"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid View"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar for Selective Items (Sticky when scrolling) */}
      {selectedIds.size > 0 && (
        <div
          className="sticky top-20 z-30 card-base p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-slide-down backdrop-blur-xl"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid var(--accent)',
            boxShadow: '0 12px 32px -4px rgba(0,0,0,0.65)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
              style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}
            >
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[var(--text-main)] block">
                {selectedIds.size} of {filteredFiles.length} selective item(s) chosen
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Batch operations applied to checked assets
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBatchZipDownload}
              disabled={isZipping}
              className="btn-primary text-xs py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Archiving...' : `Download (${selectedIds.size}) as ZIP`}</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              className="btn-secondary text-xs py-1.5 px-3 hover:text-rose-400 hover:border-rose-500"
              style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Del Selected ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={handleSelectAll}
              className="btn-secondary text-xs py-1.5 px-2.5"
            >
              <span>{selectedIds.size === filteredFiles.length ? 'Deselect All' : 'Select All'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="btn-secondary text-xs py-1.5 px-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* File List / Grid Display */}
      {filteredFiles.length === 0 ? (
        <div className="card-base text-center p-12 space-y-3">
          <HardDrive className="w-10 h-10 text-[var(--accent)] mx-auto opacity-70" />
          <h4 className="text-base font-bold text-[var(--text-main)]">
            {!currentUser ? 'Guest Vault Empty' : 'No files found'}
          </h4>
          <p className="text-xs text-[var(--text-muted)] font-mono max-w-md mx-auto">
            {!currentUser
              ? 'Unauthenticated uploads are not saved to the vault. Sign in or register and verify your account to permanently save files.'
              : searchQuery
              ? 'Try another search keyword'
              : 'This folder is currently empty.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {!currentUser && onOpenAuth ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="btn-primary text-xs py-2 px-4 cursor-pointer"
                >
                  Create Account
                </button>
              </>
            ) : (
              <button onClick={onGoToUpload} className="btn-primary text-xs py-2 px-4 cursor-pointer">
                Deposit New File
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE LIST VIEW */
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-muted)] font-mono">
                  <th className="py-2.5 px-4 w-10">
                    <button onClick={handleSelectAll} className="p-1">
                      {selectedIds.size === filteredFiles.length && filteredFiles.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-4 font-bold">NAME</th>
                  <th className="py-2.5 px-4 font-bold">SHORTCODE</th>
                  <th className="py-2.5 px-4 font-bold">SIZE</th>
                  <th className="py-2.5 px-4 font-bold">TRANSFERS</th>
                  <th className="py-2.5 px-4 font-bold">SECURITY</th>
                  <th className="py-2.5 px-4 font-bold">DATE</th>
                  <th className="py-2.5 px-4 font-bold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredFiles.map((file) => {
                  const isSelected = selectedIds.has(file.id)
                  return (
                    <tr
                      key={file.id}
                      onClick={() => onOpenFilePreview(file)}
                      className={`hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[var(--accent-subtle)]' : ''
                      }`}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleSelect(file.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-semibold text-[var(--text-main)]">
                        <div className="flex items-center gap-2.5">
                          {renderFileIcon(file)}
                          <span className="truncate max-w-xs sm:max-w-md">{file.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-[var(--accent)] font-bold">
                        {file.shortCode}
                      </td>

                      <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                        {formatBytes(file.size)}
                      </td>

                      <td className="py-3 px-4 font-mono text-[var(--text-main)] font-bold">
                        {file.downloadCount || 0}
                      </td>

                      <td className="py-3 px-4">
                        {file.isPasswordProtected ? (
                          <span className="badge border-amber-500/40 text-amber-400 bg-amber-500/10">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Passkey</span>
                          </span>
                        ) : (
                          <span className="badge border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-canvas)]">
                            Public
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[var(--text-muted)] text-xs">
                        {formatDate(file.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenFilePreview(file)}
                            className="btn-secondary py-1 px-2 text-xs"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenShareModal(file)}
                            className="btn-secondary py-1 px-2 text-xs"
                            title="Share Link & QR"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDirectDownload(file)}
                            className="btn-secondary py-1 px-2 text-xs"
                            title="Direct Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${file.name}"?`)) onDeleteFile(file)
                            }}
                            className="btn-secondary py-1 px-2 text-xs text-rose-400 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredFiles.map((file) => {
            const isSelected = selectedIds.has(file.id)
            return (
              <div
                key={file.id}
                onClick={() => onOpenFilePreview(file)}
                className={`card-base card-hover p-4 cursor-pointer flex flex-col justify-between ${
                  isSelected ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleSelect(file.id)
                      }}
                      className="p-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      )}
                    </button>

                    <span className="font-mono text-xs font-bold text-[var(--accent)]">
                      {file.shortCode}
                    </span>
                  </div>

                  <div className="w-full h-24 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center mb-3">
                    {renderFileIcon(file)}
                  </div>

                  <h4 className="text-xs font-bold text-[var(--text-main)] truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] mt-1">
                    <span>{formatBytes(file.size)}</span>
                    <span>{file.downloadCount || 0} transfers</span>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border-subtle)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[10px] text-[var(--text-muted)]">{formatDate(file.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenFilePreview(file)}
                      className="btn-secondary p-1.5"
                      title="Preview"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onOpenShareModal(file)}
                      className="btn-secondary p-1.5"
                      title="Share"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDirectDownload(file)}
                      className="btn-secondary p-1.5"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${file.name}"?`)) onDeleteFile(file)
                      }}
                      className="btn-secondary p-1.5 hover:text-rose-400 hover:border-rose-500"
                      style={{ color: 'var(--danger)' }}
                      title="Delete File"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
