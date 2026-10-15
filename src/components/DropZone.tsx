import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  UploadCloud,
  FileUp,
  FolderUp,
  Lock,
  Clock,
  Folder,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { FolderRecord, UploadOptions, User } from '../types'

interface DropZoneProps {
  onFilesSelected: (files: File[], options: UploadOptions) => void
  folders: FolderRecord[]
  currentFolderId: string | null
  currentUser?: User | null
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  folders,
  currentFolderId,
  currentUser,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [targetFolderId, setTargetFolderId] = useState<string | null>(currentFolderId)
  const [password, setPassword] = useState('')
  const [expiresInHours, setExpiresInHours] = useState<number | null>(null)
  const [customAlias, setCustomAlias] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTargetFolderId(currentFolderId)
  }, [currentFolderId])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const items = Array.from(e.clipboardData.items)
      const files: File[] = []

      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }

      if (files.length > 0) {
        triggerUpload(files)
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [targetFolderId, password, expiresInHours, customAlias, currentUser])

  const triggerUpload = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      const options: UploadOptions = {
        folderId: targetFolderId,
        password: password.trim() || undefined,
        expiresInHours,
        customAlias: customAlias.trim() || undefined,
        isPublic: true,
        userId: currentUser?.id || null,
        userEmail: currentUser?.email || null,
      }
      onFilesSelected(files, options)
      setPassword('')
      setCustomAlias('')
    },
    [targetFolderId, password, expiresInHours, customAlias, currentUser, onFilesSelected]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const items = e.dataTransfer.items
    const files: File[] = []

    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const entry = item.webkitGetAsEntry?.()
        if (entry) {
          await scanFiles(entry, files)
        } else {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
    } else if (e.dataTransfer.files) {
      files.push(...Array.from(e.dataTransfer.files))
    }

    if (files.length > 0) {
      triggerUpload(files)
    }
  }

  const scanFiles = async (entry: any, fileList: File[], path = ''): Promise<void> => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => {
          fileList.push(file)
          resolve()
        })
      })
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      return new Promise((resolve) => {
        reader.readEntries(async (entries: any[]) => {
          for (const child of entries) {
            await scanFiles(child, fileList, `${path}${entry.name}/`)
          }
          resolve()
        })
      })
    }
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerUpload(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Hidden Native File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={onFileInputChange}
        // @ts-expect-error standard folder attribute
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />

      {/* Guest Mode Notice */}
      {!currentUser && (
        <div
          className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">⚠️ Guest Mode:</span>
            <span className="text-[var(--text-muted)]">
              You are not signed in. Uploaded files will <strong style={{ color: 'var(--text-main)' }}>NOT be saved</strong> to your vault.
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-400 font-semibold shrink-0">
            Sign In &amp; Verify to Save Permanently
          </span>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`card-base p-10 sm:p-14 border-2 border-dashed text-center cursor-pointer transition-all duration-200 group relative overflow-hidden ${
          isDragOver
            ? 'border-[var(--accent)] bg-[var(--accent-subtle)] scale-[1.01] shadow-2xl'
            : 'border-[var(--border-strong)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface-hover)]'
        }`}
      >
        <div className={`w-16 h-16 rounded-2xl bg-[var(--accent-muted)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4 text-[var(--accent)] transition-all duration-200 group-hover:scale-110 shadow-sm ${isDragOver ? 'animate-bounce' : 'group-hover:animate-float'}`}>
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] mb-1">
          Drop files or folders to upload
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto mb-2">
          Files are encrypted and processed immediately. Clipboard paste (<kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[var(--text-main)]">Ctrl+V</kbd>) is supported.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--accent)] mb-6">
          <Zap className="w-3 h-3 text-[var(--accent)]" />
          <span>Cloud CDN (up to 50MB) • Auto-Routes Large Media (&gt;50MB) to High-Capacity Local Vault</span>
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            <FileUp className="w-4 h-4" />
            <span>Select Files</span>
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="btn-secondary"
          >
            <FolderUp className="w-4 h-4" />
            <span>Upload Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`btn-secondary ${showAdvanced ? 'border-[var(--accent)] text-[var(--accent)]' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Options</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Advanced Ingestion Controls */}
      {showAdvanced && (
        <div className="card-base p-5 bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-xs">
            <span className="font-bold text-[var(--accent)] uppercase font-mono tracking-wider">
              Transfer &amp; Security Controls
            </span>
            <span className="text-[var(--text-muted)] font-mono">Applies to active queue</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Save to Folder</span>
              </label>
              <select
                value={targetFolderId || ''}
                onChange={(e) => setTargetFolderId(e.target.value || null)}
                className="w-full input-clean"
              >
                <option value="">(Root Vault)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Passkey Lock (SHA-256)</span>
              </label>
              <input
                type="password"
                placeholder="Optional passkey..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input-clean"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Expiration Timer</span>
              </label>
              <select
                value={expiresInHours === null ? '' : expiresInHours}
                onChange={(e) =>
                  setExpiresInHours(e.target.value === '' ? null : Number(e.target.value))
                }
                className="w-full input-clean"
              >
                <option value="">Permanent (Never)</option>
                <option value="1">1 Hour Ephemeral</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="72">3 Days</option>
                <option value="168">7 Days (1 Week)</option>
                <option value="720">30 Days</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Custom Shortcode</span>
              </label>
              <input
                type="text"
                placeholder="e.g. quarterly-doc"
                value={customAlias}
                onChange={(e) =>
                  setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                }
                className="w-full input-clean font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Feature Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="card-base p-3 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[var(--success)] shrink-0" />
          <span>Zero Surveillance &amp; Salted Passkeys</span>
        </div>
        <div className="card-base p-3 flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span>Direct Streaming CDN Transmission</span>
        </div>
        <div className="card-base p-3 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span>Hybrid Supabase + IndexedDB Engine</span>
        </div>
      </div>
    </div>
  )
}
