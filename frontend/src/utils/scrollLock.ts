// frontend/src/utils/scrollLock.ts
// Module-level counter so multiple components can request scroll lock independently.
// Scroll is only unlocked when all requests are released (count reaches 0).

let lockCount = 0;
let scrollPosition = 0;

export function lockScroll(): void {
  lockCount++;
  if (lockCount === 1) {
    scrollPosition = window.scrollY;
    document.body.style.top = `-${scrollPosition}px`;
    document.body.classList.add('scroll-lock');
  }
}

export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.classList.remove('scroll-lock');
    document.body.style.top = '';
    if (scrollPosition > 0) {
      window.scrollTo(0, scrollPosition);
    }
    scrollPosition = 0;
  }
}