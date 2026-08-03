# Overlay Buttons — Scroll to Top & Contacts Bottom Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two floating overlay buttons at bottom-right of every public page — scroll-to-top (↑) and contacts (📞) that opens a bottom-sheet overlay with contact info.

**Architecture:** Pure frontend. New `OverlayButtons` component renders two `position: fixed` FAB buttons + a bottom sheet with backdrop. Reuses existing `Contacts` component and `useContacts()` hook. No backend changes.

**Tech Stack:** React 19, TypeScript, CSS Modules

## Global Constraints

- No backend or DB changes needed
- Reuse existing `Contacts` component and `useContacts()` hook
- Use CSS Modules (`*.module.css`) for all styling
- Use CSS custom properties from `variables.css` for colors/shadows
- Buttons use inline SVG icons
- i18n: Russian labels

---

### Task 1: Create OverlayButtons component

**Files:**
- Create: `frontend/src/components/OverlayButtons.tsx`
- Create: `frontend/src/components/OverlayButtons.module.css`

**Interfaces:**
- Consumes: `Contact[]` via `useContacts()` hook (called in Layout, passed as prop)
- Produces: `<OverlayButtons contacts={Contact[]} />` — exported component

- [ ] **Step 1: Create `OverlayButtons.module.css`**

```css
/* frontend/src/components/OverlayButtons.module.css */
.overlayButtons {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 110;
}

.fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease, transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  color: var(--text-primary);
}

.fab:hover {
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
  color: var(--accent);
}

.fab:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Scroll to top — hidden by default */
.scrollTop {
  opacity: 0;
  pointer-events: none;
}

.scrollTopVisible {
  opacity: 1;
  pointer-events: auto;
}

/* Backdrop */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  animation: fadeIn 0.25s ease;
}

/* Bottom sheet */
.sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 201;
  background: var(--bg-primary);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  margin: 0 auto;
  padding: 1.5rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  animation: slideUp 0.3s ease;
  max-height: 80vh;
  overflow-y: auto;
}

.sheetHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.sheetTitle {
  font-family: var(--font-heading-display);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--text-primary);
}

.closeButton {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--bg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: background 0.2s ease, color 0.2s ease;
}

.closeButton:hover {
  background: var(--border);
  color: var(--text-primary);
}

.closeButton:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.sheetBody {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.emptyMessage {
  color: var(--text-secondary);
  font-size: 0.95rem;
  text-align: center;
  padding: 1rem 0;
}

/* Mobile: full width sheet */
@media (max-width: 480px) {
  .overlayButtons {
    bottom: 1rem;
    right: 1rem;
  }

  .sheet {
    max-width: 100%;
    border-radius: 12px 12px 0 0;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

- [ ] **Step 2: Create `OverlayButtons.tsx`**

```tsx
// frontend/src/components/OverlayButtons.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { type Contact } from '../types';
import Contacts from './Contacts';
import styles from './OverlayButtons.module.css';

interface OverlayButtonsProps {
  contacts: Contact[];
}

const SCROLL_THRESHOLD = 200;

const OverlayButtons: React.FC<OverlayButtonsProps> = ({ contacts }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > SCROLL_THRESHOLD);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openSheet = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!sheetOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSheet();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sheetOpen, closeSheet]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (sheetOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10));
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY > 0) {
        window.scrollTo(0, scrollY);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [sheetOpen]);

  return (
    <>
      <div className={styles.overlayButtons}>
        {/* Scroll to top */}
        <button
          type="button"
          className={`${styles.fab} ${styles.scrollTop} ${showScrollTop ? styles.scrollTopVisible : ''}`}
          onClick={scrollToTop}
          aria-label="Наверх"
          tabIndex={showScrollTop ? 0 : -1}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>

        {/* Contacts */}
        <button
          type="button"
          className={styles.fab}
          onClick={sheetOpen ? closeSheet : openSheet}
          aria-label="Контакты"
          aria-expanded={sheetOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
      </div>

      {/* Bottom sheet */}
      {sheetOpen && (
        <>
          <div className={styles.backdrop} onClick={closeSheet} aria-hidden="true" />
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Контакты"
          >
            <div className={styles.sheetHeader}>
              <h3 className={styles.sheetTitle}>Контакты</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeSheet}
                aria-label="Закрыть"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.sheetBody}>
              {contacts.length > 0 ? (
                <Contacts contacts={contacts} vertical />
              ) : (
                <p className={styles.emptyMessage}>Контакты не найдены</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default OverlayButtons;
```

- [ ] **Step 3: Verify files compile**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/OverlayButtons.tsx frontend/src/components/OverlayButtons.module.css
git commit -m "feat: add OverlayButtons component with scroll-to-top and contacts bottom sheet"
```

### Task 2: Integrate OverlayButtons in Layout

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

**Interfaces:**
- Consumes: `<OverlayButtons contacts={Contact[]} />` from Task 1
- Provides: `contacts` from `useContacts()` already in Layout

- [ ] **Step 1: Add import and render in `Layout.tsx`**

After the existing `import Contacts from './Contacts';` line (line 4), add:
```tsx
import OverlayButtons from './OverlayButtons';
```

After Footer line (before closing `</div>` of the container):
```tsx
      <OverlayButtons contacts={contacts} />
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat: integrate OverlayButtons in Layout"
```