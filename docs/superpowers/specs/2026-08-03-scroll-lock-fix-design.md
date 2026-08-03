# Scroll Lock Reference Counter

**Date:** 2026-08-03
**Type:** Bug fix

## Problem

Burger menu and contacts overlay (bottom sheet) both independently manage `body.scroll-lock` class to prevent background scrolling when open. When both are open simultaneously:

1. Burger menu opens → `scroll-lock` added (scroll locked) ✅
2. Contacts overlay opens on top → `scroll-lock` added again (redundant but harmless)
3. Contacts overlay closes → **`scroll-lock` removed** ❌
4. Now body scroll is unlocked while burger menu is still open — incorrect behavior

Root cause: each component independently adds/removes the class without checking whether another component still needs it.

## Solution: Module-level reference counter

Created `frontend/src/utils/scrollLock.ts` with a shared counter:

- `lockScroll()` — increments counter. At count 1, actually applies `scroll-lock` and saves scroll position.
- `unlockScroll()` — decrements counter. At count 0, actually removes `scroll-lock` and restores scroll position.

Both `Layout.tsx` (burger menu) and `OverlayButtons.tsx` (contacts sheet) now call these functions instead of manipulating `document.body` directly.

## Components changed

| File | Change |
|------|--------|
| `frontend/src/utils/scrollLock.ts` | **New** — shared counter utility |
| `frontend/src/components/Layout.tsx` | Replace direct DOM manipulation with `lockScroll/unlockScroll` |
| `frontend/src/components/OverlayButtons.tsx` | Replace direct DOM manipulation + remove unused `useRef` |

## Verification

- Open burger menu → scroll locked
- Open contacts overlay over burger menu → scroll stays locked
- Close contacts overlay → scroll stays locked (burger menu still open)
- Close burger menu → scroll unlocked