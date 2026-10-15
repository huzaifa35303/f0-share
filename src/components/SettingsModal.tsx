import React, { useState, useEffect } from 'react'
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { AppTheme, StorageStats } from '../types'
import { supabaseService } from '../services/supabase'
import { formatBytes } from '../utils/formatters'
import { ThemeSwitcher } from './ThemeSwitcher'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSettingsSaved: () => void
  stats: StorageStats
  currentTheme: AppTheme
  onThemeChange: (theme: AppTheme) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
  stats,
  currentTheme,
  onThemeChange,
}) => {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [bucket, setBucket] = useState('f0-share-vault')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showSql, setShowSql] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const current = supabaseService.getSettings()
      setUrl(current.url || '')
      setAnonKey(current.anonKey || '')
      setBucket(current.bucket || 'f0-share-vault')
      setTestResult(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTestAndSave = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const res = await supabaseService.updateSettings(url, anonKey, bucket)
      setTestResult(res)
      if (res.success) {
        onSettingsSaved()
      }
    } finally {
      setIsTesting(false)
    }
  }

  const handleSwitchToLocal = () => {
    supabaseService.clearSettings()
    setUrl('')
    setAnonKey('')
    setTestResult({
      success: true,
      message: 'Switched to Private Local Engine (IndexedDB storage).',
    })
    onSettingsSaved()
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

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  const isConfigured = supabaseService.isConfigured()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl card-base p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close settings"
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
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Storage Backend &amp; Preferences
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Configure Supabase Cloud storage credentials or toggle private local IndexedDB.
            </p>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="p-3 rounded-lg border text-center"
            style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}
          >
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Storage Used</span>
            <p className="text-sm font-bold font-mono mt-0.5" style={{ color: 'var(--text-main)' }}>{formatBytes(stats.totalBytes)}</p>
          </div>
          <div
            className="p-3 rounded-lg border text-center"
            style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}
          >
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Cataloged Assets</span>
            <p className="text-sm font-bold font-mono mt-0.5" style={{ color: 'var(--text-main)' }}>{stats.fileCount}</p>
          </div>
          <div
            className="p-3 rounded-lg border text-center"
            style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}
          >
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Transfers Served</span>
            <p className="text-sm font-bold font-mono mt-0.5" style={{ color: 'var(--text-main)' }}>{stats.downloadCount}</p>
          </div>
        </div>

        {/* Theme Switcher */}
        <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />

        {/* Current Active Engine */}
        <div
          className="p-4 rounded-xl border flex items-center justify-between gap-3"
          style={{
            backgroundColor: isConfigured ? 'rgba(63, 185, 80, 0.08)' : 'var(--bg-canvas)',
            borderColor: isConfigured ? 'rgba(63, 185, 80, 0.3)' : 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: isConfigured ? 'var(--success)' : 'var(--accent)' }}
            />
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-main)' }}>
                {isConfigured ? 'Supabase Cloud Storage Active' : 'Local IndexedDB Engine Active'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {isConfigured
                  ? 'Transfers are synchronized with your Supabase PostgreSQL and S3 bucket.'
                  : 'Assets are kept in local browser IndexedDB storage with zero setup required.'}
              </p>
            </div>
          </div>

          {isConfigured && (
            <button
              onClick={handleSwitchToLocal}
              className="btn-secondary text-xs"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              Use Local
            </button>
          )}
        </div>

        {/* Supabase Inputs */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between pb-1">
            <span className="font-bold font-mono uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Supabase API Credentials
            </span>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              <span>Get API Keys</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>PROJECT URL</label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-clean w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>ANON / PUBLIC KEY</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="input-clean w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>STORAGE BUCKET NAME</label>
            <input
              type="text"
              placeholder="f0-share-vault"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              className="input-clean w-full"
            />
          </div>

          {testResult && (
            <div
              className="p-3 rounded-lg border flex items-center gap-2 text-xs font-mono"
              style={{
                backgroundColor: testResult.success ? 'rgba(63, 185, 80, 0.1)' : 'rgba(248, 81, 73, 0.1)',
                borderColor: testResult.success ? 'rgba(63, 185, 80, 0.3)' : 'rgba(248, 81, 73, 0.3)',
                color: testResult.success ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={handleTestAndSave}
              disabled={isTesting}
              className="btn-primary text-xs"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Connect &amp; Test Supabase</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="btn-secondary text-xs"
            >
              <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>{showSql ? 'Hide SQL Script' : 'View SQL Setup Script'}</span>
            </button>
          </div>
        </div>

        {/* SQL Script Accordion */}
        {showSql && (
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                Execute in Supabase SQL Editor:
              </span>
              <button
                onClick={copySql}
                className="btn-secondary text-xs"
                style={{ padding: '0.25rem 0.6rem' }}
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre
              className="p-3 rounded-lg border text-[11px] font-mono max-h-48 overflow-y-auto leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent)',
              }}
            >
              {sqlSchemaSnippet}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
