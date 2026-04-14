# Works Canvas Gallery - Setup Guide

## ⚠️ Why Images Aren't Showing

The Works Canvas gallery requires serving files over **HTTP** (not opening directly with `file://`). Modern browsers block file requests due to security restrictions.

## ✅ Quick Start

### Option 1: Automatic (Easiest)

**On macOS/Linux:**
```bash
./START_SERVER.sh
```

**On Windows:**
```bash
START_SERVER.bat
```

Then open your browser to: **http://localhost:8000**

---

### Option 2: Manual - Python HTTP Server

1. Open Terminal/Command Prompt
2. Navigate to the resume folder:
   ```bash
   cd /path/to/_Resume\ Interactive/resume
   ```

3. Start the server:
   
   **Python 3:**
   ```bash
   python3 -m http.server 8000
   ```
   
   **Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```

4. Open browser: **http://localhost:8000**

---

### Option 3: Node.js HTTP Server

If you have Node.js installed:
```bash
npx http-server -p 8000
```

Then open: **http://localhost:8000**

---

## 🎨 Gallery Features

Once loaded via HTTP, you'll see:

- **151 Portfolio Images** arranged in an infinite bento grid
- **Drag-to-explore**: Hold and drag to pan through the canvas
- **Click to preview**: Click any image for spotlight zoom animation
- **Swipe navigation**: Left/right swipes jump to random images
- **Keyboard shortcuts**:
  - `ESC` - Close preview
  - `Arrow Keys` - Jump to next random image
- **Full animation suite**: GSAP-powered smooth transitions

---

## 🔧 Troubleshooting

### "Works Canvas Gallery - The image gallery is not loading"
- You're opening the file directly (`file://`)
- Use the HTTP server setup above

### Server won't start
- Make sure Python is installed: `python --version`
- Download Python from https://www.python.org/downloads
- On Windows, ensure "Add Python to PATH" was checked during installation

### Images still not showing
- Check browser console (F12 > Console)
- Verify server is running on http://localhost:8000
- Try a different browser
- Clear browser cache (Ctrl+Shift+Delete)

### What port should I use?
- Default is **8000**
- If port 8000 is busy, try: `python3 -m http.server 9000`
- Then open: http://localhost:9000

---

## 📁 File Structure

```
resume/
├── index.html (Main resume file)
├── assets/
│   └── images/
│       └── PortfolioImages/
│           ├── manifest.json (Image list)
│           └── [151 image files]
├── START_SERVER.sh (macOS/Linux launcher)
└── START_SERVER.bat (Windows launcher)
```

---

## 🚀 Going Live

When deploying to a live server:
- The gallery will work perfectly
- No special setup needed - just upload the files
- Works with any web host (Vercel, Netlify, etc.)

---

**Questions?** Check the browser console (F12) for detailed error messages.
