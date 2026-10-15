export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  avatar?: string
  quotaBytes: number // in bytes, e.g. 5GB
  usedBytes: number
  fileCount: number
  status: 'active' | 'suspended'
  isVerified: boolean // Requires email verification code
  verificationCode?: string
  verificationCodeExpiresAt?: string
  createdAt: string
  lastLogin?: string
}

export interface AdminCredentials {
  customEmail: string
  password: string
  updatedAt: string
}

export interface FileRecord {
  id: string
  name: string
  originalName: string
  size: number
  mimeType: string
  storagePath: string
  folderId: string | null
  userId?: string | null
  userEmail?: string | null
  downloadCount: number
  isPasswordProtected: boolean
  passwordHash?: string | null
  expiresAt: string | null // ISO timestamp or null
  isPublic: boolean
  shortCode: string
  directUrl: string
  createdAt: string
  blob?: Blob // Cached or indexedDB local blob
  tags?: string[]
  note?: string
  isEphemeral?: boolean // Flag for unauthenticated guest files that are not saved
}

export interface FolderRecord {
  id: string
  name: string
  parentId: string | null
  userId?: string | null
  createdAt: string
}

export interface UploadOptions {
  folderId?: string | null
  password?: string
  expiresInHours?: number | null // null = never, 1, 24, 72, 168, 720
  isPublic?: boolean
  customAlias?: string
  tags?: string[]
  note?: string
  userId?: string | null
  userEmail?: string | null
}

export interface UploadItem {
  id: string
  file: File
  progress: number // 0 - 100
  status: 'queued' | 'uploading' | 'completed' | 'error'
  speed: number // bytes per second
  eta: number // seconds remaining
  error?: string
  result?: FileRecord
}

export interface SupabaseSettings {
  url: string
  anonKey: string
  bucket: string
  isConnected: boolean
}

export type FileCategory = 'all' | 'images' | 'videos' | 'audio' | 'documents' | 'code' | 'archives'

export type ViewTab = 'upload' | 'explorer' | 'shared' | 'admin'

export type SortMode = 
  | 'date-desc' 
  | 'date-asc' 
  | 'name-asc' 
  | 'name-desc' 
  | 'size-desc' 
  | 'size-asc' 
  | 'downloads-desc'

export interface StorageStats {
  totalBytes: number
  fileCount: number
  downloadCount: number
  categoryBreakdown: {
    images: number
    videos: number
    audio: number
    documents: number
    code: number
    archives: number
  }
}

export type AppTheme = 'slate' | 'monochrome' | 'light'

export interface TransferLogEvent {
  id: string
  type: 'upload' | 'download' | 'share' | 'delete'
  fileName: string
  fileSize: number
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

export interface AdminSystemSettings {
  allowPublicRegistration: boolean
  maxUploadSizeBytes: number
  defaultExpirationHours: number | null
  maintenanceMode: boolean
  requireLoginToDownload: boolean
}

export interface AuditLog {
  id: string
  action: string
  userEmail: string
  details?: string
  timestamp: string
  level: 'info' | 'warning' | 'danger'
}
