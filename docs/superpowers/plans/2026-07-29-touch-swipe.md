# Touch Swipe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-based touch swipe to HeroCarousel and ImageLightbox on touch devices.

**Architecture:** Touch handlers (`touchstart`/`touchmove`/`touchend`) are added directly to the existing components. HeroCarousel gets real-time drag with transform tracking; ImageLightbox gets threshold-based navigation. Both reuse existing `next()`/`prev()` functions. Desktop (mouse) remains unchanged.

**Tech Stack:** React 19, TypeScript, CSS Modules, native DOM touch events.

**Global Constraints:**
- Touch handlers only; no mouse event changes
- Desktop buttons and keyboard navigation stay as-is
- Auto-play pauses during touch interaction

---

### Task 1: HeroCarousel — Add Touch Swipe

**Files:**
- Modify: `frontend/src/components/HeroCarousel.tsx`
- Modify: `frontend/src/components/HeroCarousel.module.css`

**Interfaces:**
- Consumes: existing `next()`, `prev()`, `setTransitionEnabled()`, `isPaused`/`setIsPaused`, `current` from the component
- Produces: touch swipe handlers on the `.carousel` container

- [ ] **Step 1: Add `touch-action: pan-y` to CSS**

In `frontend/src/components/HeroCarousel.module.css`, add to the `.carousel` block:

```css
touch-action: pan-y;
```

This tells the browser to let the component handle horizontal gestures while keeping vertical scroll native.

- [ ] **Step 2: Add touch state refs to the component**

In `frontend/src/components/HeroCarousel.tsx`, add these refs after the existing refs:

```typescript
const touchStartX = useRef(0);
const touchStartY = useRef(0);
const touchDeltaX = useRef(0);
const isDragging = useRef(false);
const containerRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 3: Add `ref={containerRef}` to the container div**

Update the root `<div className={styles.carousel}>`:

```tsx
<div
  className={styles.carousel}
  ref={containerRef}
  onMouseEnter={() => setIsPaused(true)}
  onMouseLeave={() => setIsPaused(false)}
>
```

- [ ] **Step 4: Add touch event handlers**

Add these handlers inside the component, before the return statement:

```typescript
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  if (total === 0) return;
  touchStartX.current = e.touches[0].clientX;
  touchStartY.current = e.touches[0].clientY;
  touchDeltaX.current = 0;
  isDragging.current = true;
  setIsPaused(true);
  // Отключаем transition, чтобы трек двигался за пальцем без задержки
  setTransitionEnabled(false);
}, [total, setIsPaused, setTransitionEnabled]);

const handleTouchMove = useCallback((e: React.TouchEvent) => {
  if (!isDragging.current || total === 0) return;
  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;
  const deltaX = currentX - touchStartX.current;
  const deltaY = currentY - touchStartY.current;

  // Если движение больше по вертикали — не мешаем скроллу
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    isDragging.current = false;
    setTransitionEnabled(true);
    return;
  }

  e.preventDefault();
  touchDeltaX.current = deltaX;

  // Двигаем трек в реальном времени за пальцем
  const track = containerRef.current?.querySelector('[class*="track"]') as HTMLElement | null;
  if (track) {
    track.style.transform = `translateX(calc(-${current * SLIDE_WIDTH}% + ${deltaX}px))`;
  }
}, [total, current, SLIDE_WIDTH]);

const handleTouchEnd = useCallback(() => {
  if (!isDragging.current || total === 0) {
    isDragging.current = false;
    return;
  }
  isDragging.current = false;

  const container = containerRef.current;
  const threshold = container ? container.clientWidth * 0.3 : 50;

  // Включаем transition для анимации snap back или перехода
  setTransitionEnabled(true);

  if (touchDeltaX.current < -threshold) {
    next();
  } else if (touchDeltaX.current > threshold) {
    prev();
  }
  // Иначе: snap back — transition включён, трек анимированно вернётся
  // на текущую позицию, потому что мы не меняли current.
  // Inline transform очистится автоматически при React re-render —
  // не удаляем его здесь, чтобы избежать скачка до обновления состояния.

  touchDeltaX.current = 0;
  setIsPaused(false);
}, [total, next, prev, setIsPaused, setTransitionEnabled]);
```

- [ ] **Step 5: Wire touch handlers to the container div**

Add `onTouchStart`, `onTouchMove`, `onTouchEnd` to the root div:

```tsx
onTouchStart={handleTouchStart}
onTouchMove={handleTouchMove}
onTouchEnd={handleTouchEnd}
```

- [ ] **Step 6: Verify the build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/HeroCarousel.tsx frontend/src/components/HeroCarousel.module.css
git commit -m "feat: add touch swipe to HeroCarousel"
```

---

### Task 2: ImageLightbox — Add Touch Swipe

**Files:**
- Modify: `frontend/src/components/ImageLightbox.tsx`

**Interfaces:**
- Consumes: existing `goNext()`, `goPrev()`, `hasPrev`, `hasNext`
- Produces: touch swipe handlers on the overlay element

- [ ] **Step 1: Add touch state refs**

Add after the existing refs:

```typescript
const touchStartX = useRef(0);
const touchStartY = useRef(0);
const lastTouchX = useRef(0);
const isSwiping = useRef(false);
```

- [ ] **Step 2: Add touch event handlers**

Add before the return statement:

```typescript
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
  touchStartY.current = e.touches[0].clientY;
  lastTouchX.current = e.touches[0].clientX;
  isSwiping.current = false;
}, []);

const handleTouchMove = useCallback((e: React.TouchEvent) => {
  if (e.touches.length !== 1) return;
  const deltaX = e.touches[0].clientX - touchStartX.current;
  const deltaY = e.touches[0].clientY - touchStartY.current;

  // Если вертикальное движение доминирует — не мешаем (закрытие по тапу на overlay)
  if (Math.abs(deltaY) > Math.abs(deltaX) * 2) return;

  isSwiping.current = true;
  lastTouchX.current = e.touches[0].clientX;
  e.preventDefault();
}, []);

const handleTouchEnd = useCallback(() => {
  if (!isSwiping.current) return;
  isSwiping.current = false;

  const deltaX = lastTouchX.current - touchStartX.current;

  if (deltaX < -50 && hasNext) {
    goNext();
  } else if (deltaX > 50 && hasPrev) {
    goPrev();
  }
}, [hasNext, hasPrev, goNext, goPrev]);
```

- [ ] **Step 3: Wire touch handlers to the overlay**

Add `onTouchStart`, `onTouchMove`, `onTouchEnd` to the overlay div:

```tsx
<div
  className={styles.overlay}
  onClick={handleOverlayClick}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  role="dialog"
  aria-modal="true"
  aria-label="Просмотр изображения"
  ref={overlayRef}
>
```

- [ ] **Step 4: Verify the build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ImageLightbox.tsx
git commit -m "feat: add touch swipe to ImageLightbox"
```