-- ==============================================================================
-- f0 / Vault // Supabase Database & Storage Setup Script
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- Project URL: https://skpnwtngipfdyubgdrsa.supabase.co
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Folders Table
CREATE TABLE IF NOT EXISTS public.folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT DEFAULT NULL,
    user_id TEXT DEFAULT NULL,
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

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_files_short_code ON public.files(short_code);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);

-- 4. Atomic Download Counter Function
CREATE OR REPLACE FUNCTION public.increment_download(p_short_code TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.files
    SET download_count = download_count + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE short_code = p_short_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Allow public access for reading & creating folders
CREATE POLICY "Public Read Folders" ON public.folders
    FOR SELECT USING (true);

CREATE POLICY "Public Insert Folders" ON public.folders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Delete Folders" ON public.folders
    FOR DELETE USING (true);

-- Allow public access for reading non-expired public files
CREATE POLICY "Public Read Files" ON public.files
    FOR SELECT USING (
        (expires_at IS NULL OR expires_at > TIMEZONE('utc'::text, NOW()))
    );

CREATE POLICY "Public Insert Files" ON public.files
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Update Files" ON public.files
    FOR UPDATE USING (true);

CREATE POLICY "Public Delete Files" ON public.files
    FOR DELETE USING (true);

-- 6. Storage Bucket Configuration
-- Create 'f0-share-vault' bucket if not already created
INSERT INTO storage.buckets (id, name, public)
VALUES ('f0-share-vault', 'f0-share-vault', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'f0-share-vault'
CREATE POLICY "Public File Uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'f0-share-vault');

CREATE POLICY "Public File Downloads" ON storage.objects
    FOR SELECT USING (bucket_id = 'f0-share-vault');

CREATE POLICY "Public File Deletions" ON storage.objects
    FOR DELETE USING (bucket_id = 'f0-share-vault');
