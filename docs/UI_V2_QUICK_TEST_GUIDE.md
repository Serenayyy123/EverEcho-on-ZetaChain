# UI V2 Quick Test Guide

## 🚀 Quick Start

### 1. Switch to UI V2 Branch
```bash
git checkout ui-v2-beautify-pass1
```

### 2. Enable UI V2
Edit `frontend/.env`:
```env
VITE_UI_V2=true
```

### 3. Start Development Server
```bash
# Start backend (if not running)
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

### 4. Open Browser
Navigate to: http://localhost:5173

## 🎨 What to Test

### Home Page (/)
**Expected V2 Changes:**
- ✅ Dark gradient background (navy → deep blue)
- ✅ Radial glow decoration in center
- ✅ Glass morphism card with glow effect
- ✅ Gradient logo text (blue → purple)
- ✅ Large, prominent "Connect Wallet" button
- ✅ Smooth hover effects

**Functionality to Verify:**
- [ ] Connect wallet button works
- [ ] Redirects to /register if not registered
- [ ] Redirects to /tasks if registered
- [ ] Error messages display correctly

### Task Square (/tasks)
**Expected V2 Changes:**
- ✅ Dark gradient background
- ✅ Glass header with backdrop blur
- ✅ Glass filter card
- ✅ Glass task cards with hover lift
- ✅ Gradient reward amounts
- ✅ Better typography hierarchy
- ✅ Smooth animations

**Functionality to Verify:**
- [ ] Task list loads correctly
- [ ] Filter by category works
- [ ] Search works
- [ ] "Show ongoing" toggle works
- [ ] Click task card navigates to detail
- [ ] Refresh button works
- [ ] Publish button navigates to /publish

## 🔄 Compare V1 vs V2

### Test V1 (Original UI)
```bash
# Edit frontend/.env
VITE_UI_V2=false

# Restart dev server
npm run dev
```

### Test V2 (New UI)
```bash
# Edit frontend/.env
VITE_UI_V2=true

# Restart dev server
npm run dev
```

## ✅ Acceptance Checklist

### Visual Quality
- [ ] Dark theme looks polished and professional
- [ ] Glass effects render correctly (no visual glitches)
- [ ] Gradients are smooth
- [ ] Text is readable (good contrast)
- [ ] Hover effects are smooth
- [ ] No layout shifts or jumps

### Functionality
- [ ] All buttons work
- [ ] All forms work
- [ ] Navigation works
- [ ] Wallet connection works
- [ ] Task creation works
- [ ] Task filtering works
- [ ] No console errors

### Performance
- [ ] Page loads quickly
- [ ] Animations are smooth (60fps)
- [ ] No lag when hovering
- [ ] No memory leaks

### Cross-Browser
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

## 🐛 Known Limitations (Pass 1)

These are **intentionally not implemented** in Pass 1:

1. **Only 2 pages have V2**
   - Home and TaskSquare only
   - Other pages (Profile, TaskDetail, PublishTask, Register) still use V1
   - This is expected and will be addressed in Pass 2

2. **No advanced animations**
   - No three.js particles
   - No 3D transforms
   - No complex transitions
   - Will be added in Pass 2

3. **No custom fonts**
   - Still using system fonts
   - High-end serif fonts will be added in Pass 2

4. **Simple hover effects**
   - Basic lift + glow only
   - More advanced effects in Pass 2

## 📸 Visual Comparison

### Home Page
**V1:** Light gray background, white card, standard button  
**V2:** Dark gradient, glass card with glow, gradient button

### Task Square
**V1:** Light theme, white cards, basic shadows  
**V2:** Dark theme, glass cards, gradient accents, better hierarchy

## 🔧 Troubleshooting

### UI V2 not showing?
1. Check `frontend/.env` has `VITE_UI_V2=true`
2. Restart dev server (Vite needs restart for env changes)
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for errors

### Glass effects not working?
- Check browser supports `backdrop-filter`
- Try Chrome/Edge (best support)
- Firefox may need `layout.css.backdrop-filter.enabled` in about:config

### Performance issues?
- Disable browser extensions
- Check GPU acceleration is enabled
- Try incognito mode
- Check CPU/GPU usage

## 📝 Feedback Template

When testing, please note:

```
## Visual Quality
- [ ] Looks professional and polished
- [ ] Colors are appealing
- [ ] Typography is readable
- [ ] Spacing feels right

## Functionality
- [ ] Everything works as before
- [ ] No regressions
- [ ] No console errors

## Performance
- [ ] Smooth animations
- [ ] Fast page loads
- [ ] No lag

## Suggestions
- What do you like?
- What could be improved?
- Any bugs or issues?
```

## 🎯 Success Criteria

UI V2 Pass 1 is successful if:
1. ✅ Looks significantly better than V1
2. ✅ All functionality works identically to V1
3. ✅ No performance degradation
4. ✅ Can toggle between V1/V2 safely
5. ✅ No console errors or warnings

---

**Ready to test?** Follow the Quick Start steps above! 🚀
