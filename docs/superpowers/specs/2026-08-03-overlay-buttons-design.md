# Overlay Buttons — Scroll to Top & Contacts Bottom Sheet

**Date:** 2026-08-03
**Status:** Approved design

## Overview

Add two floating overlay buttons fixed to the bottom-right of every public page: a scroll-to-top button and a contacts button that opens a bottom-sheet overlay with contact information (social links, phone).

## Requirements

- Two icon-only buttons, stacked vertically, fixed at bottom-right
- Scroll-to-top button: classic up arrow (↑ SVG), appears only after scrolling > 200px, smooth scrolls to top
- Contacts button: phone icon (📞 SVG), always visible, opens a bottom-sheet overlay with existing contacts
- Bottom sheet: slides up from bottom, shows Contacts component (same data as footer via `useContacts()`), closes via ✕ button or clicking the dark backdrop overlay
- Dark backdrop blocks interaction with content behind
- Animations: fade/slide for appearance, consistent with site's existing transitions

## Implementation Plan

### Files to create
1. `frontend/src/components/OverlayButtons.tsx` — New component with both buttons + bottom sheet
2. `frontend/src/components/OverlayButtons.module.css` — Styles for buttons, bottom sheet, backdrop

### Files to modify
1. `frontend/src/components/Layout.tsx` — Import and render `<OverlayButtons />` inside the layout

### No changes needed
- Contacts component already exists and is reusable
- `useContacts()` hook already available in Layout
- No new API, types, or backend changes needed

## Component Architecture

```
OverlayButtons
├── ScrollToTopButton (↑ icon, shown when scrollY > 200)
├── ContactsFAB (📞 icon, always visible)
└── BottomSheet (conditionally rendered)
    ├── Backdrop (dark overlay, closes sheet on click)
    ├── Sheet panel (slides up from bottom)
    │   ├── Header (title "Контакты" + ✕ close button)
    │   └── Body (<Contacts contacts={contacts} />)
    └──
```

## States

### Scroll-to-top button
- **Hidden** (default) — scrollY <= 200px, opacity 0, pointer-events none
- **Visible** — scrollY > 200px, opacity 1, smooth fade-in
- **Hover** — higher opacity / accent color
- **Click** — `window.scrollTo({ top: 0, behavior: 'smooth' })`

### Contacts button
- **Default** — always visible, semi-transparent circle
- **Hover** — fully opaque, accent color
- **Click (sheet closed)** — opens bottom sheet with animation
- **Click (sheet open)** — closes bottom sheet (toggle)

### Bottom sheet
- **Closed** — display: none / transformed off-screen
- **Opening** — slide up from bottom with backdrop fade-in (~300ms)
- **Open** — visible with backdrop, contacts rendered, body scroll locked
- **Closing** — slide down with backdrop fade-out
- **Close triggers** — ✕ button click, backdrop click, Escape key

## Styling

- Buttons: 48×48px circles, white bg with slight opacity, shadow, accent hover
- Stack gap: 12px
- Position: fixed, bottom: 2rem, right: 2rem (mobile: bottom: 1rem, right: 1rem)
- Z-index: above header (z-index: 110)
- Bottom sheet: max-width: 400px, rounded corners, padding, scrim backdrop
- Mobile: full-width bottom sheet with safe-area padding
- Uses CSS custom properties from `variables.css` (`--accent`, `--bg-primary`, `--text-primary`, `--shadow`)

## Accessibility

- Buttons have `aria-label` (Наверх / Контакты)
- Bottom sheet has `role="dialog"`, `aria-modal="true"`, `aria-label="Контакты"`
- Focus trapped inside sheet when open
- Escape key closes sheet
- Backdrop is `aria-hidden="true"`

## Error Handling

- If `contacts` array is empty, bottom sheet shows a simple "Контакты не найдены" message
- Scroll-to-top button has no real error state — if `window` is unavailable (SSR), the component handles gracefully