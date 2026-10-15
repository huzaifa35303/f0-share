import React, { useState, useEffect } from 'react'
import {
  Crown,
  Users,
  HardDrive,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Settings2,
  Activity,
  FileText,
  AlertTriangle,
  Lock,
  Download,
  Eye,
  RefreshCw,
  Plus,
  Sliders,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Database,
  Terminal,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Server,
  Loader2,
  AlertCircle,
  EyeOff,
  Zap,
  CheckSquare,
  Square,
  PackageCheck,
} from 'lucide-react'
import { User, FileRecord, StorageStats, AdminSystemSettings, AuditLog } from '../types'
import { authService } from '../services/authService'
import { supabaseService } from '../services/supabase'
import { storageEngine } from '../services/storageEngine'
import { formatBytes, formatDate } from '../utils/formatters'

interface AdminPanelProps {
  files: FileRecord[]
  stats: StorageStats
  onOpenFilePreview: (file: FileRecord) => void
  onDirectDownload: (file: FileRecord) => void
  onDeleteFile: (file: FileRecord) => void
  onRefreshData: () => void
}

export type AdminTab = 'overview' | 'infrastructure' | 'api' | 'users' | 'files' | 'settings' | 'audit'

export const AdminPanel: React.FC<AdminPanelProps> = ({
  files,
  stats,
  onOpenFilePreview,
  onDirectDownload,
  onDeleteFile,
  onRefreshData,
}) => {
  const [adminTab, setAdminTab] = useState<AdminTab>('overview')
  const [users, setUsers] = useState<User[]>(() => authService.getAllUsers())
  const [systemSettings, setSystemSettings] = useState<AdminSystemSettings>(() => authService.getSystemSettings())
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => authService.getAuditLogs())
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [fileSearch, setFileSearch] = useState('')
  const [selectedAuditIds, setSelectedAuditIds] = useState<Set<string>>(new Set())

  // Web & Cloud Infrastructure Settings State
  const [supabaseConfig, setSupabaseConfig] = useState(() => supabaseService.getSettings())
  const [url, setUrl] = useState(() => supabaseConfig.url || '')
  const [anonKey, setAnonKey] = useState(() => supabaseConfig.anonKey || '')
  const [bucket, setBucket] = useState(() => supabaseConfig.bucket || 'f0-share-vault')
  const [showKey, setShowKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copiedSql, setCopiedSql] = useState(false)
  const [isSupabaseActive, setIsSupabaseActive] = useState(() => storageEngine.isSupabase())

  // Developer API Gateway State
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python'>('curl')
  const [copiedApi, setCopiedApi] = useState<string | null>(null)

  // New User Modal State
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user')
  const [newUserQuotaGb, setNewUserQuotaGb] = useState('15')
  const [createError, setCreateError] = useState<string | null>(null)

  // Custom Admin Credentials Configuration State
  const [adminCustomEmail, setAdminCustomEmail] = useState(() => authService.getAdminCredentials().customEmail)
  const [adminNewPassword, setAdminNewPassword] = useState('')
  const [adminCredMsg, setAdminCredMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSaveAdminCreds = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminCredMsg(null)
    const res = authService.updateAdminCredentials(adminCustomEmail, adminNewPassword || undefined)
    if (res.success) {
      setAdminCredMsg({
        type: 'success',
        text: `Admin access credentials updated! Custom admin email is now set to "${adminCustomEmail}".`,
      })
      setAdminNewPassword('')
      refreshState()
    } else {
      setAdminCredMsg({
        type: 'error',
        text: res.error || 'Failed to update admin credentials.',
      })
    }
  }

  const refreshState = () => {
    setUsers(authService.getAllUsers())
    setSystemSettings(authService.getSystemSettings())
    setAuditLogs(authService.getAuditLogs())
    setSelectedAuditIds(new Set())
    const curSettings = supabaseService.getSettings()
    setSupabaseConfig(curSettings)
    setIsSupabaseActive(storageEngine.isSupabase())
    onRefreshData()
  }

  // User Actions
  const handleToggleRole = (user: User) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'
    if (confirm(`Change role of "${user.name}" to ${nextRole.toUpperCase()}?`)) {
      authService.updateUserRole(user.id, nextRole)
      refreshState()
    }
  }

  const handleToggleStatus = (user: User) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active'
    if (confirm(`Set status of "${user.name}" to ${nextStatus.toUpperCase()}?`)) {
      authService.updateUserStatus(user.id, nextStatus)
      refreshState()
    }
  }

  const handleChangeQuota = (userId: string, gb: number) => {
    authService.updateUserQuota(userId, gb * 1024 * 1024 * 1024)
    refreshState()
  }

  const handleDeleteUser = (user: User) => {
    if (confirm(`Permanently remove user "${user.name}" (${user.email})?`)) {
      authService.deleteUser(user.id)
      refreshState()
    }
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setCreateError('Please provide both name and email.')
      return
    }

    const quotaBytes = (parseInt(newUserQuotaGb) || 15) * 1024 * 1024 * 1024
    const existing = users.find((u) => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())
    if (existing) {
      setCreateError('User with this email already exists.')
      return
    }

    // Register user
    authService.signup(newUserName, newUserEmail, 'default123')
    const all = authService.getAllUsers()
    const created = all.find((u) => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())
    if (created) {
      if (newUserRole === 'admin') authService.updateUserRole(created.id, 'admin')
      authService.updateUserQuota(created.id, quotaBytes)
    }

    setShowAddUser(false)
    setNewUserName('')
    setNewUserEmail('')
    refreshState()
  }

  // System Settings updates
  const handleUpdateSetting = <K extends keyof AdminSystemSettings>(key: K, value: AdminSystemSettings[K]) => {
    authService.updateSystemSettings({ [key]: value })
    setSystemSettings(authService.getSystemSettings())
    setAuditLogs(authService.getAuditLogs())
  }

  const handleGlobalPurgeExpired = () => {
    const expired = files.filter((f) => {
      if (!f.expiresAt) return false
      return new Date(f.expiresAt).getTime() < Date.now()
    })

    if (expired.length === 0) {
      alert('No expired assets found in vault.')
      return
    }

    if (confirm(`Purge ${expired.length} expired asset(s) across all users permanently?`)) {
      expired.forEach((f) => onDeleteFile(f))
      authService.addAuditLog('Global Expired Purge', 'danger', `Purged ${expired.length} expired assets.`)
      refreshState()
    }
  }

  // Cloud & Web Settings Handlers
  const handleTestAndSaveSupabase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsTesting(true)
    setTestResult(null)

    try {
      const res = await supabaseService.updateSettings(url, anonKey, bucket)
      setTestResult(res)
      if (res.success) {
        authService.addAuditLog('Cloud Settings Saved', 'info', `Updated Supabase configuration (${bucket})`)
        refreshState()
      } else {
        authService.addAuditLog('Cloud Settings Failed', 'warning', res.message)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed.'
      setTestResult({ success: false, message: msg })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSwitchToLocalVault = () => {
    if (confirm('Switch storage engine to Sovereign Local Vault (IndexedDB)? Supabase Cloud synchronization will be paused.')) {
      supabaseService.clearSettings()
      setUrl('')
      setAnonKey('')
      setTestResult({
        success: true,
        message: 'Switched to Sovereign Local Vault (IndexedDB browser storage).',
      })
      authService.addAuditLog('Storage Engine Switched', 'warning', 'Switched to Sovereign Local Vault')
      refreshState()
    }
  }

  const sqlSchemaSnippet = `-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Folders Table
CREATE TABLE IF NOT EXISTS public.folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Files Table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
    user_id TEXT DEFAULT NULL,
    user_email TEXT DEFAULT NULL,
    download_count INTEGER DEFAULT 0 NOT NULL,
    password_hash TEXT DEFAULT NULL,
    is_password_protected BOOLEAN DEFAULT FALSE NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    is_public BOOLEAN DEFAULT TRUE NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    direct_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Atomic Download RPC
CREATE OR REPLACE FUNCTION public.increment_download(p_short_code TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.files
    SET download_count = download_count + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE short_code = p_short_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Folders" ON public.folders FOR ALL USING (true);
CREATE POLICY "Public Files" ON public.files FOR ALL USING (true);

-- 6. Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('f0-share-vault', 'f0-share-vault', true)
ON CONFLICT (id) DO UPDATE SET public = true;
CREATE POLICY "Public Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'f0-share-vault');
CREATE POLICY "Public Downloads" ON storage.objects FOR SELECT USING (bucket_id = 'f0-share-vault');
CREATE POLICY "Public Deletes" ON storage.objects FOR DELETE USING (bucket_id = 'f0-share-vault');`

  const copySqlSchema = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  // Developer API Gateway Snippets
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174'

  const curlCode = `# 1. Programmatic asset upload via cURL
curl -X POST "${origin}/api/upload" \\
  -F "file=@/path/to/archive.zip" \\
  -F "password=optional_passkey" \\
  -F "expiresInHours=24"

# 2. Retrieve metadata & telemetry by shortcode
curl -X GET "${origin}/api/file/abc1234"

# 3. Direct high-speed streaming download
curl -L -O "${origin}/api/download/abc1234"`

  const jsCode = `// Ingest an asset using JavaScript Fetch API
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('password', 'secret_key');
formData.append('expiresInHours', '24');

const response = await fetch('${origin}/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Shortcode:', data.shortCode);
console.log('Dispatch URL:', data.shareUrl);`

  const pythonCode = `import requests

url = "${origin}/api/upload"
files = {'file': open('dataset.zip', 'rb')}
data = {
    'password': 'vault-passkey',
    'expiresInHours': 168 # 7 days
}

response = requests.post(url, files=files, data=data)
result = response.json()

print(f"Uploaded: {result['shortCode']}")
print(f"Public Link: {result['shareUrl']}")`

  const handleCopyApi = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedApi(id)
    setTimeout(() => setCopiedApi(null), 2000)
  }

  const getApiCode = () => {
    switch (activeLang) {
      case 'curl':
        return curlCode
      case 'js':
        return jsCode
      case 'python':
        return pythonCode
    }
  }

  // Global File Auditor Handlers (Selective & Del All)
  const handleToggleAuditSelect = (id: string) => {
    const next = new Set(selectedAuditIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedAuditIds(next)
  }

  const handleSelectAllAudit = () => {
    if (selectedAuditIds.size === filteredFiles.length) {
      setSelectedAuditIds(new Set())
    } else {
      setSelectedAuditIds(new Set(filteredFiles.map((f) => f.id)))
    }
  }

  const handleDeleteSelectedAudit = () => {
    const toDelete = filteredFiles.filter((f) => selectedAuditIds.has(f.id))
    if (toDelete.length === 0) return
    if (confirm(`⚠️ Permanently purge ${toDelete.length} selective asset(s) across all users?`)) {
      toDelete.forEach((f) => onDeleteFile(f))
      authService.addAuditLog('Batch Asset Purge', 'danger', `Purged ${toDelete.length} selective assets.`)
      setSelectedAuditIds(new Set())
      refreshState()
    }
  }

  const handleDeleteAllAuditFiles = () => {
    if (filteredFiles.length === 0) return
    const count = filteredFiles.length
    if (
      confirm(
        `⚠️ PERMANENT GLOBAL VAULT PURGE\n\nDelete ALL ${count} cataloged asset(s) across all users?\n\nThis will purge all file binaries and dispatches from the platform permanently.`
      )
    ) {
      filteredFiles.forEach((f) => onDeleteFile(f))
      authService.addAuditLog('Global Vault Wipe', 'danger', `Purged all ${count} cataloged assets.`)
      setSelectedAuditIds(new Set())
      refreshState()
    }
  }

  // Filtering
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const filteredFiles = files.filter((f) => {
    return (
      f.name.toLowerCase().includes(fileSearch.toLowerCase()) ||
      f.shortCode.toLowerCase().includes(fileSearch.toLowerCase()) ||
      (f.userEmail && f.userEmail.toLowerCase().includes(fileSearch.toLowerCase()))
    )
  })

  const adminCount = users.filter((u) => u.role === 'admin').length
  const regularCount = users.length - adminCount

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div
        className="card-base p-6 relative overflow-hidden"
        style={{
          borderTop: '3px solid var(--accent)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>SUPERADMIN CONSOLE</span>
              </span>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{
                  backgroundColor: systemSettings.maintenanceMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: systemSettings.maintenanceMode ? 'var(--danger)' : 'var(--success)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {systemSettings.maintenanceMode ? 'Maintenance Mode Active' : 'System Online'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Enterprise Administration &amp; Governance
            </h1>
            <p className="text-xs max-w-2xl" style={{ color: 'var(--text-muted)' }}>
              Central command center for multi-tenant user access, quota policies, global file audits, and platform telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refreshState}
              className="btn-secondary text-xs"
              title="Refresh live metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>

            <button
              onClick={() => setShowAddUser(true)}
              className="btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision User</span>
            </button>
          </div>
        </div>

        {/* Live Admin Tabs */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t overflow-x-auto" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => setAdminTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
              adminTab === 'overview'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Platform Telemetry</span>
          </button>

          <button
            onClick={() => setAdminTab('infrastructure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
              adminTab === 'infrastructure'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Web &amp; Cloud Settings</span>
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isSupabaseActive ? 'var(--success)' : 'var(--accent)',
              }}
              title={isSupabaseActive ? 'Supabase Cloud Connected' : 'Sovereign Local Vault'}
            />
          </button>

          <button
            onClick={() => setAdminTab('api')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
              adminTab === 'api'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer API</span>
          </button>

          <button
            onClick={() => setAdminTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
              adminTab === 'users'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Directory ({users.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
              adminTab === 'files'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Global File Auditor ({files.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
              adminTab === 'settings'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Policies &amp; Limits</span>
          </button>

          <button
            onClick={() => setAdminTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
              adminTab === 'audit'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security Audit Log ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: OVERVIEW */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-base p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Platform Footprint
              </span>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--text-main)' }}>
                {formatBytes(stats.totalBytes)}
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--accent)' }}>
                Across {stats.fileCount} cataloged items
              </p>
            </div>

            <div className="card-base p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Registered Accounts
              </span>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--text-main)' }}>
                {users.length}
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {adminCount} Admins • {regularCount} Members
              </p>
            </div>

            <div className="card-base p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Transfers Delivered
              </span>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--text-main)' }}>
                {stats.downloadCount}
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--success)' }}>
                Unthrottled CDN streaming
              </p>
            </div>

            <div className="card-base p-4 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Security Coverage
              </span>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--text-main)' }}>
                SHA-256
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                Client-side passkey hashing
              </p>
            </div>
          </div>

          {/* Quick Admin Health Row */}
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                Platform Governance &amp; Storage Capacity
              </h3>
              <button
                onClick={handleGlobalPurgeExpired}
                className="btn-secondary text-xs"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger-muted)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Global Purge Expired Files</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Multi-Tenant Quota Isolation
                </span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Each user account is allocated an independent storage quota to prevent denial-of-service and runaway uploads.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Audit Trail Logging
                </span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  All authentication attempts, role modifications, and purge operations are logged in real-time.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-xs font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Instant Role Elevation
                </span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Promote trusted teammates to Superadmin with 1-click in the user directory.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INFRASTRUCTURE & CLOUD SETTINGS */}
      {adminTab === 'infrastructure' && (
        <div className="space-y-6">
          {/* Engine Status Banner */}
          <div className="card-base p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor: isSupabaseActive ? 'rgba(34, 197, 94, 0.15)' : 'var(--accent-muted)',
                    color: isSupabaseActive ? 'var(--success)' : 'var(--accent)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                      Storage Engine: {isSupabaseActive ? 'Supabase Global Cloud CDN' : 'Sovereign Local Vault'}
                    </h3>
                    <span
                      className="badge text-[10px]"
                      style={{
                        backgroundColor: isSupabaseActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: isSupabaseActive ? 'var(--success)' : '#eab308',
                      }}
                    >
                      {isSupabaseActive ? 'CLOUD ACTIVE' : 'LOCAL SOVEREIGN'}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {isSupabaseActive
                      ? 'Global streaming CDN active. Payloads ≤ 50 MB route to Supabase; heavy binaries > 50 MB auto-route to sovereign browser storage.'
                      : 'Operating in 100% offline-ready Sovereign mode. All files and folder trees are saved in browser IndexedDB.'}
                  </p>
                </div>
              </div>

              {isSupabaseActive && (
                <button
                  onClick={handleSwitchToLocalVault}
                  className="btn-secondary text-xs shrink-0 hover:text-amber-400 hover:border-amber-500"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Switch to Local Sovereign Mode</span>
                </button>
              )}
            </div>
          </div>

          {/* Cloud Configuration Form */}
          <div className="card-base p-6 space-y-5">
            <div className="border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <Server className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Supabase Cloud Connection Credentials</span>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Connect your PostgreSQL database and Object Storage bucket to enable cross-device synchronization and public CDN links.
              </p>
            </div>

            {testResult && (
              <div
                className="p-3.5 rounded-lg text-xs flex items-center gap-2 border"
                style={{
                  backgroundColor: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: testResult.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: testResult.success ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span className="font-mono">{testResult.message}</span>
              </div>
            )}

            <form onSubmit={handleTestAndSaveSupabase} className="space-y-4 max-w-2xl text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-clean w-full font-mono text-xs"
                />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Found under Project Settings → API in your Supabase Dashboard.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Project API Key (Anon / Service Role)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="input-clean w-full pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Your secure public Anon key or Service Role secret key for Supabase access.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Storage Bucket Identifier
                </label>
                <input
                  type="text"
                  placeholder="f0-share-vault"
                  value={bucket}
                  onChange={(e) => setBucket(e.target.value)}
                  className="input-clean w-full font-mono text-xs"
                />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Target storage bucket for uploaded binaries (Default: <code className="font-mono">f0-share-vault</code>).
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isTesting}
                  className="btn-primary text-xs"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating Connection...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Test &amp; Save Configuration</span>
                    </>
                  )}
                </button>

                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Supabase Dashboard</span>
                </a>
              </div>
            </form>
          </div>

          {/* Database Setup SQL Script */}
          <div className="card-base p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                  <Code2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <span>PostgreSQL Database Schema &amp; Storage Policies</span>
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Run this SQL in your Supabase SQL Editor once to configure tables, RPC counters, and storage bucket permissions.
                </p>
              </div>

              <button
                onClick={copySqlSchema}
                className="btn-secondary text-xs shrink-0"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied SQL Script</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Script</span>
                  </>
                )}
              </button>
            </div>

            <pre
              className="p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed max-h-72"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {sqlSchemaSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DEVELOPER API GATEWAY */}
      {adminTab === 'api' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="card-base p-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid var(--border-subtle)' }}>
                <Terminal className="w-3.5 h-3.5" />
                <span>REST API GATEWAY</span>
              </span>
              <span className="badge text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                v2.0 Endpoints
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Automated Ingestion &amp; Programmatic Integration
            </h2>
            <p className="text-xs max-w-3xl" style={{ color: 'var(--text-muted)' }}>
              Standard HTTP REST endpoints for automated dispatches, CI/CD artifact publication, Python dataset pipelines, and sovereign scripts.
            </p>
          </div>

          {/* Code Snippet Workbench */}
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {(['curl', 'js', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className="px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      backgroundColor: activeLang === lang ? 'var(--accent-muted)' : 'transparent',
                      color: activeLang === lang ? 'var(--accent)' : 'var(--text-muted)',
                      border: activeLang === lang ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    }}
                  >
                    {lang === 'js' ? 'JavaScript (Fetch)' : lang === 'python' ? 'Python (Requests)' : 'cURL'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCopyApi(getApiCode(), 'active-code')}
                className="btn-secondary text-xs"
                style={{ padding: '0.35rem 0.65rem' }}
              >
                {copiedApi === 'active-code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <pre
              className="p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {getApiCode()}
            </pre>
          </div>

          {/* REST Endpoints Reference Directory */}
          <div className="card-base p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <Layers className="w-4 h-4" />
              <span>Core REST Endpoint Directory</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b font-mono" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Endpoint</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Authentication</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                  <tr className="hover:bg-[var(--bg-surface-hover)]">
                    <td className="py-2.5 px-3">
                      <span className="badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        POST
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--accent)] font-semibold">/api/upload</td>
                    <td className="py-2.5 px-3 text-[var(--text-main)] font-sans">
                      Multipart payload upload. Supports <code className="text-[11px] font-mono">password</code>, <code className="text-[11px] font-mono">expiresInHours</code>, and <code className="text-[11px] font-mono">folderId</code>.
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)] font-sans">Public / User Session</td>
                  </tr>

                  <tr className="hover:bg-[var(--bg-surface-hover)]">
                    <td className="py-2.5 px-3">
                      <span className="badge bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                        GET
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--accent)] font-semibold">/api/file/:shortCode</td>
                    <td className="py-2.5 px-3 text-[var(--text-main)] font-sans">
                      Fetches public metadata, mime-type, owner email, and active download counters.
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)] font-sans">Public</td>
                  </tr>

                  <tr className="hover:bg-[var(--bg-surface-hover)]">
                    <td className="py-2.5 px-3">
                      <span className="badge bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                        GET
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--accent)] font-semibold">/api/download/:shortCode</td>
                    <td className="py-2.5 px-3 text-[var(--text-main)] font-sans">
                      Unthrottled direct streaming binary download. Increments transfer metrics atomically.
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)] font-sans">Passkey if protected</td>
                  </tr>

                  <tr className="hover:bg-[var(--bg-surface-hover)]">
                    <td className="py-2.5 px-3">
                      <span className="badge bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                        DELETE
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--accent)] font-semibold">/api/file/:shortCode</td>
                    <td className="py-2.5 px-3 text-[var(--text-main)] font-sans">
                      Permanently revokes dispatch link and purges file binary from storage vault.
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)] font-sans">Owner / Superadmin</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: USERS DIRECTORY */}
      {adminTab === 'users' && (
        <div className="card-base p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="input-clean w-full pl-9 text-xs"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="input-clean text-xs font-mono"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="user">Regular Users</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddUser(true)}
              className="btn-primary text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b font-mono" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Storage Quota</th>
                  <th className="py-2.5 px-3">Registered</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {filteredUsers.map((u) => {
                  const quotaGb = Math.round(u.quotaBytes / (1024 * 1024 * 1024))
                  return (
                    <tr key={u.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0"
                            style={{
                              backgroundColor: u.role === 'admin' ? 'var(--accent)' : 'var(--bg-canvas)',
                              color: u.role === 'admin' ? 'var(--accent-contrast)' : 'var(--text-main)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {u.avatar || u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                              {u.name}
                            </span>
                            <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className="badge cursor-pointer"
                          style={{
                            backgroundColor: u.role === 'admin' ? 'var(--accent-muted)' : 'rgba(255,255,255,0.06)',
                            color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}
                          title="Click to toggle role"
                        >
                          {u.role === 'admin' ? 'ADMIN' : 'USER'}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="badge cursor-pointer"
                          style={{
                            backgroundColor: u.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: u.status === 'active' ? 'var(--success)' : 'var(--danger)',
                          }}
                          title="Click to toggle status"
                        >
                          {u.status.toUpperCase()}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={quotaGb}
                          onChange={(e) => handleChangeQuota(u.id, parseInt(e.target.value))}
                          className="input-clean text-[11px] font-mono py-1 px-2"
                        >
                          <option value="5">5 GB</option>
                          <option value="10">10 GB</option>
                          <option value="15">15 GB</option>
                          <option value="50">50 GB</option>
                          <option value="100">100 GB</option>
                          <option value="500">500 GB</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="btn-secondary text-xs hover:text-red-400 hover:border-red-500"
                          style={{ padding: '0.35rem 0.55rem' }}
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GLOBAL FILE AUDITOR */}
      {adminTab === 'files' && (
        <div className="card-base p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Audit files by filename, shortcode, or user..."
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                className="input-clean w-full pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {filteredFiles.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleSelectAllAudit}
                    className="btn-secondary text-xs"
                    title={selectedAuditIds.size === filteredFiles.length ? "Deselect All" : "Select All Assets"}
                  >
                    {selectedAuditIds.size === filteredFiles.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {selectedAuditIds.size === filteredFiles.length ? 'Deselect All' : `Select All (${filteredFiles.length})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAllAuditFiles}
                    className="btn-secondary text-xs hover:text-rose-400 hover:border-rose-500"
                    style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                    title="Purge all assets in vault"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Del All ({filteredFiles.length})</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Selective Batch Bar */}
          {selectedAuditIds.size > 0 && (
            <div
              className="card-base p-3.5 flex items-center justify-between gap-3 text-xs font-mono animate-in slide-in-from-top-2 duration-150"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                border: '2px solid var(--accent)',
              }}
            >
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[var(--accent)]" />
                <span className="font-bold text-[var(--text-main)]">
                  {selectedAuditIds.size} of {filteredFiles.length} selective asset(s) chosen
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteSelectedAudit}
                  className="btn-secondary text-xs py-1.5 px-3 hover:text-rose-400 hover:border-rose-500"
                  style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Del Selected ({selectedAuditIds.size})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAuditIds(new Set())}
                  className="btn-secondary text-xs py-1.5 px-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b font-mono" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th className="py-2.5 px-3 w-10">
                    <button
                      type="button"
                      onClick={handleSelectAllAudit}
                      className="p-0.5 rounded hover:bg-[var(--bg-surface-hover)]"
                      title={selectedAuditIds.size === filteredFiles.length && filteredFiles.length > 0 ? "Deselect all" : "Select all"}
                    >
                      {selectedAuditIds.size === filteredFiles.length && filteredFiles.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Shortcode</th>
                  <th className="py-2.5 px-3">Transfers</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {filteredFiles.map((f) => {
                  const isChecked = selectedAuditIds.has(f.id)
                  return (
                    <tr
                      key={f.id}
                      className={`hover:bg-[var(--bg-surface-hover)] transition-colors ${
                        isChecked ? 'bg-[var(--accent-subtle)]' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAuditSelect(f.id)}
                          className="p-0.5"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                          <span className="font-semibold truncate max-w-xs" style={{ color: 'var(--text-main)' }}>
                            {f.name}
                          </span>
                        </div>
                      </td>

                    <td className="py-3 px-3 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {f.userEmail || 'Local Vault'}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]" style={{ color: 'var(--text-main)' }}>
                      {formatBytes(f.size)}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]" style={{ color: 'var(--accent)' }}>
                      /{f.shortCode}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]" style={{ color: 'var(--text-main)' }}>
                      {f.downloadCount || 0}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {f.isPasswordProtected && (
                          <span className="badge bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                            <Lock className="w-2.5 h-2.5" />
                            Passkey
                          </span>
                        )}
                        {f.expiresAt && (
                          <span className="badge bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
                            <Clock className="w-2.5 h-2.5" />
                            Expiring
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenFilePreview(f)}
                          className="btn-secondary text-xs"
                          style={{ padding: '0.35rem 0.55rem' }}
                          title="Preview asset"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDirectDownload(f)}
                          className="btn-secondary text-xs"
                          style={{ padding: '0.35rem 0.55rem' }}
                          title="Download asset"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Permanently remove "${f.name}" from vault?`)) {
                              onDeleteFile(f)
                            }
                          }}
                          className="btn-secondary text-xs hover:text-red-400 hover:border-red-500"
                          style={{ padding: '0.35rem 0.55rem' }}
                          title="Delete asset"
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
      )}

      {/* SUB-TAB 4: POLICIES & LIMITS */}
      {adminTab === 'settings' && (
        <div className="card-base p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>
              Platform Governance Policies &amp; Thresholds
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Configure global file size quotas, access rules, and default security standards.
            </p>
          </div>

          <div className="space-y-4 max-w-xl text-xs">
            {/* Allow Registration */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Public User Registration
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Allow new visitors to register accounts freely on the platform.
                </span>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.allowPublicRegistration}
                onChange={(e) => handleUpdateSetting('allowPublicRegistration', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[var(--accent)]"
              />
            </div>

            {/* Max Upload Limit */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Maximum Single File Upload Size
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Enforce an upper ceiling on individual binary files deposited.
                </span>
              </div>
              <select
                value={Math.round(systemSettings.maxUploadSizeBytes / (1024 * 1024))}
                onChange={(e) => handleUpdateSetting('maxUploadSizeBytes', parseInt(e.target.value) * 1024 * 1024)}
                className="input-clean font-mono text-xs"
              >
                <option value="100">100 MB</option>
                <option value="500">500 MB</option>
                <option value="1024">1 GB</option>
                <option value="5120">5 GB</option>
                <option value="10240">10 GB</option>
              </select>
            </div>

            {/* Default Expiration */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Default Ephemeral Retention
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Default expiration timer pre-selected in the deposit dropzone.
                </span>
              </div>
              <select
                value={systemSettings.defaultExpirationHours || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  handleUpdateSetting('defaultExpirationHours', val === 0 ? null : val)
                }}
                className="input-clean font-mono text-xs"
              >
                <option value="0">Never (Permanent)</option>
                <option value="24">24 Hours</option>
                <option value="72">3 Days (72 Hours)</option>
                <option value="168">7 Days (1 Week)</option>
                <option value="720">30 Days (1 Month)</option>
              </select>
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Platform Maintenance Mode
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Lock down uploads while undergoing system upgrades.
                </span>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.maintenanceMode}
                onChange={(e) => handleUpdateSetting('maintenanceMode', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[var(--danger)]"
              />
            </div>
          </div>

          {/* ADMIN CUSTOM EMAIL & PASSWORD CONFIGURATION */}
          <div className="pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                  Admin Portal Custom Credentials &amp; Access Control
                </h4>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Configure the specific custom email and master password required to access this executive governance console. No one can enter without these exact credentials.
              </p>
            </div>

            {adminCredMsg && (
              <div
                className="p-3 rounded-lg border text-xs font-mono mb-4 animate-in fade-in"
                style={{
                  backgroundColor: adminCredMsg.type === 'success' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(248, 81, 73, 0.1)',
                  borderColor: adminCredMsg.type === 'success' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(248, 81, 73, 0.3)',
                  color: adminCredMsg.type === 'success' ? '#38bdf8' : 'var(--danger)',
                }}
              >
                {adminCredMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveAdminCreds} className="space-y-4 max-w-xl text-xs">
              <div className="p-3.5 rounded-lg border space-y-2" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Authorized Custom Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminCustomEmail}
                  onChange={(e) => setAdminCustomEmail(e.target.value)}
                  placeholder="e.g. huzaifa@custom.vault or admin@f0.vault"
                  className="input-clean w-full font-mono text-xs"
                />
                <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>
                  Only users authenticating with this exact custom email can access the Admin Panel.
                </span>
              </div>

              <div className="p-3.5 rounded-lg border space-y-2" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
                <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Update Admin Master Password
                </label>
                <input
                  type="password"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Enter new password (leave blank to keep current)"
                  className="input-clean w-full font-mono text-xs"
                />
                <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>
                  Set a secure passphrase of at least 4 characters for executive entry.
                </span>
              </div>

              <button
                type="submit"
                className="btn-primary text-xs py-2 px-4 cursor-pointer font-bold"
              >
                Save Custom Admin Credentials
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: AUDIT TRAIL */}
      {adminTab === 'audit' && (
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                Security Audit Log Stream
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Chronological record of system security events and administrative actions.
              </p>
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {auditLogs.length} events logged
            </span>
          </div>

          <div className="divide-y rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 flex items-start justify-between gap-3 text-xs"
                style={{ backgroundColor: 'var(--bg-canvas)' }}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="badge text-[10px]"
                      style={{
                        backgroundColor:
                          log.level === 'danger'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : log.level === 'warning'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        color:
                          log.level === 'danger'
                            ? 'var(--danger)'
                            : log.level === 'warning'
                            ? '#f59e0b'
                            : '#60a5fa',
                      }}
                    >
                      {log.action}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      by {log.userEmail}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-[11px] font-mono pt-0.5" style={{ color: 'var(--text-main)' }}>
                      {log.details}
                    </p>
                  )}
                </div>

                <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--text-faint)' }}>
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROVISION USER MODAL */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="card-base p-6 max-w-md w-full space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                Provision New User Account
              </h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="btn-secondary text-xs"
                style={{ padding: '0.3rem' }}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {createError && (
              <p className="text-xs font-mono" style={{ color: 'var(--danger)' }}>
                {createError}
              </p>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="input-clean w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="input-clean w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                    Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="input-clean w-full font-mono"
                  >
                    <option value="user">Regular User</option>
                    <option value="admin">Superadmin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block" style={{ color: 'var(--text-main)' }}>
                    Quota
                  </label>
                  <select
                    value={newUserQuotaGb}
                    onChange={(e) => setNewUserQuotaGb(e.target.value)}
                    className="input-clean w-full font-mono"
                  >
                    <option value="5">5 GB</option>
                    <option value="15">15 GB</option>
                    <option value="50">50 GB</option>
                    <option value="100">100 GB</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
