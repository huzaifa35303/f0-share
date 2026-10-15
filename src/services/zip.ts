import JSZip from 'jszip'
import { FileRecord } from '../types'
import { storageEngine } from './storageEngine'

export async function downloadFilesAsZip(
  files: FileRecord[],
  zipName = 'f0-vault-files.zip',
  onProgress?: (percent: number, currentFileName: string) => void
): Promise<void> {
  if (files.length === 0) return

  const zip = new JSZip()
  const total = files.length

  for (let i = 0; i < total; i++) {
    const file = files[i]
    onProgress?.(Math.round(((i) / total) * 100), file.name)
    try {
      const blob = await storageEngine.getFileBlob(file)
      zip.file(file.name, blob)
    } catch (err) {
      console.error(`Failed to zip file ${file.name}:`, err)
    }
  }

  onProgress?.(100, 'Compressing archive...')
  const content = await zip.generateAsync({ type: 'blob' })

  // Trigger download
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
