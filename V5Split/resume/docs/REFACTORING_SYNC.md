# 🔄 REFACTORING SYNC — Single File → Modular Structure

**Purpose**: This file tracks all changes made during HTML refactoring. Both Claude (Cowork) and Cursor should reference this file to stay synchronized.

**Status**: 🟡 IN PROGRESS  
**Last Updated**: April 14, 2026  
**Sync Version**: 1.0

---

## 📋 REFACTORING PLAN

### Original State
- **File**: `index.html` (3,056 lines)
- **Structure**: Single HTML file with embedded CSS and JavaScript
- **Status**: Working, but unmaintainable

### Target State
```
resume/
├── index.html                (HTML structure only)
├── REFACTORING_SYNC.md       (This file - sync documentation)
├── css/
│   ├── base.css              (Variables, resets, fonts, grain effect)
│   ├── hero.css              (Hero section, sphere, stats)
│   ├── cards.css             (Card stack animations)
│   ├── resume.css            (Resume section styling)
│   ├── modal.css             (Email modal styles)
│   └── responsive.css        (All @media queries)
├── js/
│   ├── haptics.js            (HapticManager class)
│   ├── sphere.js             (3D sphere canvas logic)
│   ├── animations.js         (GSAP, ScrollTrigger setup)
│   ├── modal.js              (Email modal logic)
│   ├── cursor.js             (Custom cursor tracking)
│   └── main.js               (Initialization, DOM queries)
└── assets/                   (Images, icons — unchanged)
```

---

## ✅ COMPLETED TASKS

### Phase 1: Planning & Extraction
- [ ] Claude & Cursor review refactoring plan
- [ ] Cursor extracts CSS from `<style>` tag
- [ ] Cursor extracts JS from `<script>` tag
- [ ] Create organized folder structure
- [ ] Update index.html with `<link>` and `<script>` tags

### Phase 2: Testing & Verification
- [ ] Test in Cursor Live Server (desktop)
- [ ] Test on mobile (responsiveness)
- [ ] Verify all haptics work
- [ ] Check console for errors
- [ ] Verify all animations trigger correctly
- [ ] Test email modal functionality

### Phase 3: Optimization
- [ ] Remove any unused CSS
- [ ] Add JSDoc comments to JS functions
- [ ] Verify no console warnings
- [ ] Check performance (DevTools)
- [ ] Create README.md with documentation

---

## 📁 FILE MAPPING — What Goes Where

### FROM `index.html` ORIGINAL → TO SPLIT FILES

#### CSS Extraction (`<style>` tag)

| CSS Section | Destination | Lines | Status |
|------------|------------|-------|--------|
| `:root` variables | `css/base.css` | 1 | 🟡 PENDING |
| Global resets `*,*::before,*::after` | `css/base.css` | 2-5 | 🟡 PENDING |
| `body`, `html` | `css/base.css` | 26-28 | 🟡 PENDING |
| Custom cursor `#cur` | `css/base.css` | 29-31 | 🟡 PENDING |
| Grain overlay `body::after` | `css/base.css` | 352-360 | 🟡 PENDING |
| Hero section `#hero`, `#hs`, `#sphere` | `css/hero.css` | 35-42 | 🟡 PENDING |
| Stats `#stats`, `.stats-inner` | `css/hero.css` | 45-51 | 🟡 PENDING |
| Cards `#cards-wrap`, `.crd` | `css/cards.css` | 111-119 | 🟡 PENDING |
| Resume `#rz`, `.rzp`, `.rzsb` | `css/resume.css` | 121-154 | 🟡 PENDING |
| Email Modal `#email-modal` | `css/modal.css` | 365-450 | 🟡 PENDING |
| All `@media` queries | `css/responsive.css` | 164-249 | 🟡 PENDING |
| Gradient masks `@media (max-width:768px)` | `css/responsive.css` | 75-100 | 🟡 PENDING |

#### JavaScript Extraction (`<script>` tag)

