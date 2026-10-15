# f0-Share // Ultra File Vault & Sharing Engine

A high-performance, dark-aesthetic file sharing web and mobile application inspired by **Gofile**, tailored with custom architecture, cryptographic locks, instant QR generation, rich media streaming, and hybrid **Supabase Cloud + Local IndexedDB Vault** storage engines.

Built for the **f0undr** ecosystem inside `D:\Huzaifa All Data\Main of f0\f0-share`.

---

## ⚡ Key Highlights & Architecture

### 1. 🚀 Gofile-Style File Sharing
- **Instant Drag-and-Drop & Folder Uploads**: Drop single files, batches, or entire directories with recursive folder scanning.
- **Clipboard Paste (`Ctrl+V`)**: Directly paste screenshots and clipboard files into the dropzone.
- **Custom Short Links**: Generates sleek, shareable short codes (e.g. `?share=abc1234`) with one-click clipboard copying.
- **Download Counter**: Tracks total downloads atomically with fast CDN links.
- **Bulk Archiving**: Select multiple files or entire folders and click **"Download as ZIP"** to compress and save instantly in the browser.

### 2. 📱 Cross-Platform Web & Mobile App (PWA + Capacitor)
- **Installable PWA**: Click **"Install App"** on Windows/macOS or **"Add to Home Screen"** on Android & iOS for an app-like standalone experience.
- **Mobile-First Layout**: Includes a native mobile bottom tab bar (`Upload`, `Vault`, `Shared`, `Settings`) and responsive drawers.
- **Capacitor Mobile Ready**: Includes `capacitor.config.json` pre-configured to build native Android APKs.

### 3. 🔒 Security & Privacy Controls
- **Password Protection**: Optional SHA-256 cryptographic passkey locking on any file or upload batch.
- **Auto-Expiration Timers**: Set link expiration to 1 Hour, 24 Hours, 3 Days, 7 Days, 30 Days, or Permanent.
- **Direct & Embed Links**: Instant copy for Markdown `[Name](url)`, HTML `<a href="...">`, and BBCode `[url=...]` links.
- **Mobile QR Code Generator**: Generates high-resolution QR codes on canvas with a one-click **"Save QR Image"** button.

### 4. 👁️ Rich Multi-Format Previewer Modal
- **Images**: Zoom in/out, 90° rotation, dimension inspection, and full-screen view.
- **Video Player**: HTML5 streaming video player with timecode seek and picture-in-picture.
- **Audio Player**: Interactive audio player with volume slider and audio metadata.
- **PDF Viewer**: Embedded PDF iframe reader.
- **Code & Text Viewer**: Monospaced syntax viewer with line counter and 1-click text copy.

### 5. ☁️ Hybrid Backend: Supabase Cloud + Local Vault
- **Local Vault (Default)**: Runs immediately out-of-the-box using the browser's high-capacity **IndexedDB** database for binary blobs and metadata. No database configuration required to test and use!
- **Supabase Cloud Mode**: Connect your Supabase project URL and Anon key in the **Settings UI** or via `.env`. Supports Supabase PostgreSQL tables, atomic RPC download counters, and S3-compatible Supabase Storage buckets (`f0-share-vault`).

---

## 🚀 Quick Start Guide

### 1. Run the Development Server
```bash
cd "D:\Huzaifa All Data\Main of f0\f0-share"
npm run dev
```
Open **`http://localhost:5174`** in your browser.

### 2. Build for Production
```bash
npm run build
npm run preview
```

---

## 🗄️ Setting Up Supabase Cloud (Optional)

If you would like to synchronize your files across all devices using Supabase Cloud:

1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Copy and run the SQL code from [`supabase-schema.sql`](file:///D:/Huzaifa%20All%20Data/Main%20of%20f0/f0-share/supabase-schema.sql).
4. Open the in-app **Settings** modal in `f0-Share` (or edit [`.env`](file:///D:/Huzaifa%20All%20Data/Main%20of%20f0/f0-share/.env)):
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1Ni...`
   - **Bucket**: `f0-share-vault`
5. Click **"Save & Connect Supabase"**. The engine badge will glow green with **"Supabase Cloud"**!

---

## 🛠️ Tech Stack

- **React 19**
- **Vite 8**
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase JS (`@supabase/supabase-js`)**
- **JSZip** (Client-side ZIP packaging)
- **QRCode** (Offline SVG/Canvas QR generation)
- **Canvas Confetti**
- **Lucide Icons**
