# What To Test - Feature Verification Guide

## 📱 Test on Mobile (iOS & Android)

### Test 1: Opacity Fix (Mobile Only)
**Duration**: 2 minutes

**Steps**:
1. Open portfolio on mobile phone
2. Wait for page to load completely
3. Tap the glowing sphere in the center
4. You should see:
   - Sphere gets highlighted
   - A pulse animation ripples out
   - Badge GIF appears and follows finger
5. Tap the sphere 2-3 more times to add different badges
6. Tap anywhere **outside** the sphere
7. You should see:
   - Badge GIF fades out ✓
   - Pulse effect disappears ✓
8. Scroll down to the rest of the page
9. **EXPECTED**: 
   - ✅ Text in bio section is FULLY VISIBLE
   - ✅ Cards are FULLY VISIBLE
   - ✅ No transparency issues
   - ✅ Everything is readable

**If it doesn't work**:
- Text/cards are still dim/transparent → Issue not fully fixed
- Check browser console for errors
- Verify ScrollTrigger is loaded

---

### Test 2: Haptic Feedback
**Duration**: 1 minute

**Requirements**: Device with haptic motor (iPhone 6s+, most modern Android)

**Steps**:
1. On any interaction below, you should FEEL vibration:

**A. Sphere Tap Feedback**:
- Tap the sphere → Feel light vibration (25ms)
- Expect: Single crisp pulse, responsive feel

**B. Text Reveal Feedback**:
- Scroll through the bio section
- Feel light vibrations as words appear
- Expect: Rhythmic pulses (15-20-25ms repeating)
- Pattern: Short, short, medium, short, short, medium...

**C. Badge Discovery**:
- Discover a new badge on the sphere
- Expect: Strong vibration (80ms) → Pause → Double tap (50ms + 50ms)
- Feel like: "Found it!" + celebration

**D. Exit Feedback**:
- Tap outside sphere to exit
- Feel light vibration (30ms)
- Expect: Confirmation pulse

**D. Click Feedback**:
- Click any label (PORTFOLIO, BLOG, SCROLL, etc.)
- Feel light vibration (25ms)
- Expect: Tap feedback on every click

