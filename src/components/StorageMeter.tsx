import React from 'react'
import { PieChart } from 'lucide-react'
import { StorageStats } from '../types'
import { formatBytes } from '../utils/formatters'

interface StorageMeterProps {
  stats: StorageStats
}

export const StorageMeter: React.FC<StorageMeterProps> = ({ stats }) => {
  const total = stats.totalBytes || 1 // avoid div by zero
  const bd = stats.categoryBreakdown || {
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0,
    code: 0,
    archives: 0,
  }

  const pImages = Math.round((bd.images / total) * 100)
  const pVideos = Math.round((bd.videos / total) * 100)
  const pAudio = Math.round((bd.audio / total) * 100)
  const pDocs = Math.round((bd.documents / total) * 100)
  const pCode = Math.round((bd.code / total) * 100)
  const pArchives = Math.round((bd.archives / total) * 100)

  if (stats.fileCount === 0) {
    return null
  }

  return (
    <div className="card-base p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-main)' }}>Storage Footprint & Category Allocation</span>
        </div>
        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-main)' }}>{formatBytes(stats.totalBytes)}</strong> in {stats.fileCount} items
        </span>
      </div>

      {/* Segmented Multi-Color Progress Bar */}
      <div
        className="w-full h-2.5 rounded-full flex overflow-hidden p-0.5"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {bd.images > 0 && (
          <div
            title={`Images: ${formatBytes(bd.images)} (${pImages}%)`}
            style={{ width: `${Math.max(pImages, 3)}%` }}
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
          />
        )}
        {bd.videos > 0 && (
          <div
            title={`Videos: ${formatBytes(bd.videos)} (${pVideos}%)`}
            style={{ width: `${Math.max(pVideos, 3)}%` }}
            className="h-full bg-cyan-500 transition-all duration-500"
          />
        )}
        {bd.audio > 0 && (
          <div
            title={`Audio: ${formatBytes(bd.audio)} (${pAudio}%)`}
            style={{ width: `${Math.max(pAudio, 3)}%` }}
            className="h-full bg-amber-500 transition-all duration-500"
          />
        )}
        {bd.documents > 0 && (
          <div
            title={`Documents: ${formatBytes(bd.documents)} (${pDocs}%)`}
            style={{ width: `${Math.max(pDocs, 3)}%` }}
            className="h-full bg-blue-500 transition-all duration-500"
          />
        )}
        {bd.code > 0 && (
          <div
            title={`Code: ${formatBytes(bd.code)} (${pCode}%)`}
            style={{ width: `${Math.max(pCode, 3)}%` }}
            className="h-full bg-purple-500 transition-all duration-500"
          />
        )}
        {bd.archives > 0 && (
          <div
            title={`Archives: ${formatBytes(bd.archives)} (${pArchives}%)`}
            style={{ width: `${Math.max(pArchives, 3)}%` }}
            className="h-full bg-orange-500 rounded-r-full transition-all duration-500"
          />
        )}
      </div>

      {/* Legend Pills */}
      <div className="flex items-center gap-3 overflow-x-auto text-[11px] font-mono pt-1" style={{ color: 'var(--text-muted)' }}>
        {bd.images > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Images ({formatBytes(bd.images)})</span>
          </div>
        )}
        {bd.videos > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Videos ({formatBytes(bd.videos)})</span>
          </div>
        )}
        {bd.audio > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Audio ({formatBytes(bd.audio)})</span>
          </div>
        )}
        {bd.documents > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Docs ({formatBytes(bd.documents)})</span>
          </div>
        )}
        {bd.code > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Code ({formatBytes(bd.code)})</span>
          </div>
        )}
        {bd.archives > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Archives ({formatBytes(bd.archives)})</span>
          </div>
        )}
      </div>
    </div>
  )
}
