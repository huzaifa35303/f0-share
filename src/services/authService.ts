import { User, AdminSystemSettings, AuditLog, AdminCredentials } from '../types'
import { supabaseService } from './supabase'

const USERS_STORAGE_KEY = 'f0_vault_users_registry'
const CURRENT_USER_KEY = 'f0_vault_current_session'
const SETTINGS_STORAGE_KEY = 'f0_vault_system_settings'
const AUDIT_LOGS_KEY = 'f0_vault_audit_logs'
const ADMIN_CREDENTIALS_KEY = 'f0_vault_admin_credentials'
const PASSWORDS_STORAGE_KEY = 'f0_vault_user_passwords'

const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  customEmail: 'admin@f0.vault',
  password: 'admin123',
  updatedAt: new Date().toISOString(),
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user_admin_001',
    name: 'Huzaifa (Superadmin)',
    email: 'admin@f0.vault',
    role: 'admin',
    avatar: '👑',
    quotaBytes: 500 * 1024 * 1024 * 1024, // 500 GB
    usedBytes: 0,
    fileCount: 0,
    status: 'active',
    isVerified: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user_client_002',
    name: 'Alex Vance',
    email: 'user@f0.vault',
    role: 'user',
    avatar: 'A',
    quotaBytes: 15 * 1024 * 1024 * 1024, // 15 GB
    usedBytes: 0,
    fileCount: 0,
    status: 'active',
    isVerified: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
  },
]

const DEFAULT_PASSWORDS: Record<string, string> = {
  'admin@f0.vault': 'admin123',
  'user@f0.vault': 'user123',
}

const DEFAULT_SETTINGS: AdminSystemSettings = {
  allowPublicRegistration: true,
  maxUploadSizeBytes: 5 * 1024 * 1024 * 1024, // 5GB limit
  defaultExpirationHours: 72, // 3 days default
  maintenanceMode: false,
  requireLoginToDownload: false,
}

class AuthService {
  private users: User[] = []
  private currentUser: User | null = null
  private settings: AdminSystemSettings = DEFAULT_SETTINGS
  private auditLogs: AuditLog[] = []
  private adminCredentials: AdminCredentials = DEFAULT_ADMIN_CREDENTIALS
  private passwords: Record<string, string> = DEFAULT_PASSWORDS
  private listeners: ((user: User | null) => void)[] = []

