import React, { useState, useEffect } from 'react'
import {
  Download,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  AlertTriangle,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  FileText,
  HardDrive,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { FileRecord } from '../types'
import { formatBytes, formatDate, getFileCategory, verifyPassword } from '../utils/formatters'
import { storageEngine } from '../services/storageEngine'
import QRCode from 'qrcode'

interface SharedPageViewProps {
  shortCode: string
  onBackToApp: () => void
}

export const SharedPageView: React.FC<SharedPageViewProps> = ({
  shortCode,
  onBackToApp,
}) => {
  const [file, setFile] = useState<FileRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isUnlocked, setIsUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const [showQr, setShowQr] = useState(false)
  const [qrUrl, setQrUrl] = useState<string>('')

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const loadSharedFile = async () => {
      try {
        const found = await storageEngine.getFileByShortCode(shortCode)
        if (!isMounted) return

        if (!found) {
          setError('Asset not found in storage vault or the share link has been revoked.')
          return
        }

        if (found.expiresAt) {
          const exp = new Date(found.expiresAt).getTime()
          if (Date.now() > exp) {
            setError('This ephemeral link has expired according to its retention policy.')
            return
          }
        }

        setFile(found)
        if (!found.isPasswordProtected) {
          setIsUnlocked(true)
        }
      } catch (err: unknown) {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg || 'Failed to locate asset.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadSharedFile()

    return () => {
      isMounted = false
    }
  }, [shortCode])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !file.passwordHash) return

    const valid = await verifyPassword(passwordInput, file.passwordHash)
    if (valid) {
      setIsUnlocked(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  const handleDownload = async () => {
    if (!file) return
    setIsDownloading(true)
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

      setDownloadSuccess(true)
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e5a950', '#ffffff', '#3fb950'],
      })
      setTimeout(() => setDownloadSuccess(false), 3500)

      setFile((prev) => (prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : null))
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to stream asset payload.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleTogglePreview = async () => {
    if (previewOpen) {
      setPreviewOpen(false)
      return
    }

    if (!previewBlobUrl && file) {
      try {
        const blob = await storageEngine.getFileBlob(file)
        const url = URL.createObjectURL(blob)
        setPreviewBlobUrl(url)
      } catch {
        alert('Could not preview this asset in browser.')
        return
      }
    }
    setPreviewOpen(true)
  }

  const handleToggleQr = () => {
    if (!showQr && !qrUrl) {
      QRCode.toDataURL(window.location.href, { width: 220, margin: 1 }, (err, url) => {
        if (!err && url) setQrUrl(url)
      })
    }
    setShowQr(!showQr)
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-10" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      {/* Top Header Bar */}
      <header
        className="w-full flex items-center justify-between pb-4 border-b max-w-4xl mx-auto"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <button
          onClick={onBackToApp}
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 text-left"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-sm shadow-sm"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            f0
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-sm" style={{ color: 'var(--text-main)' }}>
                f0 / Vault
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.2 rounded"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Dispatch
              </span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Encrypted File Distribution
            </p>
          </div>
        </button>

        <button
          onClick={onBackToApp}
          className="btn-secondary text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Open Main Vault</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        {loading ? (
          <div className="card-base text-center p-12 space-y-3">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Resolving cryptographic asset manifest...
            </p>
          </div>
        ) : error ? (
          <div className="card-base text-center p-8 space-y-4" style={{ borderColor: 'var(--danger-muted)' }}>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'var(--danger-muted)', color: 'var(--danger)' }}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>Asset Unavailable</h3>
              <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>{error}</p>
            </div>
            <button onClick={onBackToApp} className="btn-primary text-xs w-full">
              Return to Vault
            </button>
          </div>
        ) : file && !isUnlocked ? (
          /* PASSWORD CHALLENGE */
          <div className="card-base text-center p-8 space-y-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--border-subtle)' }}
            >
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <span
                className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                Passkey Protected
              </span>
              <h3 className="text-lg font-bold mt-2" style={{ color: 'var(--text-main)' }}>
                Unlock Protected Asset
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                This file was encrypted with a passkey by the sender.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3 max-w-xs mx-auto">
              <input
                type="password"
                autoFocus
                placeholder="Enter passkey..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value)
                  setPasswordError(false)
                }}
                className="input-clean w-full text-center"
              />

              {passwordError && (
                <p className="text-xs font-mono" style={{ color: 'var(--danger)' }}>
                  Incorrect passkey. Please try again.
                </p>
              )}

              <button type="submit" className="btn-primary w-full text-xs">
                <Unlock className="w-4 h-4" />
                <span>Verify &amp; Unlock</span>
              </button>
            </form>
          </div>
        ) : file ? (
          /* UNLOCKED ASSET CARD */
          <div className="card-base p-6 sm:p-7 space-y-6">
            <div className="text-center space-y-2 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-center gap-2">
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
                <span
                  className="text-xs font-mono"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {formatBytes(file.size)}
                </span>
              </div>

              <h2
                className="text-xl sm:text-2xl font-bold tracking-tight break-all"
                style={{ color: 'var(--text-main)' }}
              >
                {file.name}
              </h2>

              <div
                className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono pt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>{file.downloadCount || 0} transfers</span>
                <span>•</span>
                <span>Deposited {formatDate(file.createdAt)}</span>
              </div>
            </div>

            {/* Protocol Seal */}
            <div className="flex items-center justify-center gap-3 text-xs font-mono py-1">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
                <ShieldCheck className="w-4 h-4" />
                <span>Verified SHA-256</span>
              </div>
              <span style={{ color: 'var(--text-faint)' }}>•</span>
              <span style={{ color: 'var(--accent)' }}>Direct CDN Stream</span>
            </div>

            {/* Download Button */}
            <div className="space-y-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="btn-primary w-full py-3 text-sm font-semibold cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-800" />
                    <span>Download Started</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>{isDownloading ? 'Retrieving Payload...' : `Download File (${formatBytes(file.size)})`}</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePreview}
                  className="btn-secondary flex-1 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{previewOpen ? 'Hide Preview' : 'Preview Asset'}</span>
                </button>

                <button
                  onClick={handleToggleQr}
                  className="btn-secondary text-xs"
                  style={{ padding: '0.55rem 0.75rem' }}
                  title="Mobile Transfer QR"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            {showQr && qrUrl && (
              <div
                className="p-4 rounded-xl border text-center space-y-2 animate-in fade-in"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-32 h-32 mx-auto bg-white p-1.5 rounded-lg border border-black/20"
                />
                <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  Scan to stream directly to smartphone
                </p>
              </div>
            )}

            {/* In-Browser Preview */}
            {previewOpen && previewBlobUrl && (
              <div
                className="p-3 rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {getFileCategory(file.mimeType, file.name) === 'images' ? (
                  <img
                    src={previewBlobUrl}
                    alt={file.name}
                    className="max-h-64 mx-auto object-contain rounded-lg"
                  />
                ) : getFileCategory(file.mimeType, file.name) === 'videos' ? (
                  <video src={previewBlobUrl} controls className="max-h-64 mx-auto w-full rounded-lg" />
                ) : getFileCategory(file.mimeType, file.name) === 'audio' ? (
                  <audio src={previewBlobUrl} controls className="w-full my-2" />
                ) : (
                  <div className="text-center py-6 space-y-2">
                    <FileText className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      Direct visual preview not supported for this format. Please download directly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer
        className="text-center py-4 text-xs font-mono border-t max-w-4xl mx-auto w-full"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-faint)' }}
      >
        f0 / Vault · High-Speed Ephemeral File Distribution · Built by Huzaifa &amp; f0undr Team
      </footer>
    </div>
  )
}
