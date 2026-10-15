import { FileRecord, FolderRecord, StorageStats, UploadOptions } from '../types'
import { generateShortCode, hashPassword, getFileCategory } from '../utils/formatters'
import { localDb } from './indexedDb'
import { supabaseService } from './supabase'

export class UnifiedStorageEngine {
  // In-memory cache for unauthenticated guest files (strictly ephemeral - NEVER saved to persistent vault/database)
  private ephemeralFiles = new Map<string, { record: FileRecord; blob: Blob }>()

  // Check whether we are currently using Supabase or Local IndexedDB
  public isSupabase(): boolean {
    return supabaseService.isConfigured()
  }

  // Upload a file with progress reporting
  public async uploadFile(
    file: File,
    options: UploadOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<FileRecord> {
    const fileId = crypto.randomUUID()
    const shortCode = options.customAlias?.trim() || generateShortCode()
    const ext = file.name.split('.').pop() || ''
    const storagePath = `${Date.now()}_${shortCode}.${ext}`

    let passwordHash: string | null = null
    const isPasswordProtected = Boolean(options.password && options.password.trim())
    if (isPasswordProtected && options.password) {
      passwordHash = await hashPassword(options.password.trim())
    }

    let expiresAt: string | null = null
    if (options.expiresInHours && options.expiresInHours > 0) {
      const expDate = new Date(Date.now() + options.expiresInHours * 3600 * 1000)
      expiresAt = expDate.toISOString()
    }

    // MANDATORY GUEST CHECK:
    // If the user is NOT logged in (no userId), files are strictly ephemeral and NOT saved to persistent storage.
    const isGuest = !options.userId
    if (isGuest) {
      const steps = [25, 55, 80, 100]
      for (const step of steps) {
        await new Promise((r) => setTimeout(r, 40))
        onProgress?.(step)
      }

      const directUrl = `${window.location.origin}?share=${shortCode}`
      const ephemeralRecord: FileRecord = {
        id: fileId,
        name: file.name,
        originalName: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        storagePath,
        folderId: null,
        userId: null,
        userEmail: null,
        downloadCount: 0,
        isPasswordProtected,
        passwordHash,
        expiresAt,
        isPublic: true,
        shortCode,
        directUrl,
        createdAt: new Date().toISOString(),
        isEphemeral: true,
        note: '⚠️ Unauthenticated Guest File: Not saved to vault (Sign in required to save permanently)',
      }

      this.ephemeralFiles.set(fileId, { record: ephemeralRecord, blob: file })
      this.ephemeralFiles.set(shortCode, { record: ephemeralRecord, blob: file })
      return ephemeralRecord
    }

    const client = supabaseService.getClient()
    const settings = supabaseService.getSettings()

    // Supabase Free Tier has a 50MB per-file upload limit.
    // Files > 50MB are automatically preserved in the High-Capacity Sovereign Vault (IndexedDB)
    const SUPABASE_MAX_BYTES = 50 * 1024 * 1024 // 50 MB

    if (this.isSupabase() && client && file.size <= SUPABASE_MAX_BYTES) {
      // 1. Upload to Supabase Storage
      onProgress?.(10)
      const { data: uploadData, error: uploadError } = await client.storage
        .from(settings.bucket)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        if (
          uploadError.message.includes('exceeded the maximum allowed size') ||
          uploadError.message.includes('Payload too large') ||
          uploadError.message.includes('EntityTooLarge') ||
          uploadError.message.includes('413')
        ) {
          console.warn('Supabase storage size limit exceeded. Auto-routing to High-Capacity Local Vault.')
          return this.uploadToLocalVault(
            file,
            fileId,
            shortCode,
            storagePath,
            isPasswordProtected,
            passwordHash,
            expiresAt,
            options,
            onProgress
          )
        }
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      onProgress?.(60)

      // Get direct public URL
      const { data: urlData } = client.storage
        .from(settings.bucket)
        .getPublicUrl(uploadData.path)

      const directUrl = urlData.publicUrl

      // 2. Insert into files table
      const { data: rowData, error: dbError } = await client
        .from('files')
        .insert({
          id: fileId,
          name: file.name,
          original_name: file.name,
          size: file.size,
          mime_type: file.type || 'application/octet-stream',
          storage_path: uploadData.path,
          folder_id: options.folderId || null,
          user_id: options.userId || null,
          user_email: options.userEmail || null,
          download_count: 0,
          password_hash: passwordHash,
          is_password_protected: isPasswordProtected,
          expires_at: expiresAt,
          is_public: options.isPublic ?? true,
          short_code: shortCode,
          direct_url: directUrl,
        })
        .select()
        .single()

      if (dbError) {
        if (
          dbError.message.includes('Could not find the table') ||
          dbError.message.includes('does not exist') ||
          dbError.code === 'PGRST205'
        ) {
          const record: FileRecord = {
            id: fileId,
            name: file.name,
            originalName: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            storagePath: uploadData.path,
            folderId: options.folderId || null,
            userId: options.userId || null,
            userEmail: options.userEmail || null,
            downloadCount: 0,
            isPasswordProtected,
            passwordHash,
            expiresAt,
            isPublic: options.isPublic ?? true,
            shortCode,
            directUrl,
            createdAt: new Date().toISOString(),
          }
          await localDb.saveFile(record, file)
          onProgress?.(100)
          return record
        }
        throw new Error(`Database insert failed: ${dbError.message}`)
      }

      onProgress?.(100)

      return {
        id: rowData.id,
        name: rowData.name,
        originalName: rowData.original_name,
        size: rowData.size,
        mimeType: rowData.mime_type,
        storagePath: rowData.storage_path,
        folderId: rowData.folder_id,
        userId: rowData.user_id || options.userId || null,
        userEmail: rowData.user_email || options.userEmail || null,
        downloadCount: rowData.download_count,
        isPasswordProtected: rowData.is_password_protected,
        passwordHash: rowData.password_hash,
        expiresAt: rowData.expires_at,
        isPublic: rowData.is_public,
        shortCode: rowData.short_code,
        directUrl: rowData.direct_url,
        createdAt: rowData.created_at,
      }
    } else {
      // File exceeds 50MB or in Private Local Vault mode
      return this.uploadToLocalVault(
        file,
        fileId,
        shortCode,
        storagePath,
        isPasswordProtected,
        passwordHash,
        expiresAt,
        options,
        onProgress
      )
    }
  }

  // Upload handler for high-capacity local IndexedDB vault
  private async uploadToLocalVault(
    file: File,
    fileId: string,
    shortCode: string,
    storagePath: string,
    isPasswordProtected: boolean,
    passwordHash: string | null,
    expiresAt: string | null,
    options: UploadOptions,
    onProgress?: (progress: number) => void
  ): Promise<FileRecord> {
    const steps = [25, 55, 80, 95]
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 60))
      onProgress?.(step)
    }

    const directUrl = `${window.location.origin}?share=${shortCode}`
    const record: FileRecord = {
      id: fileId,
      name: file.name,
      originalName: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      storagePath,
      folderId: options.folderId || null,
      userId: options.userId || null,
      userEmail: options.userEmail || null,
      downloadCount: 0,
      isPasswordProtected,
      passwordHash,
      expiresAt,
      isPublic: options.isPublic ?? true,
      shortCode,
      directUrl,
      createdAt: new Date().toISOString(),
    }

    await localDb.saveFile(record, file)
    onProgress?.(100)
    return record
  }

  // Get all files (optionally filtered by folder)
  public async getFiles(folderId?: string | null): Promise<FileRecord[]> {
    const client = supabaseService.getClient()

    if (this.isSupabase() && client) {
      let query = client.from('files').select('*').order('created_at', { ascending: false })

      if (folderId !== undefined) {
        if (folderId === null) {
          query = query.is('folder_id', null)
        } else {
          query = query.eq('folder_id', folderId)
        }
      }

      const { data, error } = await query
      if (error) {
        if (
          error.message.includes('Could not find the table') ||
          error.message.includes('does not exist') ||
          error.code === 'PGRST205'
        ) {
          return localDb.getAllFiles(folderId)
        }
        console.error('Supabase getFiles error:', error)
        return []
      }

      const localFiles = await localDb.getAllFiles(folderId)
      const mergedMap = new Map<string, FileRecord>()

      for (const row of (data || [])) {
        mergedMap.set(row.id, {
          id: row.id,
          name: row.name,
          originalName: row.original_name,
          size: row.size,
          mimeType: row.mime_type,
          storagePath: row.storage_path,
          folderId: row.folder_id,
          userId: row.user_id || row.userId || null,
          userEmail: row.user_email || row.userEmail || null,
          downloadCount: row.download_count || 0,
          isPasswordProtected: row.is_password_protected || false,
          passwordHash: row.password_hash,
          expiresAt: row.expires_at,
          isPublic: row.is_public ?? true,
          shortCode: row.short_code,
          directUrl: row.direct_url,
          createdAt: row.created_at,
        })
      }

      for (const lf of localFiles) {
        if (!mergedMap.has(lf.id)) {
          mergedMap.set(lf.id, lf)
        }
      }

      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else {
      return localDb.getAllFiles(folderId)
    }
  }

  // Find file by short code (for public share page)
  public async getFileByShortCode(shortCode: string): Promise<FileRecord | null> {
    if (this.ephemeralFiles.has(shortCode)) {
      return this.ephemeralFiles.get(shortCode)!.record
    }

    const client = supabaseService.getClient()

    if (this.isSupabase() && client) {
      const { data, error } = await client
        .from('files')
        .select('*')
        .eq('short_code', shortCode)
        .maybeSingle()

      if (error || !data) {
        return localDb.getFileByShortCode(shortCode)
      }

      return {
        id: data.id,
        name: data.name,
        originalName: data.original_name,
        size: data.size,
        mimeType: data.mime_type,
        storagePath: data.storage_path,
        folderId: data.folder_id,
        userId: data.user_id || data.userId || null,
        userEmail: data.user_email || data.userEmail || null,
        downloadCount: data.download_count || 0,
        isPasswordProtected: data.is_password_protected || false,
        passwordHash: data.password_hash,
        expiresAt: data.expires_at,
        isPublic: data.is_public ?? true,
        shortCode: data.short_code,
        directUrl: data.direct_url,
        createdAt: data.created_at,
      }
    } else {
      return localDb.getFileByShortCode(shortCode)
    }
  }

  // Fetch actual blob for preview or download
  public async getFileBlob(file: FileRecord): Promise<Blob> {
    // 0. Check ephemeral in-memory cache for guest files
    if (this.ephemeralFiles.has(file.id)) {
      return this.ephemeralFiles.get(file.id)!.blob
    }
    if (this.ephemeralFiles.has(file.shortCode)) {
      return this.ephemeralFiles.get(file.shortCode)!.blob
    }

    const client = supabaseService.getClient()
    const settings = supabaseService.getSettings()

    // 1. Check local high-capacity vault first
    const localBlob = await localDb.getBlob(file.id)
    if (localBlob) {
      return localBlob
    }

    // 2. Fetch from Supabase Cloud Storage
    if (this.isSupabase() && client) {
      const { data, error } = await client.storage
        .from(settings.bucket)
        .download(file.storagePath)

      if (!error && data) {
        return data
      }

      // Fallback to direct fetch if remote CDN URL
      if (file.directUrl && file.directUrl.startsWith('http') && !file.directUrl.includes(window.location.host)) {
        const res = await fetch(file.directUrl)
        if (res.ok) return res.blob()
      }
    }

    throw new Error('File data could not be retrieved from cloud or local vault.')
  }

  // Increment download counter
  public async incrementDownload(shortCode: string): Promise<void> {
    const client = supabaseService.getClient()

    if (this.isSupabase() && client) {
      try {
        await client.rpc('increment_download', { p_short_code: shortCode })
      } catch (err) {
        console.warn('RPC increment_download failed, fallback to direct update', err)
        const { data } = await client
          .from('files')
          .select('download_count')
          .eq('short_code', shortCode)
          .single()
        if (data) {
          await client
            .from('files')
            .update({ download_count: (data.download_count || 0) + 1 })
            .eq('short_code', shortCode)
        }
      }
    } else {
      await localDb.incrementDownload(shortCode)
    }
  }

  // Delete single file
  public async deleteFile(file: FileRecord): Promise<void> {
    if (file.isEphemeral || this.ephemeralFiles.has(file.id)) {
      this.ephemeralFiles.delete(file.id)
      this.ephemeralFiles.delete(file.shortCode)
      return
    }

    const client = supabaseService.getClient()
    const settings = supabaseService.getSettings()

    if (this.isSupabase() && client) {
      await client.storage.from(settings.bucket).remove([file.storagePath])
      await client.from('files').delete().eq('id', file.id)
    } else {
      await localDb.deleteFile(file.id)
    }
  }

  // Delete multiple files
  public async deleteMultipleFiles(files: FileRecord[]): Promise<void> {
    const client = supabaseService.getClient()
    const settings = supabaseService.getSettings()

    if (this.isSupabase() && client) {
      const paths = files.map((f) => f.storagePath)
      const ids = files.map((f) => f.id)
      await client.storage.from(settings.bucket).remove(paths)
      await client.from('files').delete().in('id', ids)
    } else {
      await localDb.deleteMultipleFiles(files.map((f) => f.id))
    }
  }

  // Folders
  public async getFolders(parentId?: string | null): Promise<FolderRecord[]> {
    const client = supabaseService.getClient()

    if (this.isSupabase() && client) {
      let query = client.from('folders').select('*').order('name', { ascending: true })
      if (parentId !== undefined) {
        if (parentId === null) {
          query = query.is('parent_id', null)
        } else {
          query = query.eq('parent_id', parentId)
        }
      }
      const { data, error } = await query
      if (error) {
        return localDb.getAllFolders()
      }
      return (data || []).map((r) => ({
        id: r.id,
        name: r.name,
        parentId: r.parent_id,
        createdAt: r.created_at,
      }))
    } else {
      const all = await localDb.getAllFolders()
      if (parentId !== undefined) {
        return all.filter((f) => (parentId === null ? !f.parentId : f.parentId === parentId))
      }
      return all
    }
  }

  public async createFolder(name: string, parentId?: string | null, userId?: string | null): Promise<FolderRecord> {
    const client = supabaseService.getClient()
    const folder: FolderRecord = {
      id: crypto.randomUUID(),
      name: name.trim(),
      parentId: parentId || null,
      userId: userId || null,
      createdAt: new Date().toISOString(),
    }

    if (this.isSupabase() && client) {
      const { data, error } = await client
        .from('folders')
        .insert({
          id: folder.id,
          name: folder.name,
          parent_id: folder.parentId,
        })
        .select()
        .single()

      if (error) {
        console.warn('Folders table not created yet in Supabase, saving folder to localDb')
        await localDb.saveFolder(folder)
        return folder
      }
      return {
        id: data.id,
        name: data.name,
        parentId: data.parent_id,
        createdAt: data.created_at,
      }
    } else {
      await localDb.saveFolder(folder)
      return folder
    }
  }

  public async deleteFolder(folderId: string): Promise<void> {
    const client = supabaseService.getClient()

    if (this.isSupabase() && client) {
      await client.from('folders').delete().eq('id', folderId)
    } else {
      await localDb.deleteFolder(folderId)
    }
  }

  // Aggregated storage stats
  public async getStorageStats(): Promise<StorageStats> {
    const files = await this.getFiles()
    let totalBytes = 0
    let downloadCount = 0
    const categoryBreakdown = {
      images: 0,
      videos: 0,
      audio: 0,
      documents: 0,
      code: 0,
      archives: 0,
    }

    for (const f of files) {
      const sz = Number(f.size) || 0
      totalBytes += sz
      downloadCount += Number(f.downloadCount) || 0

      const cat = getFileCategory(f.mimeType, f.name)
      if (cat in categoryBreakdown) {
        categoryBreakdown[cat as keyof typeof categoryBreakdown] += sz
      }
    }

    return {
      totalBytes,
      fileCount: files.length,
      downloadCount,
      categoryBreakdown,
    }
  }
}

export const storageEngine = new UnifiedStorageEngine()
