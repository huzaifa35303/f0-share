import React, { useState, useEffect } from 'react'
import {
  X,
  Copy,
  Check,
  QrCode,
  Download,
  ExternalLink,
  Clock,
  Code,
  Share2,
  Lock,
} from 'lucide-react'
import QRCode from 'qrcode'
import { FileRecord } from '../types'
import { formatBytes, formatDate } from '../utils/formatters'

interface ShareModalProps {
  file: FileRecord | null
  isOpen: boolean
  onClose: () => void
  onOpenSharedPage: (shortCode: string) => void
}

export const ShareModal: React.FC<ShareModalProps> = ({
  file,
  isOpen,
  onClose,
  onOpenSharedPage,
}) => {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [snippetType, setSnippetType] = useState<'markdown' | 'html' | 'bbcode'>('markdown')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  const shareUrl = file
    ? `${window.location.origin}${window.location.pathname}?share=${file.shortCode}`
    : ''

  useEffect(() => {
    if (isOpen && file) {
      QRCode.toDataURL(
        shareUrl,
        {
          width: 256,
          margin: 1.5,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrDataUrl(url)
          }
        }
      )
    }
  }, [isOpen, file, shareUrl])

  if (!isOpen || !file) return null

  const handleCopy = (text: string, type: 'link' | 'snippet') => {
    navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      setCopiedSnippet(true)
      setTimeout(() => setCopiedSnippet(false), 2000)
    }
  }

  const getEmbedSnippet = () => {
    if (snippetType === 'markdown') {
      return `[${file.name}](${shareUrl})`
    }
    if (snippetType === 'html') {
      return `<a href="${shareUrl}" target="_blank" rel="noopener noreferrer">${file.name}</a>`
    }
    return `[url=${shareUrl}]${file.name}[/url]`
  }

  const downloadQrCode = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qrcode_${file.shortCode}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl card-base p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 btn-secondary text-xs"
          style={{ padding: '0.4rem' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Dispatch &amp; Share Details
            </h3>
            <p className="text-xs truncate max-w-sm sm:max-w-md" style={{ color: 'var(--text-muted)' }}>
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
          <span
            className="px-2 py-0.5 rounded border"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-main)',
            }}
          >
            Shortcode: <strong style={{ color: 'var(--accent)' }}>/{file.shortCode}</strong>
          </span>

          {file.isPasswordProtected && (
            <span
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.25)',
                color: '#f59e0b',
              }}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Passkey Protected</span>
            </span>
          )}

          {file.expiresAt ? (
            <span
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border"
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderColor: 'rgba(168, 85, 247, 0.25)',
                color: '#c084fc',
              }}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Expires {formatDate(file.expiresAt)}</span>
            </span>
          ) : (
            <span
              className="px-2 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              Permanent Link
            </span>
          )}
        </div>

        {/* Public Share Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            Public Share URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="input-clean w-full font-mono select-all"
            />
            <button
              onClick={() => handleCopy(shareUrl, 'link')}
              className="btn-primary shrink-0 text-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* QR Code and Mobile Transfer Section */}
        <div
          className="p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {qrDataUrl ? (
            <div className="p-1.5 bg-white shrink-0 rounded-lg border border-black/20 shadow-sm">
              <img
                src={qrDataUrl}
                alt="Share QR Code"
                className="w-24 h-24 object-contain"
              />
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-lg border flex items-center justify-center animate-pulse"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <QrCode className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
          )}

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <span className="text-xs font-bold font-mono uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Direct Mobile Transfer
            </span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Scan this QR code with any smartphone camera to stream or download this asset instantly without typing.
            </p>
            <button
              onClick={downloadQrCode}
              className="btn-secondary text-xs"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <Download className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>Save QR Image</span>
            </button>
          </div>
        </div>

        {/* Embed Code Snippets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
              <Code className="w-3.5 h-3.5" />
              <span>Embed Snippet</span>
            </label>
            <div className="flex items-center gap-1 text-[11px] font-mono">
              {(['markdown', 'html', 'bbcode'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSnippetType(t)}
                  className="px-2 py-0.5 rounded transition-colors uppercase cursor-pointer"
                  style={{
                    backgroundColor: snippetType === t ? 'var(--accent-muted)' : 'transparent',
                    color: snippetType === t ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={getEmbedSnippet()}
              className="input-clean w-full font-mono select-all text-xs"
            />
            <button
              onClick={() => handleCopy(getEmbedSnippet(), 'snippet')}
              className="btn-secondary text-xs"
              style={{ padding: '0.45rem 0.6rem' }}
              title="Copy snippet"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => onOpenSharedPage(file.shortCode)}
            className="btn-secondary text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>Open Public Landing Page</span>
          </button>

          <button
            onClick={onClose}
            className="btn-primary text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
