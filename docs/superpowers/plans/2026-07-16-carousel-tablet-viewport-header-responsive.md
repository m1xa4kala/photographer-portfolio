# Carousel Tablet Viewport & Header Responsive Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tablet viewport (2 photos visible) to HeroCarousel and fix header nav overflow at ~800px.

**Architecture:** Extend existing single-breakpoint responsive logic to three breakpoints. Replace `isMobile` boolean with `viewport` enum. Header gets a compact media query between 769px–1023px to keep full nav without burger.

**Tech Stack:** React 19, TypeScript, CSS Modules, Vite

## Global Constraints

- Follow existing code patterns exactly (matchMedia, CSS Modules, useCallback)
- Don't change Layout.tsx logic — CSS only
- Don't change carousel navigation, auto-play, or infinite loop logic
- All existing functionality must continue working

---

### Task 1: HeroCarousel.tsx — Add tablet viewport support

**Files:**
- Modify: `frontend/src/components/HeroCarousel.tsx`

**Interfaces:**
- Consumes: existing `HeroCarouselProps` (unchanged)
- Produces: `viewport` state consumed by `VISIBLE_COUNT`, which drives `SLIDE_WIDTH`, `extended`, `snapTo`

- [ ] **Step 1: Add TABLET_BREAKPOINT constant**

After `const MOBILE_BREAKPOINT = 768;` (line 7), add:

```ts
const TABLET_BREAKPOINT = 1024;
```

- [ ] **Step 2: Replace `isMobile` state with `viewport` state**

Replace lines 21-28:

```ts
const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
  if (window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches) return 'mobile';
  if (window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`).matches) return 'tablet';
  return 'desktop';
});
```

- [ ] **Step 3: Update matchMedia effect**

Replace lines 23-28 (the useEffect with matchMedia):

```ts
useEffect(() => {
  const mobileMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  const tabletMql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);

  const handleChange = () => {
    if (mobileMql.matches) setViewport('mobile');
    else if (tabletMql.matches) setViewport('tablet');
    else setViewport('desktop');
  };

  mobileMql.addEventListener('change', handleChange);
  tabletMql.addEventListener('change', handleChange);
  return () => {
    mobileMql.removeEventListener('change', handleChange);
    tabletMql.removeEventListener('change', handleChange);
  };
}, []);
```

- [ ] **Step 4: Update VISIBLE_COUNT**

Replace line 30:

```ts
const VISIBLE_COUNT = viewport === 'mobile' ? 1 : viewport === 'tablet' ? 2 : 3;
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /c/Users/Mikl/Desktop/photographer-project/frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Mikl/Desktop/photographer-project && git add frontend/src/components/HeroCarousel.tsx && git commit -m "feat: add tablet viewport (2 photos) to HeroCarousel

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Layout.module.css — Compact header for tablet

**Files:**
- Modify: `frontend/src/components/Layout.module.css`

- [ ] **Step 1: Add tablet media query**

After the mobile `@media (max-width: 768px)` block (starts at line 166), add:

```css
/* Tablet — compact header to fit all nav links */
@media (min-width: 769px) and (max-width: 1023px) {
  .header {
    padding: 0.75rem 1.5rem;
  }

  .nav {
    gap: 1rem;
  }

  .nav a {
    font-size: 0.9rem;
  }

  .logoName {
    font-size: 1.1rem;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd /c/Users/Mikl/Desktop/photographer-project/frontend && npx vite build 2>&1 | tail -5
```
Expected: `✓ built in Xms`

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Mikl/Desktop/photographer-project && git add frontend/src/components/Layout.module.css && git commit -m "fix: compact header nav for tablet viewport (769-1023px)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```