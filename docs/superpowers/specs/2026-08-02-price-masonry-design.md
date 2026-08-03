# Price Page — Masonry Layout with Variable Card Sizes

**Date:** 2026-08-02
**Status:** Approved

## Overview

Change the Price page grid from a uniform CSS Grid to a Pinterest-style masonry layout using CSS Columns. Card heights vary naturally based on photo aspect ratio — landscape images produce shorter cards, portrait images produce taller cards. No backend or database changes needed.

## Layout

- **Desktop (>768px):** 3 columns
- **Tablet (481–768px):** 2 columns
- **Mobile (≤480px):** 1 column

Implemented via `column-count` and `column-gap` on the grid container. Cards use `break-inside: avoid` to prevent splitting across columns.

## Card

Structure remains unchanged:

```
┌────────────────────┐
│ Photo (no fixed    │
│ height, natural    │
│ aspect ratio)      │
├────────────────────┤
│ Gradient overlay   │
│   Name / Price     │
├────────────────────┤
│ • description item │
│ • description item │
└────────────────────┘
```

Changes from current implementation:

| Property | Before | After |
|----------|--------|-------|
| Photo height | `220px` fixed | Auto (determined by aspect ratio) |
| Photo object-fit | `cover` | Removed — image fills width naturally |
| Grid system | `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` | `columns: 3; column-gap: 1.5rem` |
| Card vertical spacing | `gap: 2rem` (grid gap) | `margin-bottom: 1.5rem` on `.card` |
| Placeholder height | 100% of 220px wrapper | Fixed `200px` |

## Files Changed

1. **`frontend/src/pages/Price.module.css`** — Replace grid with columns, remove fixed photo height
2. **`frontend/src/pages/Price.tsx`** — Minor adjustments (remove any fixed-height references)

## Edge Cases

- **No image:** Placeholder has fixed 200px height so the card doesn't collapse
- **Single item:** Centered naturally by column count
- **Loading state:** Skeleton adapts — still uses placeholders but without grid constraints
- **Error state:** Unchanged (centered message + retry button)

## Testing

- Visual check: items render in masonry columns with varying heights
- Responsive check: 3 → 2 → 1 columns at breakpoints
- Image load check: cards reflow correctly when images load asynchronously