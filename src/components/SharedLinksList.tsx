import React, { useState } from 'react'
import {
  Share2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Lock,
  Trash2,
  Plus,
  Send,
  CheckSquare,
  Square,
  PackageCheck,
  X,
} from 'lucide-react'
import { FileRecord } from '../types'
import { formatBytes, formatDate } from '../utils/formatters'

interface SharedLinksListProps {
  files: FileRecord[]
  onOpenShareModal: (file: FileRecord) => void
  onOpenFilePreview: (file: FileRecord) => void
  onOpenSharedPage: (shortCode: string) => void
  onDeleteFile: (file: FileRecord) => void
  onBatchDeleteFiles?: (files: FileRecord[]) => void
  onGoToUpload: () => void
}

export const SharedLinksList: React.FC<SharedLinksListProps> = ({
  files,
  onOpenShareModal,
  onOpenFilePreview,
  onOpenSharedPage,
  onDeleteFile,
  onBatchDeleteFiles,
  onGoToUpload,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedShareIds, setSelectedShareIds] = useState<Set<string>>(new Set())

  const sharedFiles = files.filter((f) => f.isPublic)
  const isAllSelected = sharedFiles.length > 0 && selectedShareIds.size === sharedFiles.length

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedShareIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedShareIds(new Set())
    } else {
      setSelectedShareIds(new Set(sharedFiles.map((f) => f.id)))
    }
  }

  const handleDeleteSelected = async () => {
    const toDelete = sharedFiles.filter((f) => selectedShareIds.has(f.id))
    if (toDelete.length === 0) return

    if (confirm(`Revoke and permanently delete ${toDelete.length} selective dispatch link(s)?`)) {
      if (onBatchDeleteFiles) {
        await onBatchDeleteFiles(toDelete)
      } else {
        for (const file of toDelete) {
          await onDeleteFile(file)
        }
      }
      setSelectedShareIds(new Set())
    }
  }

  const handleCopyLink = (shortCode: string, id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?share=${shortCode}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDeleteAll = async () => {
    if (sharedFiles.length === 0) return
    if (confirm(`WARNING: Del All will permanently revoke and delete ALL ${sharedFiles.length} shared dispatch link(s)!\n\nAre you sure you want to proceed?`)) {
      if (onBatchDeleteFiles) {
        await onBatchDeleteFiles(sharedFiles)
      } else {
        for (const file of sharedFiles) {
          await onDeleteFile(file)
        }
      }
      setSelectedShareIds(new Set())
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Outbound Channels
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Active Dispatches &amp; Shared Links
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage published public assets, passkey protections, selective batch operations, and stream counts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {sharedFiles.length > 0 && (
            <>
              <button
                onClick={handleSelectAll}
                className="btn-secondary text-xs"
                title="Select all shared dispatches"
              >
                {isAllSelected ? (
                  <>
                    <PackageCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Select All ({sharedFiles.length})</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDeleteAll}
                className="text-xs py-1.5 px-3 rounded font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors bg-red-600/15 border border-red-500/40 text-red-400 hover:bg-red-600/30"
                title="Permanently revoke and delete ALL shared dispatches"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Del All ({sharedFiles.length})</span>
              </button>
            </>
          )}

          <button
            onClick={onGoToUpload}
            className="btn-primary shrink-0 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Dispatch</span>
          </button>
        </div>
      </div>

      {/* Selective Items Batch Action Toolbar (Sticky when scrolling) */}
      {selectedShareIds.size > 0 && (
        <div
          className="sticky top-20 z-30 card-base p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl border animate-slide-down backdrop-blur-xl"
          style={{
            borderColor: 'var(--accent)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--accent)' }}
            />
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-main)' }}>
              {selectedShareIds.size} of {sharedFiles.length} selective dispatch(es) chosen
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              className="text-xs py-1.5 px-3 rounded font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors bg-red-600/15 border border-red-500/40 text-red-400 hover:bg-red-600/30"
              title="Permanently revoke and delete selected dispatches"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Del Selected ({selectedShareIds.size})</span>
            </button>
            <button
              onClick={() => setSelectedShareIds(new Set())}
              className="text-xs py-1.5 px-2.5 rounded font-mono cursor-pointer transition-colors border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {sharedFiles.length === 0 ? (
        <div className="card-base text-center p-12 space-y-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}
          >
            <Share2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
            No active dispatches published yet
          </h4>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            Upload files in the vault and generate instant public dispatch links, QR codes, and passkey protections.
          </p>
          <div className="pt-2">
            <button onClick={onGoToUpload} className="btn-primary text-xs">
              Upload First Asset
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sharedFiles.map((file) => {
            const isCopied = copiedId === file.id
            const isSelected = selectedShareIds.has(file.id)

            return (
              <div
                key={file.id}
                className={`card-base card-hover p-4 space-y-3.5 relative transition-all ${
                  isSelected ? 'ring-2 ring-[var(--accent)]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      onClick={(e) => handleToggleSelect(file.id, e)}
                      className="shrink-0 mt-0.5 p-1 rounded hover:bg-[var(--accent-muted)] transition-colors cursor-pointer"
                      title={isSelected ? 'Deselect dispatch' : 'Select dispatch'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      ) : (
                        <Square className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: 'var(--accent-muted)',
                            color: 'var(--accent)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          /{file.shortCode}
                        </span>
                        {file.isPasswordProtected && (
                          <span
                            className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.1)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                            }}
                          >
                            <Lock className="w-3 h-3" />
                            <span>Passkey Locked</span>
                          </span>
                        )}
                      </div>
                      <h4
                        onClick={() => onOpenFilePreview(file)}
                        className="text-sm font-semibold truncate hover:underline cursor-pointer"
                        style={{ color: 'var(--text-main)' }}
                        title={file.name}
                      >
                        {file.name}
                      </h4>
                    </div>
                  </div>

                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {formatBytes(file.size)}
                  </span>
                </div>

                <div
                  className="flex items-center gap-3 text-xs font-mono py-2 border-y"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>
                    <strong style={{ color: 'var(--text-main)' }}>{file.downloadCount || 0}</strong> transfers
                  </span>
                  <span>•</span>
                  <span>Created {formatDate(file.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleCopyLink(file.shortCode, file.id)}
                    className="btn-primary text-xs"
                    style={{ padding: '0.4rem 0.75rem' }}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Link Copied' : 'Copy Link'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenShareModal(file)}
                      className="btn-secondary text-xs"
                      style={{ padding: '0.4rem 0.6rem' }}
                      title="Inspect QR Code & Embed"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenSharedPage(file.shortCode)}
                      className="btn-secondary text-xs"
                      style={{ padding: '0.4rem 0.6rem' }}
                      title="Open Public Landing Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Revoke and delete dispatch link for "${file.name}"?`)) {
                          onDeleteFile(file)
                        }
                      }}
                      className="btn-secondary text-xs hover:border-red-500 hover:text-red-400"
                      style={{ padding: '0.4rem 0.6rem' }}
                      title="Revoke Dispatch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
