# SnapTask Free ⚡

> **A fast, local-first, distraction-free meeting & workflow task manager.**  
> Paste screenshots directly from your clipboard (`Ctrl+V`), type quick action items, and export formatted Excel sheets in one click. 100% free, private, and offline.

---

## ✨ Features

- **🚀 100% Free & Unlimited**: No paywalls, no login barriers, no API keys required.
- **🔒 Pure Local-First Privacy**: Your tasks and notes are stored entirely in your local browser storage (`localStorage`).
- **📸 Smart In-Browser WebP Compression**: Pasted and uploaded screenshots are downscaled and compressed to compact WebP images directly on your machine without external cloud uploads.
- **📋 Direct Clipboard Paste**: Press `Ctrl+V` anywhere in the app to instantly attach screenshots.
- **📊 One-Click Excel Export**: Formatted tables with color-coded status tags exported directly to `.xlsx`.
- **🌗 Dark & Light Modes**: Seamless toggle with persisted theme preference.
- **🖥️ Standalone Desktop & PWA**:
  - Run locally in your browser
  - Install as a Progressive Web App (PWA) on Windows/macOS/Linux
  - Or package as a lightweight native desktop `.exe` via Tauri

---

## 🚀 Quick Start

### 1. Run with Node.js & Vite
```bash
# Install dependencies
npm install

# Start local server
npm run dev
```

### 2. One-Click Windows Launch
Double-click `start-snaptask.bat` to automatically start the local server and open SnapTask in your browser.

---

## 📦 Build Native Desktop Executable (Tauri)

SnapTask Free includes native desktop bundling powered by [Tauri v2](https://tauri.app/).

```bash
# Run in Desktop Dev mode
npm run desktop:dev

# Build standalone Windows installer & executable
npm run desktop:build
```
Built binaries will be located in `src-tauri/target/release/bundle/`.

---

## 📄 License
MIT License. Free for personal and commercial use.
