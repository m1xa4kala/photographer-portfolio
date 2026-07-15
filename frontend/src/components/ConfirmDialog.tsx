import { useEffect, useRef, useCallback } from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title = 'Подтверждение', message,
  onConfirm, onCancel,
  confirmLabel = 'Да', cancelLabel = 'Отмена',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }
    // Focus trap: Tab cycles between cancel and confirm buttons
    if (e.key === 'Tab') {
      e.preventDefault();
      if (document.activeElement === cancelRef.current) {
        confirmRef.current?.focus();
      } else {
        cancelRef.current?.focus();
      }
    }
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;
    // Save the previously focused element
    previouslyFocused.current = document.activeElement;
    // Focus the cancel button (safer default)
    cancelRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that opened the dialog
      (previouslyFocused.current as HTMLElement)?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()} ref={dialogRef}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} ref={cancelRef}>{cancelLabel}</button>
          <button className={styles.confirmBtn} onClick={onConfirm} ref={confirmRef}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;