import React, { useState, useEffect } from 'react'
import {
  X,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Check,
  FileText,
  Loader2,
  FileArchive,
  Volume2,
} from 'lucide-react'
import { FileRecord } from '../types'
import { formatBytes, getFileCategory } from '../utils/formatters'
import { storageEngine } from '../services/storageEngine'

interface FilePreviewModalProps {
  file: FileRecord | null
  isOpen: boolean
  onClose: () => void
  onShare: (file: FileRecord) => void
  onDownload: (file: FileRecord) => void
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onShare,
  onDownload,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Image zoom/rotation controls
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [copiedText, setCopiedText] = useState(false)

  useEffect(() => {
    if (!isOpen || !file) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
        setBlobUrl(null)
      }
      setTextContent(null)
      setError(null)
      setZoom(1)
      setRotation(0)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchPreview = async () => {
      try {
        const blob = await storageEngine.getFileBlob(file)
        if (!isMounted) return

        const url = URL.createObjectURL(blob)
        setBlobUrl(url)

        const category = getFileCategory(file.mimeType, file.name)
        if (category === 'code' || category === 'documents') {
          // If small enough, read as text
          if (file.size < 3 * 1024 * 1024 && !file.name.endsWith('.pdf')) {
            const text = await blob.text()
            if (isMounted) setTextContent(text)
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg || 'Failed to load preview')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPreview()

    return () => {
      isMounted = false
    }
  }, [isOpen, file])

  if (!isOpen || !file) return null

  const category = getFileCategory(file.mimeType, file.name)
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.mimeType.includes('pdf')

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-[88vh] card-base flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Header Bar */}
        <div
          className="h-16 px-5 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}
        >
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: 'var(--accent-muted)',
                color: 'var(--accent)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }} title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {formatBytes(file.size)} • {file.mimeType}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {category === 'images' && (
              <div
                className="hidden sm:flex items-center gap-1 border rounded-lg p-1 mr-2"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  className="p-1 rounded cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="p-1 rounded cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {textContent !== null && (
              <button
                onClick={handleCopyText}
                className="hidden sm:inline-flex btn-secondary text-xs"
                style={{ padding: '0.4rem 0.75rem' }}
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
              </button>
            )}

            <button
              onClick={() => onShare(file)}
              className="btn-secondary text-xs"
              style={{ padding: '0.4rem 0.75rem' }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={() => onDownload(file)}
              className="btn-primary text-xs"
              style={{ padding: '0.4rem 0.85rem' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close preview"
              className="btn-secondary text-xs ml-1"
              style={{ padding: '0.4rem' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Viewport */}
        <div
          className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-canvas)' }}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Retrieving file payload...</span>
            </div>
          ) : error ? (
            <div className="text-center space-y-3">
              <p className="text-sm font-mono" style={{ color: 'var(--danger)' }}>{error}</p>
              <button
                onClick={() => onDownload(file)}
                className="btn-secondary text-xs"
              >
                Download Directly Instead
              </button>
            </div>
          ) : category === 'images' && blobUrl ? (
            /* IMAGE PREVIEW */
            <div className="max-w-full max-h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={blobUrl}
                alt={file.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          ) : category === 'videos' && blobUrl ? (
            /* VIDEO PLAYER */
            <div className="w-full max-w-4xl max-h-[70vh] flex items-center justify-center">
              <video
                src={blobUrl}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[70vh] rounded-xl shadow-2xl border bg-black"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>
          ) : category === 'audio' && blobUrl ? (
            /* AUDIO PLAYER */
            <div
              className="w-full max-w-md card-base p-6 rounded-2xl text-center space-y-4"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Volume2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>{file.name}</h4>
                <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{formatBytes(file.size)}</p>
              </div>
              <audio src={blobUrl} controls className="w-full" autoPlay />
            </div>
          ) : isPdf && blobUrl ? (
            /* PDF VIEWER */
            <iframe
              src={blobUrl}
              title={file.name}
              className="w-full h-full rounded-xl border"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
            />
          ) : textContent !== null ? (
            /* CODE / TEXT SYNTAX PREVIEW */
            <div
              className="w-full h-full card-base rounded-xl overflow-hidden flex flex-col"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <div
                className="px-4 py-2 border-b text-xs font-mono flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Text / Code Preview</span>
                <span>{textContent.split('\n').length} lines</span>
              </div>
              <pre
                className="p-4 overflow-auto text-xs font-mono leading-relaxed whitespace-pre flex-1"
                style={{ color: 'var(--text-main)' }}
              >
                {textContent}
              </pre>
            </div>
          ) : (
            /* FALLBACK / ARCHIVE / BINARY */
            <div
              className="card-base p-8 rounded-2xl text-center space-y-4 max-w-sm"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <FileArchive className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>{file.name}</h4>
                <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                  {formatBytes(file.size)} • Binary Asset
                </p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Direct in-browser visual preview is not supported for this file type. You can download the payload directly.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="btn-primary w-full text-xs"
              >
                Download File ({formatBytes(file.size)})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
