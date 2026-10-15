import { FileCategory } from '../types'

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s'
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatEta(seconds: number): string {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return '--'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function getFileCategory(mimeType: string, filename: string): FileCategory {
  const mime = mimeType.toLowerCase()
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  if (
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico', 'avif'].includes(ext)
  ) {
    return 'images'
  }

  if (
    mime.startsWith('video/') ||
    ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv'].includes(ext)
  ) {
    return 'videos'
  }

  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)
  ) {
    return 'audio'
  }

  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('excel') ||
    mime.includes('sheet') ||
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'txt', 'rtf'].includes(ext)
  ) {
    return 'documents'
  }

  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('rar') ||
    mime.includes('7z') ||
    mime.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)
  ) {
    return 'archives'
  }

  if (
    mime.includes('javascript') ||
    mime.includes('json') ||
    mime.includes('typescript') ||
    mime.includes('html') ||
    mime.includes('xml') ||
    mime.includes('css') ||
    ['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'html', 'css', 'sql', 'sh', 'md', 'yml', 'yaml'].includes(ext)
  ) {
    return 'code'
  }

  return 'documents'
}

export function generateShortCode(length = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, expectedHash: string): Promise<boolean> {
  const hash = await hashPassword(password)
  return hash === expectedHash
}
