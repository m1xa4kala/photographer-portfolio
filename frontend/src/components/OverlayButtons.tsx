// frontend/src/components/OverlayButtons.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { type Contact } from '../types';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
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

  // Lock body scroll when sheet is open (shared counter with burger menu)
  useEffect(() => {
    if (sheetOpen) {
      lockScroll();
    }
    return () => {
      if (sheetOpen) {
        unlockScroll();
      }
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