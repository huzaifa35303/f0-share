import { FileRecord, FolderRecord } from '../types'

const DB_NAME = 'f0_share_local_vault'
const DB_VERSION = 1

interface LocalBlobRecord {
  id: string
  blob: Blob
}

class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Files store
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' })
          fileStore.createIndex('shortCode', 'shortCode', { unique: true })
          fileStore.createIndex('folderId', 'folderId', { unique: false })
          fileStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Folders store
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' })
          folderStore.createIndex('parentId', 'parentId', { unique: false })
        }

        // Blobs store (stores raw binary data)
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs', { keyPath: 'id' })
        }
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })

    return this.dbPromise
  }

  // Files
  async saveFile(record: FileRecord, fileBlob: Blob): Promise<void> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files', 'blobs'], 'readwrite')
      const fileStore = tx.objectStore('files')
      const blobStore = tx.objectStore('blobs')

      fileStore.put(record)
      blobStore.put({ id: record.id, blob: fileBlob } as LocalBlobRecord)

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async getAllFiles(folderId?: string | null): Promise<FileRecord[]> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly')
      const store = tx.objectStore('files')
      const request = store.getAll()

      request.onsuccess = () => {
        const all: FileRecord[] = request.result || []
        // Filter by folder if specified
        if (folderId !== undefined) {
          resolve(all.filter((f) => (folderId === null ? !f.folderId : f.folderId === folderId)))
        } else {
          resolve(all)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getFileByShortCode(shortCode: string): Promise<FileRecord | null> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly')
      const store = tx.objectStore('files')
      const index = store.index('shortCode')
      const request = index.get(shortCode)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getFileById(id: string): Promise<FileRecord | null> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly')
      const store = tx.objectStore('files')
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getBlob(id: string): Promise<Blob | null> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('blobs', 'readonly')
      const store = tx.objectStore('blobs')
      const request = store.get(id)

      request.onsuccess = () => {
        const res = request.result as LocalBlobRecord | undefined
        resolve(res ? res.blob : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async incrementDownload(shortCode: string): Promise<void> {
    const file = await this.getFileByShortCode(shortCode)
    if (!file) return

    file.downloadCount = (file.downloadCount || 0) + 1
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite')
      const store = tx.objectStore('files')
      store.put(file)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async deleteFile(id: string): Promise<void> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files', 'blobs'], 'readwrite')
      tx.objectStore('files').delete(id)
      tx.objectStore('blobs').delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async deleteMultipleFiles(ids: string[]): Promise<void> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files', 'blobs'], 'readwrite')
      const fStore = tx.objectStore('files')
      const bStore = tx.objectStore('blobs')
      for (const id of ids) {
        fStore.delete(id)
        bStore.delete(id)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Folders
  async saveFolder(folder: FolderRecord): Promise<void> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite')
      tx.objectStore('folders').put(folder)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async getAllFolders(): Promise<FolderRecord[]> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readonly')
      const store = tx.objectStore('folders')
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFolder(id: string): Promise<void> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('folders', 'readwrite')
      tx.objectStore('folders').delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }
}

export const localDb = new IndexedDbService()