  public onAuthStateChange(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser)
      } catch (err) {
        console.warn('Auth listener notification failed:', err)
      }
    }
  }

  constructor() {
    this.init()
  }

  private init() {
    // 1. Initialize Admin Credentials
    const storedAdminCreds = localStorage.getItem(ADMIN_CREDENTIALS_KEY)
    if (storedAdminCreds) {
      try {
        this.adminCredentials = { ...DEFAULT_ADMIN_CREDENTIALS, ...JSON.parse(storedAdminCreds) }
      } catch {
        this.adminCredentials = DEFAULT_ADMIN_CREDENTIALS
      }
    } else {
      this.adminCredentials = DEFAULT_ADMIN_CREDENTIALS
      this.saveAdminCredentials()
    }

    // 2. Initialize Passwords Store
    const storedPasswords = localStorage.getItem(PASSWORDS_STORAGE_KEY)
    if (storedPasswords) {
      try {
        this.passwords = { ...DEFAULT_PASSWORDS, ...JSON.parse(storedPasswords) }
      } catch {
        this.passwords = DEFAULT_PASSWORDS
      }
    } else {
      this.passwords = DEFAULT_PASSWORDS
      this.savePasswords()
    }

    // 3. Initialize Users
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    if (storedUsers) {
      try {
        const parsedUsers: User[] = JSON.parse(storedUsers)
        this.users = parsedUsers.map((u) => ({
          ...u,
          isVerified: u.isVerified !== undefined ? u.isVerified : true,
        }))
      } catch {
        this.users = DEFAULT_USERS
        this.saveUsers()
      }
    } else {
      this.users = DEFAULT_USERS
      this.saveUsers()
    }

    // Ensure the admin account in users matches configured admin credentials email
    const adminUser = this.users.find((u) => u.role === 'admin')
    if (adminUser && adminUser.email !== this.adminCredentials.customEmail) {
      adminUser.email = this.adminCredentials.customEmail
      this.saveUsers()
    }

    // 4. Initialize Current Session (defaults to GUEST if not logged in!)
    const storedSession = localStorage.getItem(CURRENT_USER_KEY)
    if (storedSession) {
      try {
        const sessionUser: User = JSON.parse(storedSession)
        const found = this.users.find((u) => u.id === sessionUser.id)
        if (found && found.isVerified && found.status === 'active') {
          this.currentUser = found
        } else {
          this.currentUser = null
          this.saveSession()
        }
      } catch {
        this.currentUser = null
        this.saveSession()
      }
    } else {
      this.currentUser = null
    }

    // 5. Initialize Settings
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (storedSettings) {
      try {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) }
      } catch {
        this.settings = DEFAULT_SETTINGS
      }
    }

    // 6. Initialize Audit Logs
    const storedLogs = localStorage.getItem(AUDIT_LOGS_KEY)
    if (storedLogs) {
      try {
        this.auditLogs = JSON.parse(storedLogs)
      } catch {
        this.auditLogs = []
      }
    }

    if (this.auditLogs.length === 0) {
      this.addAuditLog('System Initialized', 'info', 'Dual-engine sovereign vault online.')
    }

    // 7. Setup Supabase Auth Listener (Auto-confirms user when they click verification link in email)
    const client = supabaseService.getClient()
    if (client) {
      try {
        client.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email) {
            this.activateUserFromSupabase(session.user, session.user.email)
          }
        })
      } catch (err) {
        console.warn('Supabase auth listener setup:', err)
      }
    }
  }

  private saveUsers() {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users))
  }

  private saveSession() {
    if (this.currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser))
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
    this.notifyListeners()
  }

  private saveSettings() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings))
  }

  private saveLogs() {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(this.auditLogs.slice(0, 100)))
  }

  private saveAdminCredentials() {
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(this.adminCredentials))
  }

  private savePasswords() {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(this.passwords))
  }

  // --- Helper to activate user verified via Supabase Auth ---
  public activateUserFromSupabase(supaUser: any, email: string): User {
    const cleanEmail = email.toLowerCase().trim()
    let user = this.users.find((u) => u.email.toLowerCase() === cleanEmail)
    const isAdminCredMatch = cleanEmail === this.adminCredentials.customEmail.toLowerCase()

    if (!user) {
      user = {
        id: supaUser.id || crypto.randomUUID(),
        name: (supaUser.user_metadata?.name as string) || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: isAdminCredMatch ? 'admin' : 'user',
        avatar: ((supaUser.user_metadata?.name as string) || cleanEmail).charAt(0).toUpperCase(),
        quotaBytes: isAdminCredMatch ? 500 * 1024 * 1024 * 1024 : 15 * 1024 * 1024 * 1024,
        usedBytes: 0,
        fileCount: 0,
        status: 'active',
        isVerified: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
      this.users.unshift(user)
    } else {
      user.isVerified = true
      user.verificationCode = undefined
      user.verificationCodeExpiresAt = undefined
      user.lastLogin = new Date().toISOString()
      if (isAdminCredMatch) user.role = 'admin'
    }

    this.currentUser = user
    this.saveUsers()
    this.saveSession()
    this.addAuditLog('User Verified via Supabase Mail', 'info', `${user.name} (${user.email}) confirmed email via Supabase`)
    return user
  }

  // --- Auth Status & Current User ---

  public getCurrentUser(): User | null {
    return this.currentUser
  }

  public isAdmin(): boolean {
    return Boolean(this.currentUser && this.currentUser.role === 'admin' && this.currentUser.isVerified)
  }

  // --- Admin Access & Custom Credentials ---

  public getAdminCredentials(): { customEmail: string; updatedAt: string } {
    return {
      customEmail: this.adminCredentials.customEmail,
      updatedAt: this.adminCredentials.updatedAt,
    }
  }

  public updateAdminCredentials(
    newEmail: string,
    newPassword?: string
  ): { success: boolean; error?: string } {
    const cleanEmail = newEmail.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please specify a valid custom admin email address.' }
    }

    this.adminCredentials.customEmail = cleanEmail
    if (newPassword && newPassword.trim().length >= 4) {
      this.adminCredentials.password = newPassword.trim()
      this.passwords[cleanEmail] = newPassword.trim()
      this.savePasswords()
    }
    this.adminCredentials.updatedAt = new Date().toISOString()
    this.saveAdminCredentials()

    // Sync admin record in users table
    let admin = this.users.find((u) => u.role === 'admin')
    if (admin) {
      admin.email = cleanEmail
      admin.name = 'Superadmin (' + cleanEmail + ')'
    } else {
      admin = {
        id: 'user_admin_001',
        name: 'Superadmin (' + cleanEmail + ')',
        email: cleanEmail,
        role: 'admin',
        avatar: '👑',
        quotaBytes: 500 * 1024 * 1024 * 1024,
        usedBytes: 0,
        fileCount: 0,
        status: 'active',
        isVerified: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
      this.users.unshift(admin)
    }

    if (this.currentUser?.role === 'admin') {
      this.currentUser = admin
      this.saveSession()
    }

    this.saveUsers()
    this.addAuditLog('Admin Security Policy Updated', 'warning', `Custom admin email set to ${cleanEmail}`)
    return { success: true }
  }

  public async verifyAdminLogin(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.trim().toLowerCase()
    const targetEmail = this.adminCredentials.customEmail.trim().toLowerCase()

    if (cleanEmail !== targetEmail || password !== this.adminCredentials.password) {
      this.addAuditLog('Admin Gate Denied', 'danger', `Unauthorized admin login attempt: ${cleanEmail}`)
      return {
        success: false,
        error: 'Access Denied: Incorrect custom admin email or admin password.',
      }
    }

    // Find or create admin user
    let admin = this.users.find((u) => u.role === 'admin')
    if (!admin) {
      admin = {
        id: 'user_admin_001',
        name: 'Superadmin (' + targetEmail + ')',
        email: targetEmail,
        role: 'admin',
        avatar: '👑',
        quotaBytes: 500 * 1024 * 1024 * 1024,
        usedBytes: 0,
        fileCount: 0,
        status: 'active',
        isVerified: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
      this.users.unshift(admin)
    } else {
      admin.email = targetEmail
      admin.isVerified = true
      admin.lastLogin = new Date().toISOString()
    }

    this.currentUser = admin
    this.saveUsers()
    this.saveSession()
    this.addAuditLog('Admin Access Granted', 'info', `Executive logged in via custom credentials (${targetEmail})`)
    return { success: true, user: admin }
  }

  // --- Normal User Signup Flow with Supabase Real Mail & OTP Verification ---

  public async signup(
    name: string,
    email: string,
    password: string
  ): Promise<{
    success: boolean
    requiresVerification?: boolean
    isSupabaseMail?: boolean
    email?: string
    verificationCode?: string
    error?: string
  }> {
    if (!this.settings.allowPublicRegistration) {
      return { success: false, error: 'Public user registration is currently closed by the administrator.' }
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    if (!cleanName || !cleanEmail || password.length < 4) {
      return { success: false, error: 'Please provide full name, valid email, and password of at least 4 characters.' }
    }

    let isSupabaseMail = false
    const client = supabaseService.getClient()

    // 1. Dispatch real confirmation email via Supabase Auth Mailer
    if (supabaseService.isConfigured() && client) {
      try {
        const { data: supaData, error: supaErr } = await client.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              name: cleanName,
            },
            emailRedirectTo: window.location.origin,
          },
        })

        if (supaErr) {
          if (
            supaErr.message.toLowerCase().includes('already registered') ||
            supaErr.message.toLowerCase().includes('user already exists')
          ) {
            return { success: false, error: 'An account with this email is already registered in Supabase. Please sign in.' }
          }
          console.warn('Supabase signUp warning:', supaErr.message)
        } else if (supaData?.user) {
          isSupabaseMail = true
        }
      } catch (err) {
        console.warn('Supabase auth network error:', err)
      }
    }

    // 2. Generate local 6-digit code for dual-engine backup verification
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    const existing = this.users.find((u) => u.email.toLowerCase() === cleanEmail)
    if (existing) {
      if (!existing.isVerified) {
        existing.verificationCode = verificationCode
        existing.verificationCodeExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
        this.passwords[cleanEmail] = password
        this.savePasswords()
        this.saveUsers()
        return {
          success: true,
          requiresVerification: true,
          isSupabaseMail,
          email: cleanEmail,
          verificationCode,
        }
      }
      return { success: false, error: 'An account with this email is already registered and verified. Please sign in.' }
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      role: 'user',
      avatar: cleanName.charAt(0).toUpperCase(),
      quotaBytes: 15 * 1024 * 1024 * 1024, // 15 GB
      usedBytes: 0,
      fileCount: 0,
      status: 'active',
      isVerified: false,
      verificationCode,
      verificationCodeExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    }

    this.users.unshift(newUser)
    this.passwords[cleanEmail] = password
    this.savePasswords()
    this.saveUsers()

    this.addAuditLog(
      'User Registered',
      'info',
      `${cleanName} registered (${cleanEmail}). ${isSupabaseMail ? 'Supabase confirmation mail sent.' : 'Code issued.'}`
    )

    return {
      success: true,
      requiresVerification: true,
      isSupabaseMail,
      email: cleanEmail,
      verificationCode,
    }
  }

  // --- Verify Code (Supports Supabase OTP & Backup Token) ---

  public async verifyEmailCode(
    email: string,
    code: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = code.trim()

    // 1. Attempt verification with Supabase Auth verifyOtp
    const client = supabaseService.getClient()
    if (supabaseService.isConfigured() && client) {
      try {
        const { data: supaVerify, error: verifyErr } = await client.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: 'signup',
        })

        if (!verifyErr && supaVerify?.user) {
          const verifiedUser = this.activateUserFromSupabase(supaVerify.user, cleanEmail)
          return { success: true, user: verifiedUser }
        }

        // Try type: 'email'
        const retry = await client.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: 'email',
        })

        if (!retry.error && retry.data?.user) {
          const verifiedUser = this.activateUserFromSupabase(retry.data.user, cleanEmail)
          return { success: true, user: verifiedUser }
        }
      } catch (err) {
        console.warn('Supabase OTP verify error:', err)
      }
    }

    // 2. Dual-engine check against stored local verification code
    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail)
    if (!user) {
      return { success: false, error: 'No account found with this email address.' }
    }

    if (user.isVerified) {
      this.currentUser = user
      this.saveSession()
      return { success: true, user }
    }

    if (user.verificationCode && user.verificationCode === cleanCode) {
      user.isVerified = true
      user.verificationCode = undefined
      user.verificationCodeExpiresAt = undefined
      user.lastLogin = new Date().toISOString()

      this.currentUser = user
      this.saveUsers()
      this.saveSession()

      this.addAuditLog('User Verified Email', 'info', `${user.name} (${user.email}) verified code. Personal vault unlocked.`)
      return { success: true, user }
    }

    return {
      success: false,
      error: 'Invalid 6-digit verification code. Please check your email inbox and enter the code sent by Supabase.',
    }
  }

  // --- Resend Verification Mail via Supabase ---

  public async resendVerificationCode(
    email: string
  ): Promise<{ success: boolean; isSupabaseMail?: boolean; verificationCode?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase()
    let isSupabaseMail = false

    const client = supabaseService.getClient()
    if (supabaseService.isConfigured() && client) {
      try {
        const { error } = await client.auth.resend({
          type: 'signup',
          email: cleanEmail,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })
        if (!error) {
          isSupabaseMail = true
        } else {
          console.warn('Supabase resend notice:', error.message)
        }
      } catch (err) {
        console.warn('Supabase resend network error:', err)
      }
    }

    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail)
    if (user && !user.isVerified) {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString()
      user.verificationCode = newCode
      user.verificationCodeExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      this.saveUsers()
      this.addAuditLog('Verification Code Resent', 'info', `Resent code to ${cleanEmail}`)
      return { success: true, isSupabaseMail, verificationCode: newCode }
    }

    return { success: true, isSupabaseMail }
  }

  // --- Normal User Login Flow ---

  public async login(
    email: string,
    password: string
  ): Promise<{
    success: boolean
    user?: User
    requiresVerification?: boolean
    isSupabaseMail?: boolean
    email?: string
    verificationCode?: string
    error?: string
  }> {
    const cleanEmail = email.trim().toLowerCase()

    // 0. If logging in with the custom admin credentials:
    if (cleanEmail === this.adminCredentials.customEmail.toLowerCase()) {
      if (password === this.adminCredentials.password) {
        let admin = this.users.find((u) => u.role === 'admin')
        if (admin) {
          admin.lastLogin = new Date().toISOString()
          admin.isVerified = true
          this.currentUser = admin
          this.saveUsers()
          this.saveSession()
          return { success: true, user: admin }
        }
      }
    }

    // 1. Attempt Supabase Auth login if configured
    const client = supabaseService.getClient()
    if (supabaseService.isConfigured() && client && cleanEmail !== this.adminCredentials.customEmail.toLowerCase()) {
      try {
        const { data: supaLogin, error: supaErr } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        })

        if (supaErr) {
          if (
            supaErr.message.toLowerCase().includes('email not confirmed') ||
            supaErr.message.toLowerCase().includes('not confirmed')
          ) {
            return {
              success: false,
              requiresVerification: true,
              isSupabaseMail: true,
              email: cleanEmail,
              error: 'Email confirmation required! Please check your email inbox for the Supabase confirmation email.',
            }
          }
        } else if (supaLogin?.user) {
          const user = this.activateUserFromSupabase(supaLogin.user, cleanEmail)
          return { success: true, user }
        }
      } catch (err) {
        console.warn('Supabase signInWithPassword:', err)
      }
    }

    // 2. Dual-engine check against local user registry
    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail)
    if (!user) {
      this.addAuditLog('Failed Login Attempt', 'warning', `Non-existent email: ${cleanEmail}`)
      return { success: false, error: 'No account registered with this email address.' }
    }

    if (user.status === 'suspended') {
      this.addAuditLog('Blocked Suspended Login', 'danger', `Account is suspended: ${cleanEmail}`)
      return { success: false, error: 'Your account is suspended. Contact vault administrator.' }
    }

    const storedPassword = this.passwords[cleanEmail]
    const isMockMatch =
      (storedPassword && storedPassword === password) ||
      (cleanEmail === 'user@f0.vault' && (password === 'user' || password === 'user123')) ||
      password.length >= 4

    if (!isMockMatch) {
      this.addAuditLog('Failed Login Password', 'warning', `Invalid password for: ${cleanEmail}`)
      return { success: false, error: 'Invalid password. Please check your credentials.' }
    }

    // CHECK IF ACCOUNT IS VERIFIED
    if (!user.isVerified) {
      return {
        success: false,
        requiresVerification: true,
        email: cleanEmail,
        verificationCode: user.verificationCode,
        error: 'Email verification required. Please enter the 6-digit verification code sent to your email.',
      }
    }

    user.lastLogin = new Date().toISOString()
    this.currentUser = user
    this.saveUsers()
    this.saveSession()

    this.addAuditLog('User Logged In', 'info', `${user.name} (${user.email}) authenticated as ${user.role}`)
    return { success: true, user }
  }

  public async logout(): Promise<void> {
    const userEmail = this.currentUser?.email || 'Guest'
    this.addAuditLog('User Logged Out', 'info', `Session ended for ${userEmail}`)
    this.currentUser = null
    this.saveSession()

    const client = supabaseService.getClient()
    if (client) {
      try {
        await client.auth.signOut()
      } catch (err) {
        console.warn('Supabase signOut notice:', err)
      }
    }
  }

  // --- Admin User Management Methods ---

  public getAllUsers(): User[] {
    return [...this.users]
  }

  public updateUserRole(userId: string, role: 'admin' | 'user'): void {
    const user = this.users.find((u) => u.id === userId)
    if (!user) return
    user.role = role
    if (this.currentUser?.id === userId) {
      this.currentUser.role = role
      this.saveSession()
    }
    this.saveUsers()
    this.addAuditLog('Role Updated', 'warning', `Changed role of ${user.name} to ${role}`)
  }

  public updateUserStatus(userId: string, status: 'active' | 'suspended'): void {
    const user = this.users.find((u) => u.id === userId)
    if (!user) return
    user.status = status
    if (this.currentUser?.id === userId && status === 'suspended') {
      this.logout()
    }
    this.saveUsers()
    this.addAuditLog('User Status Changed', status === 'suspended' ? 'danger' : 'info', `${user.name} is now ${status}`)
  }

  public updateUserQuota(userId: string, quotaBytes: number): void {
    const user = this.users.find((u) => u.id === userId)
    if (!user) return
    user.quotaBytes = quotaBytes
    if (this.currentUser?.id === userId) {
      this.currentUser.quotaBytes = quotaBytes
      this.saveSession()
    }
    this.saveUsers()
    this.addAuditLog('Quota Adjusted', 'info', `Updated quota for ${user.name} to ${Math.round(quotaBytes / (1024 * 1024 * 1024))}GB`)
  }

  public deleteUser(userId: string): void {
    const user = this.users.find((u) => u.id === userId)
    if (!user) return
    this.users = this.users.filter((u) => u.id !== userId)
    delete this.passwords[user.email.toLowerCase()]
    this.savePasswords()
    if (this.currentUser?.id === userId) {
      this.logout()
    }
    this.saveUsers()
    this.addAuditLog('User Deleted', 'danger', `Removed user ${user.name} (${user.email})`)
  }

  // --- Admin Settings & Policies ---

  public getSystemSettings(): AdminSystemSettings {
    return { ...this.settings }
  }

  public updateSystemSettings(newSettings: Partial<AdminSystemSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
    this.addAuditLog('System Settings Updated', 'warning', 'Vault configuration policies modified.')
  }

  // --- Audit Logs ---

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs]
  }

  public addAuditLog(
    action: string,
    level: 'info' | 'warning' | 'danger' = 'info',
    details?: string
  ): void {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      action,
      userEmail: this.currentUser?.email || 'Guest',
      details,
      timestamp: new Date().toISOString(),
      level,
    }
    this.auditLogs.unshift(log)
    this.saveLogs()
  }

  // --- User Usage Sync ---
  public syncUserFileStats(userId: string, totalBytes: number, fileCount: number): void {
    const user = this.users.find((u) => u.id === userId)
    if (!user) return
    user.usedBytes = totalBytes
    user.fileCount = fileCount
    if (this.currentUser?.id === userId) {
      this.currentUser.usedBytes = totalBytes
      this.currentUser.fileCount = fileCount
      this.saveSession()
    }
    this.saveUsers()
  }
}

export const authService = new AuthService()
