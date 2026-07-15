# Carousel Tablet Viewport & Header Responsive Fix

## Overview

Add tablet viewport (2 photos) to HeroCarousel and fix header overflow at ~800px by making nav links fit without burger menu.

## Breakpoints

| Viewport | Width | Carousel photos | Header behavior |
|----------|-------|-----------------|-----------------|
| Mobile | < 768px | 1 | Burger menu |
| Tablet | 768–1023px | 2 | Full nav, compact |
| Desktop | ≥ 1024px | 3 | Full nav, normal |

## Changes

### 1. `HeroCarousel.tsx`

- Add `TABLET_BREAKPOINT = 1024` constant
- Replace `isMobile` state with `viewport: 'mobile' | 'tablet' | 'desktop'`
- Two `matchMedia` listeners (768px, 1024px) to set viewport
- `VISIBLE_COUNT = viewport === 'mobile' ? 1 : viewport === 'tablet' ? 2 : 3`
- All other logic (`SLIDE_WIDTH`, `extended`, `snapTo`, `handleTransitionEnd`) — unchanged, driven by `VISIBLE_COUNT`

### 2. `HeroCarousel.module.css`

- Minor tablet adjustments if needed (arrows, padding) — TBD during implementation

### 3. `Layout.module.css`

- New media query for tablet: `@media (min-width: 769px) and (max-width: 1023px)`
- Reduced header padding: `0.75rem 1.5rem`
- Reduced nav gap: `1rem`
- Reduced nav link font-size: `0.9rem`
- Reduced logo font-size: `1.1rem`

## Unchanged

- `Layout.tsx` — no logic changes
- `Home.tsx` — no changes
- `ImageWithSkeleton` — no changes
- Carousel navigation, auto-play, infinite loop logic — no changes
- Mobile CSS (< 768px) — unchanged
- Desktop CSS (≥ 1024px) — unchanged