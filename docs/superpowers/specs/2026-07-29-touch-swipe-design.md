# Touch Swipe Support for Carousel and Lightbox

**Date:** 2026-07-29
**Status:** Approved

## Overview

Add drag-based touch swipe to the HeroCarousel and ImageLightbox components on touch-capable devices. Desktop (mouse) interaction remains unchanged — arrow buttons and keyboard navigation stay as-is.

## Scope

- **HeroCarousel** — home page hero carousel with multi-slide layout
- **ImageLightbox** — portfolio photo lightbox modal

---

## 1. HeroCarousel — Touch Swipe

### Behavior

| Event | Action |
|-------|--------|
| `touchstart` | Record start X position, disable CSS transition, set `isPaused = true` |
| `touchmove` | Calculate delta from start, apply real-time transform to track. Call `preventDefault()` on horizontal movement to block vertical scroll |
| `touchend` | If delta >= 30% of visible width → call `next()` or `prev()`. Else → snap back to current position. Re-enable CSS transition |

### Implementation Details

- **Touch detection**: Touch handlers are added unconditionally. They fire only on touch devices naturally. No `isTouchDevice` check needed.
- **Auto-play**: During touch interaction `isPaused` is set to `true` (already handled by existing `onMouseEnter`/`onMouseLeave` pattern). Add `onTouchStart`/`onTouchEnd` to the same pause mechanism.
- **CSS**: Add `touch-action: pan-y` on `.carousel` to tell the browser to handle vertical scroll only while the carousel handles horizontal.
- **Infinite loop**: Touch swipe reuses existing `next()`/`prev()` functions. The infinite scroll logic (cloned slides, snap-to-real) is untouched.
- **Threshold**: 30% of the carousel's visible width (clientWidth / VISIBLE_COUNT approximately).

### Edge Cases

| Case | Handling |
|------|----------|
| Fast flick (low distance, high velocity) | Treat as full swipe if delta > 10px (not just a tap) |
| Tap without movement | Ignored — no navigation |
| Multi-touch | Ignore; only track the first touch point |
| Very slow drag | Still respects 30% threshold on release |
| Drag across multiple slides | Only advances one slide per gesture (calls `next()`/`prev()` once) |

---

## 2. ImageLightbox — Touch Swipe

### Behavior

| Event | Action |
|-------|--------|
| `touchstart` | Record start X and Y position |
| `touchmove` | Calculate delta. If `|deltaY| > |deltaX| * 2` → treat as vertical, ignore (allow overlay close via clicking). Else `preventDefault()` |
| `touchend` | If `deltaX < -50px` → `goNext()`. If `deltaX > 50px` → `goPrev()`. Otherwise, no action |

### Implementation Details

- **No drag animation**: The lightbox simply switches the image on release. No real-time transform during drag — keeps implementation simple.
- **Vertical tolerance**: If the user's finger moves more vertically than horizontally (2x factor), the gesture is treated as a scroll attempt, not a swipe.
- **Buttons stay**: Arrow buttons remain visible and functional alongside swipe.

### Edge Cases

| Case | Handling |
|------|----------|
| Swipe when at first/last image | Respect `hasPrev`/`hasNext` — no navigation beyond bounds |
| Tap on image (no movement) | Ignored — image click doesn't close |
| Tap on overlay background | Closes lightbox (existing behavior, unchanged) |
| Swipe during image load | Image is already loaded (lightbox shows from array), no issue |

---

## 3. Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/HeroCarousel.tsx` | Add touch handlers, pause auto-play during touch, add `touch-action` |
| `frontend/src/components/HeroCarousel.module.css` | Add `touch-action: pan-y` to `.carousel` |
| `frontend/src/components/ImageLightbox.tsx` | Add touch handlers for swipe navigation |
| `frontend/src/components/ImageLightbox.module.css` | (Optional) add `touch-action: pan-y` to overlay |

---

## 4. Non-goals

- No desktop drag support (mouse events)
- No pull-to-close on lightbox (swipe down to close)
- No visual drag preview showing next/previous image peek
- No velocity-based navigation (acceleration)