**If you don't feel haptics**:
- Check device Settings → Haptics/Vibration enabled
- Not all devices have haptics (desktop won't vibrate)
- iOS uses UIImpactFeedbackGenerator, Android uses Vibration API

---

### Test 3: Email Notification Modal
**Duration**: 1.5 minutes

**Steps**:
1. On the page, find the "PORTFOLIO" label (bottom-right corner)
2. **Click "PORTFOLIO"**
3. You should see:
   - Modal appears with smooth slide-up animation ✓
   - Backdrop darkens with blur effect ✓
   - Email input is focused (cursor ready) ✓
   - Feel haptic feedback on click (25ms) ✓

4. **Type your email**: `test@example.com`
5. **Click "Send Request"** (or press Enter)
6. You should see:
   - Button becomes disabled/dimmed ✓
   - Status shows "Sending..." ✓
   - After a moment, shows:
     - ✅ `✓ Request sent! Check your email` (in green)
     - Feel haptic feedback (50ms medium pulse) ✓

7. Wait 2.5 seconds
8. Modal automatically closes ✓

**Test Error Handling**:
1. Click "PORTFOLIO" again
2. Type invalid email: `notanemail`
3. Click "Send Request"
4. You should see:
   - Error message: `Please enter a valid email` (in red) ✓
   - Feel haptic feedback (30ms light pulse) ✓
   - Modal stays open so you can fix it

**Test Close Button**:
1. Click "PORTFOLIO" again
2. Click the **X button** (top-left of modal)
3. Modal closes immediately ✓

**Test Backdrop Close**:
1. Click "PORTFOLIO" again
2. Click the dark area **outside** the modal
3. Modal closes immediately ✓

**Test Keyboard**:
1. Click "PORTFOLIO" again
2. Type email
3. Press **Escape** key
4. Modal closes ✓

---

### Test 4: Blog Link
**Duration**: 30 seconds

**Steps**:
1. Find "BLOG" label (left side, vertical text)
2. Click it
3. Modal should appear ✓
4. Same behavior as PORTFOLIO

---

## 🖥️ Test on Desktop (Optional)

### Test 1: Modal Works
**Duration**: 1 minute

- Modal opens on click ✓
- Email validation works ✓
- Submit functionality works ✓
- No errors in console ✓

### Test 2: Haptics
- Desktop won't have haptic feedback ✓ (expected)
- Everything else works normally ✓

### Test 3: Responsive Design
- Open DevTools (F12)
- Toggle device toolbar (mobile view)
- Test at different sizes: 320px, 768px, 1024px, 1440px
- Modal should scale nicely at all sizes ✓

---

## 🎯 Expected Behaviors Summary

### Sphere Interaction (Mobile)
| Action | Visual | Haptic | UI Change |
|--------|--------|--------|-----------|
| Tap sphere | Pulse ripples out | 25ms light | Badge GIF appears |
| Pinch zoom | Sphere grows/shrinks | 40ms on move | Continuous feedback |
| Hold near sticker | Sticker highlights | 80ms heavy | Badge discovered |
| Badge found | Glow effect | 80ms + 50+100+50ms pattern | Celebration |
| Tap outside | Nothing special | 30ms light | Modal closes |

### Text Scrolling (All Devices)
| Action | Visual | Haptic | UI Change |
|--------|--------|--------|-----------|
| Slow scroll | Words reveal one by one | 15-20-25ms | Text centering |
| Fast scroll | Words appear in groups | Multiple haptics | Rapid centering |
| Exit sphere | Text fades in | Haptics continue | Becomes visible |

### Email Modal (All Devices)
| Action | Visual | Haptic | UI Change |
|--------|--------|--------|-----------|
| Click PORTFOLIO/BLOG | Modal slides up | 25ms light | Input focused |
| Type invalid email | Text appears | None | - |
| Click Send (invalid) | Error in red | 30ms error | Modal stays open |
| Type valid email | Text appears | None | - |
| Click Send (valid) | Success in green | 50ms success | Auto-closes 2.5s |
| Click X | Modal fades | None | Closes immediately |
| Click backdrop | Modal fades | None | Closes immediately |
| Press Escape | Modal fades | None | Closes immediately |

---

## ✅ Success Criteria

### Critical Issue Fix
- [ ] Text is NOT transparent after sphere interaction
- [ ] Cards are NOT transparent after sphere interaction
- [ ] Scrolling works smoothly after exiting sphere mode
- [ ] No console errors about opacity

### Haptics
- [ ] Feel vibration on sphere tap (iOS/Android only)
- [ ] Feel vibration as text reveals
- [ ] Feel strong vibration on badge discovery
- [ ] Feel celebration vibration pattern
- [ ] Feel tap on all button clicks

### Email Modal
- [ ] Opens on PORTFOLIO click
- [ ] Opens on BLOG click
- [ ] Closes on X button
- [ ] Closes on Escape key
- [ ] Closes on backdrop click
- [ ] Email validation works
- [ ] Success message appears
- [ ] Error message appears (with invalid email)
- [ ] Keyboard Enter key submits

---

## 🐛 Troubleshooting

### Issue: Text still transparent after exiting sphere
**Solution**: 
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check console for errors
- Verify ScrollTrigger is loaded

### Issue: No haptics felt
**Solution**:
- Check Settings → Haptics enabled
- Try on different app (confirm device has haptics)
- Device may be too old (needs iPhone 6s+)
- Desktop doesn't have haptics (expected)

### Issue: Email modal doesn't open
**Solution**:
- Check browser console for errors
- Verify PORTFOLIO/BLOG elements exist
- Try clicking different locations on the labels
- Hard refresh browser

### Issue: Email submit doesn't work
**Solution**:
- Backend endpoint `/api/request-access` not set up yet
- Error message should show on submit
- This is expected until backend is created
- Modal will still work, just show error

---

## 📊 Testing Checklist

### Pre-Testing
- [ ] Using latest browser version
- [ ] JavaScript enabled
- [ ] No browser extensions blocking
- [ ] Page fully loaded (no pending requests)

### During Testing
- [ ] Check console for errors (F12)
- [ ] Notice haptic feedback (if device supports)
- [ ] Test on multiple devices
- [ ] Take notes on any issues

### Post-Testing
- [ ] Document any issues found
- [ ] Note device/browser used
- [ ] Try reproducing issues
- [ ] Check if it's browser-specific

---

## 🎓 Understanding the Features

### What is Haptic Feedback?
- Small vibrations from your device's vibration motor
- Used for tactile feedback instead of sound
- Makes interactions feel more real/native
- Helps with user confirmation

### What is the Opacity Fix?
- Earlier issue: Text became invisible after sphere interaction
- Now fixed with proper GSAP animation handling
- Text and cards remain fully visible throughout

### What is the Email Modal?
- Allows users to request portfolio/blog access
- Collects their email address
- Sends request to your email (setup required)
- Provides good UX with validation and feedback

---

## 🚀 Ready to Test!

All features are fully implemented and ready for verification.

**Most Important Test**: Opacity fix (Test 1)  
**Most Fun Test**: Haptic feedback (Test 2)  
**Most Useful Feature**: Email modal (Test 3)

Good luck testing! 🎉
