import React from 'react'
import { CloudUpload, HardDrive, Share2, Crown } from 'lucide-react'
import { ViewTab } from '../types'

interface MobileNavProps {
  currentTab: ViewTab
  onTabChange: (tab: ViewTab) => void
  fileCount: number
  isAdmin?: boolean
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onTabChange,
  fileCount,
  isAdmin = false,
}) => {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-1.5 flex items-center justify-around backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <button
        onClick={() => onTabChange('upload')}
        className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
        style={{
          color: currentTab === 'upload' ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        <CloudUpload className="w-4 h-4" />
        <span className="text-[10px] font-medium">Upload</span>
      </button>

      <button
        onClick={() => onTabChange('explorer')}
        className="relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
        style={{
          color: currentTab === 'explorer' ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        <HardDrive className="w-4 h-4" />
        <span className="text-[10px] font-medium">Vault</span>
        {fileCount > 0 && (
          <span
            className="absolute top-0 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center font-mono"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            {fileCount > 99 ? '99+' : fileCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onTabChange('shared')}
        className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
        style={{
          color: currentTab === 'shared' ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        <Share2 className="w-4 h-4" />
        <span className="text-[10px] font-medium">Shared</span>
      </button>

      <button
        onClick={() => onTabChange('admin')}
        className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
        style={{
          color: currentTab === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        <Crown className="w-4 h-4" />
        <span className="text-[10px] font-bold">Admin</span>
      </button>
    </div>
  )
}