| JS Class/Function | Destination | Purpose | Status |
|------------------|------------|---------|--------|
| `class HapticManager` | `js/haptics.js` | Handle iOS/Android haptics | 🟡 PENDING |
| `class Sphere` | `js/sphere.js` | 3D sphere canvas rendering | 🟡 PENDING |
| GSAP animation setup | `js/animations.js` | ScrollTrigger, tweens | 🟡 PENDING |
| `function openEmailModal()` | `js/modal.js` | Modal logic | 🟡 PENDING |
| `function closeEmailModal()` | `js/modal.js` | Modal logic | 🟡 PENDING |
| Custom cursor tracking | `js/cursor.js` | Custom cursor | 🟡 PENDING |
| DOM initialization | `js/main.js` | Init all features | 🟡 PENDING |

---

## 🔗 HTML Link Order (CRITICAL!)

When Cursor creates `index.html`, links must be in this order:

```html
<!-- CSS: Order matters! Load in dependency order -->
<link rel="stylesheet" href="css/base.css">      <!-- Variables first -->
<link rel="stylesheet" href="css/hero.css">      <!-- Hero section -->
<link rel="stylesheet" href="css/cards.css">     <!-- Cards -->
<link rel="stylesheet" href="css/resume.css">    <!-- Resume -->
<link rel="stylesheet" href="css/modal.css">     <!-- Modal -->
<link rel="stylesheet" href="css/responsive.css"><!-- Media queries last -->

<!-- JavaScript: Order matters! Dependencies first -->
<script src="js/haptics.js"></script>       <!-- No deps -->
<script src="js/sphere.js"></script>        <!-- No deps -->
<script src="js/animations.js"></script>    <!-- Depends on GSAP (external) -->
<script src="js/modal.js"></script>         <!-- No deps -->
<script src="js/cursor.js"></script>        <!-- No deps -->
<script src="js/main.js"></script>          <!-- Initializes all above -->

<!-- External libraries (keep existing) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

---

## 🧪 TESTING CHECKLIST — Verify Nothing Broke

### Must Test (Critical Path)
- [ ] **Sphere Interaction**: Tap sphere → See badge appear
- [ ] **Sphere Exit**: Click outside → UI opacity restored
- [ ] **Text Reveals**: Scroll down → Words animate in
- [ ] **Portfolio Cards**: Scroll → Cards stack properly
- [ ] **Modal Open**: Click Portfolio/Blog → Modal appears
- [ ] **Modal Submit**: Enter email → Success message shows
- [ ] **Modal Close**: ESC or backdrop click → Modal closes
- [ ] **Responsive**: Test on mobile (320px), tablet (768px), desktop (1024px)

### Should Test (Quality)
- [ ] **Haptics**: Tap sphere (iOS/Android) → Feel vibration
- [ ] **Text Haptics**: Scroll reveals → Feel 15-25ms pulses
- [ ] **Custom Cursor**: Hover over elements → Cursor changes
- [ ] **Console**: No errors, warnings clean
- [ ] **Animations**: All transitions smooth (no janky)
- [ ] **Performance**: DevTools → No jank on scroll

### Nice to Test (Polish)
- [ ] **Keyboard**: Enter submits email form
- [ ] **Resume Download**: Button works
- [ ] **Links**: All external links open correctly
- [ ] **Print**: Site prints to PDF cleanly

---

## 🐛 ISSUES & FIXES

### Issue Tracking

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| #1 | Sphere breaks opacity | ✅ FIXED | See ALL_FIXES_SUMMARY.md |
| #2 | Portfolio modal not wired | ✅ FIXED | Handler verified active |
| #3 | Modal not responsive | ✅ FIXED | Uses clamp/min CSS |
| #4 | Haptics not implemented | ✅ VERIFIED | HapticManager active |

### New Issues Found During Refactor
- [ ] (None yet - add if you find any)

---

## 💡 IMPORTANT NOTES FOR CLAUDE & CURSOR

### For Cursor (Code Editor)
1. **When you split the files**, ensure:
   - No CSS is duplicated across files
   - All JS functions can access DOM elements
   - External libraries load BEFORE custom JS
   - File paths are relative: `js/`, `css/` (not absolute)

2. **Test immediately** after splitting:
   - Right-click `index.html` → "Open with Live Server"
   - Check console (F12) for errors
   - Test sphere interaction first (most complex)

3. **If something breaks**:
   - Update this file with issue details
   - Share the error message
   - Don't modify files — let Claude know

### For Claude (Cowork)
1. **Before suggesting changes**:
   - Check this REFACTORING_SYNC.md first
   - Read what files exist and their purpose
   - Understand the structure

2. **When user reports issues**:
   - Ask which file is problematic
   - Reference the file mapping above
   - Keep this file updated with status

3. **When optimizing**:
   - Respect the file boundaries
   - Don't consolidate files without asking
   - Document changes here first

---

## 📝 CHANGE LOG

### Entry Format
```
**[DATE] - [WHO] - [WHAT]**
- Specific changes made
- Files affected
- Status (✅ DONE, 🟡 IN PROGRESS, 🔴 BLOCKED)
```

### Entries

**[April 14, 2026] - REFACTORING STARTED**
- Created REFACTORING_SYNC.md (this file)
- Defined target structure
- Created file mapping
- Status: 🟡 AWAITING CURSOR EXECUTION

---

## 🚀 NEXT STEPS

### Immediate (Now)
1. **Cursor**: Create all CSS files with proper organization
2. **Cursor**: Create all JS files with proper organization
3. **Cursor**: Update index.html with proper links
4. **Cursor**: Test in Live Server

### After Split Works
1. **Claude**: Review code quality
2. **Claude**: Suggest optimizations
3. **Claude**: Add documentation (README.md)
4. **Claude**: Prepare for deployment

### Final
1. **Test on production domain**
2. **Monitor for errors**
3. **Collect user feedback**
4. **Deploy confident**

---

## 📞 COMMUNICATION RULES

### Cursor → Claude Sync
When Cursor completes refactoring, **Cursor should**:
1. Update this file: Change status to ✅ COMPLETED
2. Note any issues found
3. List files created
4. Mention any warnings/errors in console
5. Share test results

### Claude → Cursor Sync
When Claude suggests changes, **Claude should**:
1. Reference which files to modify
2. Explain why the change helps
3. Verify it won't break dependencies
4. Ask Cursor to test after changes
5. Update this file with results

### User Feedback Loop
**User should always**:
1. Test changes in Cursor first
2. Report issues here in this file
3. Provide screenshots/error messages
4. Confirm before moving forward

---

## 📊 PROGRESS DASHBOARD

```
REFACTORING PROGRESS:

Phase 1: Planning & Extraction
████░░░░░░░░░░░░░░░░ 20% (In Progress with Cursor)

Phase 2: Testing & Verification
░░░░░░░░░░░░░░░░░░░░ 0% (Pending)

Phase 3: Optimization
░░░░░░░░░░░░░░░░░░░░ 0% (Pending)

OVERALL: 20% COMPLETE
```

---

## ❓ FAQ

**Q: Why this file?**  
A: To keep Claude and Cursor synchronized about what's been done, what's pending, and what broke.

**Q: Should I edit this file manually?**  
A: Only to update progress. Cursor and Claude will maintain the majority.

**Q: What if I disagree with the split?**  
A: Edit this file with your alternative structure and ask Claude/Cursor to follow it.

**Q: How often to update this?**  
A: After each major change (file created, test completed, issue found).

**Q: Can I rollback if split fails?**  
A: Yes! Keep `index_backup.html` copy. Git also has history.

---

**Last Status**: 🟡 Awaiting Cursor to start Phase 1 extraction  
**Owner**: Vishnu Lal (vishnulal@gmail.com)  
**Sync Version**: 1.0
