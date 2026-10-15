import React from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Share2,
  Trash2,
  FileText,
} from 'lucide-react'
import { FileRecord, UploadItem } from '../types'
import { formatBytes, formatEta, formatSpeed } from '../utils/formatters'

interface UploadQueueProps {
  queue: UploadItem[]
  onOpenShare: (file: FileRecord) => void
  onClearCompleted: () => void
  onCancelItem?: (id: string) => void
}

export const UploadQueue: React.FC<UploadQueueProps> = ({
  queue,
  onOpenShare,
  onClearCompleted,
}) => {
  if (queue.length === 0) return null

  const completedCount = queue.filter((item) => item.status === 'completed').length

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 mt-6 animate-in fade-in">
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--accent)' }}>
            Active Ingestion Stream
          </span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            ({completedCount}/{queue.length} processed)
          </span>
        </div>

        {completedCount > 0 && (
          <button
            onClick={onClearCompleted}
            className="flex items-center gap-1.5 text-xs transition-colors cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Completed</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {queue.map((item) => {
          const isDone = item.status === 'completed'
          const isError = item.status === 'error'
          const isUploading = item.status === 'uploading'

          return (
            <div
              key={item.id}
              className="card-base p-3.5 space-y-2.5 transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: isDone ? 'rgba(63, 185, 80, 0.4)' : isError ? 'rgba(248, 81, 73, 0.4)' : 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: isDone ? 'rgba(63, 185, 80, 0.15)' : isError ? 'rgba(248, 81, 73, 0.15)' : 'var(--accent-muted)',
                      borderColor: 'var(--border-subtle)',
                      color: isDone ? 'var(--success)' : isError ? 'var(--danger)' : 'var(--accent)',
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isError ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                      {item.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      <span>{formatBytes(item.file.size)}</span>
                      {isUploading && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'var(--accent)' }}>{formatSpeed(item.speed)}</span>
                          <span>•</span>
                          <span>ETA {formatEta(item.eta)}</span>
                        </>
                      )}
                      {isError && (
                        <span className="text-rose-400">{item.error || 'Ingestion failed'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUploading && (
                    <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--accent)' }}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{Math.round(item.progress)}%</span>
                    </div>
                  )}

                  {isDone && item.result && (
                    <button
                      onClick={() => onOpenShare(item.result!)}
                      className="btn-primary text-xs py-1.5 px-3 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Link</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)' }}>
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isDone ? 'bg-emerald-400' : isError ? 'bg-rose-400' : 'bg-[var(--accent)]'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
