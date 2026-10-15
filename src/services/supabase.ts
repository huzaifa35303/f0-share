import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SupabaseSettings } from '../types'

const STORAGE_KEY = 'f0_share_supabase_settings'

class SupabaseService {
  private client: SupabaseClient | null = null
  private settings: SupabaseSettings = {
    url: '',
    anonKey: '',
    bucket: 'f0-share-vault',
    isConnected: false,
  }

  constructor() {
    this.initSettings()
  }

  private initSettings() {
    const envUrl = import.meta.env.VITE_SUPABASE_URL
    const envKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
    const envBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'f0-share-vault'

    // 1. Check localStorage first
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.url && parsed.anonKey) {
          this.settings = { ...this.settings, ...parsed }
          this.setupClient(parsed.url, parsed.anonKey)
          return
        }
      } catch (e) {
        console.error('Failed to parse saved Supabase settings:', e)
      }
    }

    // 2. Fallback to Vite env variables
    if (envUrl && envKey) {
      this.settings = {
        url: envUrl,
        anonKey: envKey,
        bucket: envBucket,
        isConnected: true,
      }
      this.setupClient(envUrl, envKey)
    }
  }

  private setupClient(url: string, key: string) {
    try {
      this.client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    } catch (err) {
      console.error('Error creating Supabase client:', err)
      this.client = null
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client
  }

  public getSettings(): SupabaseSettings {
    return { ...this.settings }
  }

  public isConfigured(): boolean {
    return Boolean(this.client && this.settings.url && this.settings.anonKey)
  }

  public async updateSettings(
    url: string,
    anonKey: string,
    bucket = 'f0-share-vault'
  ): Promise<{ success: boolean; message: string }> {
    if (!url.trim() || !anonKey.trim()) {
      // Clear settings to switch to Local mode
      this.settings = {
        url: '',
        anonKey: '',
        bucket: 'f0-share-vault',
        isConnected: false,
      }
      this.client = null
      localStorage.removeItem(STORAGE_KEY)
      return { success: true, message: 'Switched to Local Vault mode.' }
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return { success: false, message: 'Invalid Supabase URL format.' }
    }

    try {
      const testClient = createClient(url, anonKey)
      // Test querying files table or bucket
      const { error } = await testClient.from('files').select('id').limit(1)

      if (error && error.code !== 'PGRST116' && !error.message.includes('0 rows')) {
        // Even if table doesn't exist yet, we can check if credentials are authenticated
        if (error.message.includes('relation "public.files" does not exist')) {
          // Connected to Supabase, but schema needs to be run!
          this.settings = { url, anonKey, bucket, isConnected: true }
          this.client = testClient
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
          return {
            success: true,
            message: 'Connected to Supabase! Note: Please run supabase-schema.sql to create the tables.',
          }
        }
        return { success: false, message: `Supabase Error: ${error.message}` }
      }

      this.settings = { url, anonKey, bucket, isConnected: true }
      this.client = testClient
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
      return { success: true, message: 'Successfully connected to Supabase Cloud!' }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, message: `Connection failed: ${msg}` }
    }
  }

  public clearSettings() {
    this.settings = {
      url: '',
      anonKey: '',
      bucket: 'f0-share-vault',
      isConnected: false,
    }
    this.client = null
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const supabaseService = new SupabaseService()
