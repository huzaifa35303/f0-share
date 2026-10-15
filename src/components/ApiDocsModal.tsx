import React, { useState } from 'react'
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Layers,
} from 'lucide-react'

export const ApiDocsModal: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python'>('curl')
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const curlCode = `# 1. Upload an asset via cURL
curl -X POST "${window.location.origin}/api/upload" \\
  -F "file=@/path/to/archive.zip" \\
  -F "password=optional_passkey" \\
  -F "expiresInHours=24"

# 2. Retrieve metadata by shortcode
curl -X GET "${window.location.origin}/api/file/abc1234"

# 3. Direct streaming download
curl -L -O "${window.location.origin}/api/download/abc1234"`

  const jsCode = `// Ingest an asset using JavaScript Fetch API
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('password', 'secret_key');
formData.append('expiresInHours', '24');

const response = await fetch('${window.location.origin}/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Shortcode:', data.shortCode);
console.log('Dispatch URL:', data.shareUrl);`

  const pythonCode = `import requests

url = "${window.location.origin}/api/upload"
files = {'file': open('dataset.zip', 'rb')}
data = {
    'password': 'vault-passkey',
    'expiresInHours': 168 # 7 days
}

response = requests.post(url, files=files, data=data)
result = response.json()

print(f"Uploaded: {result['shortCode']}")
print(f"Public Link: {result['shareUrl']}")`

  const getCode = () => {
    switch (activeLang) {
      case 'curl':
        return curlCode
      case 'js':
        return jsCode
      case 'python':
        return pythonCode
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Developer Interface
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Programmatic Ingestion &amp; REST API
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Standard HTTP endpoints for automated CI/CD dispatches, research pipelines, and client scripts.
          </p>
        </div>
      </div>

      {/* Code Snippet Card */}
      <div className="card-base p-4 space-y-3">
        {/* Language Tabs & Copy Button */}
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
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
                {lang === 'js' ? 'JavaScript' : lang.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleCopy(getCode(), 'active-code')}
            className="btn-secondary text-xs"
            style={{ padding: '0.35rem 0.65rem' }}
          >
            {copied === 'active-code' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied === 'active-code' ? 'Copied' : 'Copy Snippet'}</span>
          </button>
        </div>

        {/* Code Viewport */}
        <pre
          className="p-3.5 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {getCode()}
        </pre>
      </div>

      {/* REST Endpoint Reference Directory */}
      <div className="card-base p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2" style={{ color: 'var(--accent)' }}>
          <Layers className="w-4 h-4" />
          <span>Core REST Endpoint Directory</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th className="py-2.5 px-3 font-mono">Method</th>
                <th className="py-2.5 px-3 font-mono">Endpoint</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold" style={{ color: 'var(--accent)' }}>POST</td>
                <td className="py-2.5 px-3 font-mono" style={{ color: 'var(--text-main)' }}>/api/upload</td>
                <td className="py-2.5 px-3" style={{ color: 'var(--text-muted)' }}>Upload and deposit single or multipart binary payload</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold" style={{ color: 'var(--success)' }}>GET</td>
                <td className="py-2.5 px-3 font-mono" style={{ color: 'var(--text-main)' }}>/api/file/:shortCode</td>
                <td className="py-2.5 px-3" style={{ color: 'var(--text-muted)' }}>Retrieve asset metadata, expiration, and passkey requirement</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-sky-400">GET</td>
                <td className="py-2.5 px-3 font-mono" style={{ color: 'var(--text-main)' }}>/api/download/:shortCode</td>
                <td className="py-2.5 px-3" style={{ color: 'var(--text-muted)' }}>Direct unthrottled streaming payload download</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
