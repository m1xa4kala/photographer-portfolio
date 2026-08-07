# Mobile Zoom Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix double-tap zoom reset and abrupt pinch-to-zoom on mobile in `ImageLightbox`.

**Architecture:** Modify two files — CSS (`touch-action` fix) and the touch handler logic in the React component (tap detection, pinch transition control).

**Tech Stack:** React 19, TypeScript, CSS Modules

## Global Constraints

- No new dependencies
- Desktop behavior must remain unchanged
- All changes in two files only: `ImageLightbox.tsx` + `ImageLightbox.module.css`
- DRAG_THRESHOLD = 8px (existing constant)

---

### Task 1: Update CSS — touch-action on overlay

**Files:**
- Modify: `frontend/src/components/ImageLightbox.module.css`

**Interfaces:**
- Consumes: (none)
- Produces: `.overlay` with `touch-action: none`

- [ ] **Step 1: Change `touch-action` from `pan-y` to `none`**

```css
/* before */
.overlay {
  touch-action: pan-y;
}

/* after */
.overlay {
  touch-action: none;
}
```

This prevents the browser from intercepting any touch gestures (scrolling, zooming) on the overlay, which could conflict with the custom pinch handler.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ImageLightbox.module.css
git commit -m "fix: disable browser touch actions on lightbox overlay"
```

---

### Task 2: Rewrite handleTouchEnd — tap detection + zoom reset + swipe down

**Files:**
- Modify: `frontend/src/components/ImageLightbox.tsx` (handleTouchEnd)

**Interfaces:**
- Consumes: existing `isZoomed`, `resetZoomState`, `touchStartX.current`, `touchStartY.current`, `DRAG_THRESHOLD`
- Produces: handleTouchEnd with event param that detects taps vs drags vs swipes

- [ ] **Step 1: Update `handleTouchEnd` signature to accept the event**

Add the `e: React.TouchEvent` parameter:

```tsx
const handleTouchEnd = useCallback((e: React.TouchEvent) => {
```

- [ ] **Step 2: Implement full logic with tap detection, zoom reset on tap, swipe-down-to-close**

```tsx
const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  if (isPinching.current) {
    isPinching.current = false;
    return;
  }

  // Get end position for tap/distance detection
  let endX = touchStartX.current;
  let endY = touchStartY.current;
  if (e.changedTouches.length > 0) {
    endX = e.changedTouches[0].clientX;
    endY = e.changedTouches[0].clientY;
  }

  const deltaX = endX - touchStartX.current;
  const deltaY = endY - touchStartY.current;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const isShortTap = distance < DRAG_THRESHOLD;

  if (isZoomed) {
    if (isShortTap) {
      // Tap while zoomed → reset zoom
      resetZoomState();
      return;
    }
    // Swipe down while zoomed → close
    if (deltaY > 80) {
      onClose();
      return;
    }
    // Pan while zoomed
    dragPos.current = { ...position };
    return;
  }

  if (!isShortTap) {
    // Swipe to navigate
    if (deltaX < -50 && hasNext) {
      goNext();
    } else if (deltaX > 50 && hasPrev) {
      goPrev();
    }
    return;
  }

  // Double-tap detection
  const now = Date.now();
  if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
    toggleZoomAtPoint(endX, endY);
    lastTapTime.current = 0;
    return;
  }
  lastTapTime.current = now;
}, [isZoomed, computeOrigin, position, hasNext, hasPrev, onClose]);
```

- [ ] **Step 3: Update `touchStartX/Y` in `handleTouchStart` for zoomed state**

Currently `touchStartX.current` and `touchStartY.current` are set in the single-touch branch of `handleTouchStart`. Verify they're set regardless of zoom state. Looking at existing code:

```tsx
if (e.touches.length === 1) {
  touchStartX.current = e.touches[0].clientX;
  touchStartY.current = e.touches[0].clientY;
  lastTouchX.current = e.touches[0].clientX;
  isSwiping.current = false;
  dragPos.current = { ...position };
}
```

This already runs for all single touches regardless of `isZoomed` — no changes needed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ImageLightbox.tsx
git commit -m "fix: handle touch end properly on mobile — tap resets zoom, swipe down closes"
```

---

### Task 3: Remove CSS transition during pinch gesture

**Files:**
- Modify: `frontend/src/components/ImageLightbox.tsx`

**Interfaces:**
- Consumes: `imageRef`, `isPinching` ref
- Produces: smooth pinch zoom without transition lag

- [ ] **Step 1: Disable transition when pinch starts (in `handleTouchStart`)**

```tsx
if (e.touches.length === 2) {
  isPinching.current = true;
  isSwiping.current = false;
  lastPinchDist.current = getTouchDist(e.touches);
  // Disable CSS transition during pinch for smooth response
  if (imageRef.current) {
    imageRef.current.style.transition = 'none';
  }
  return;
}
```

- [ ] **Step 2: Re-enable transition when pinch ends (in `handleTouchEnd`)**

```tsx
if (isPinching.current) {
  isPinching.current = false;
  // Restore CSS transition after pinch
  if (imageRef.current) {
    imageRef.current.style.transition = '';
  }
  return;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ImageLightbox.tsx
git commit -m "fix: disable CSS transition during pinch zoom for smooth gesture response"
```

---

### Task 4: Verify build

- [ ] **Step 1: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run lint**

```bash
cd frontend && npx eslint src/components/ImageLightbox.tsx
```

Expected: clean.

- [ ] **Step 3: Run Vite build**

```bash
cd frontend && npx vite build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit any lint/build fixes**

```bash
git add -A
git commit -m "chore: fix lint/type issues after zoom changes"
```