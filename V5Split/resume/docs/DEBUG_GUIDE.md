# Works Canvas - Debug Guide

## 🎯 What Changed

### 1. Smart Image Sizing
✅ Images are now loaded and their **actual dimensions** are detected  
✅ Grid placement is calculated based on **aspect ratios**:
- Very wide images (>1.5 ratio): 2 columns × 1 row
- Very tall images (<0.67 ratio): 1 column × 2 rows  
- Regular landscape: 2 columns × 1 row
- Regular portrait: 1 column × 2 rows
- Square: 1 column × 1 row

✅ Uses `grid-auto-flow: dense` to **fill gaps smartly**  
✅ No blank spaces (except padding)  
✅ State-of-the-art justified layout look

### 2. Click Debugging
✅ **Extensive console logging** to track every action  
✅ Shows when images are loading  
✅ Shows when tiles are clicked  
✅ Shows when lightbox opens/closes

### 3. Full Lightbox Features
✅ Zoom from tile origin to center  
✅ Spring-back to original position on close  
✅ Swipe/arrow keys to navigate  
✅ ESC to close  
✅ Click outside to close

---

## 🔍 How to Debug

### Step 1: Open Browser Console
```
Press F12 → Click "Console" tab
```

### Step 2: Reload the Page
```
Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Step 3: Look for These Log Messages

```
[Works Canvas] ===== INITIALIZING =====
[Works Canvas] Starting gallery load...
[Works Canvas] Found X media files
[Works Canvas] Loading image dimensions...
[Works Canvas] Loaded 01.png: 1920x1080 (ratio: 1.78)
[Works Canvas] All dimensions loaded
[Works Canvas] Creating smart gallery layout...
[Works Canvas] Gallery layout created
[Works Canvas] Setting up interactions...
[Works Canvas] Interactions ready
```

### Step 4: Test Click
When you click an image, you should see:
```
[Works Canvas] Click detected, dragDistance: 0
[Works Canvas] Opening image X file: filename.png
[Works Canvas] Tile origin rect: {left: ..., top: ..., width: ..., height: ...}
[Works Canvas] 🔓 Opening lightbox for: filename.png at index: X
[Works Canvas] Animating from tile center to viewport center
[Works Canvas] Lightbox opened
```

### Step 5: Test Close
When you press ESC, click outside, or click close button:
```
[Works Canvas] 🔒 Closing lightbox
```

---

## ✅ What Should Happen

1. **Gallery loads** with smart grid layout
2. **No blank spaces** in grid (except padding)
3. **Click image** → zooms from that position
4. **Swipe/Arrow keys** → cycles through images  
5. **ESC or click outside** → spring-back to original position

---

## 🚨 If Click Doesn't Work

### Check These in Console:

**Are dimension logs showing?**
```
[Works Canvas] Loaded 01.png: 1920x1080 (ratio: 1.78)
```
If NO → Image loading failed

**Are interactions set up?**
```
[Works Canvas] Interactions ready
```
If NO → Setup failed

**When you click, do you see?**
```
[Works Canvas] Click detected
```
If NO → Click event not firing

**Is drag distance > 5?**
```
[Works Canvas] Click detected, dragDistance: 2
```
Should be LESS than 5

---

## 📱 Mobile Testing

Swipe should work on touch devices:
- Swipe left → next image
- Swipe right → previous image

---

## 🎨 Grid Appearance

The grid now uses:
- `grid-auto-flow: dense` - fills gaps automatically
- Rounded corners on tiles
- Subtle shadows
- Smart sizing based on actual image dimensions
- No wasted space

This creates a professional, gallery-like appearance!

