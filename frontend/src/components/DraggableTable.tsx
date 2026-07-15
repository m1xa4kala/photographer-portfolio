import React, { useState, useCallback, useRef } from 'react';
import styles from './DraggableTable.module.css';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
}

interface DraggableTableProps<T extends { id: number }> {
  columns: Column<T>[];
  items: T[];
  loading: boolean;
  onReorder: (orderedIds: number[]) => void;
  actions?: (item: T) => React.ReactNode;
}

function DraggableTable<T extends { id: number }>({
  columns,
  items,
  loading,
  onReorder,
  actions,
}: DraggableTableProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const dragNode = useRef<HTMLElement | null>(null);
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setAnnouncement(''), 3000);
  }, []);

  const moveItem = useCallback((fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const reordered = [...items];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const orderedIds = reordered.map(item => item.id);
    onReorder(orderedIds);
    announce(`Элемент перемещён на позицию ${toIdx + 1}`);
  }, [items, onReorder, announce]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragNode.current = e.target as HTMLElement;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Delay adding the dragging class so the drag image shows properly
    requestAnimationFrame(() => {
      (e.target as HTMLElement).classList.add(styles.dragging);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  }, [dragIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only remove over class when leaving the row, not entering a child
    if (e.currentTarget === e.target || e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIdx) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIdx, 0, moved);

    // Map to IDs in new order
    const orderedIds = reordered.map(item => item.id);
    onReorder(orderedIds);
    announce(`Элемент перемещён на позицию ${dropIdx + 1}`);

    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, items, onReorder, announce]);

  const handleDragEnd = useCallback(() => {
    document.querySelectorAll(`.${styles.dragging}`).forEach(el => el.classList.remove(styles.dragging));
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault();
      moveItem(idx, idx - 1);
    } else if (e.key === 'ArrowDown' && idx < items.length - 1) {
      e.preventDefault();
      moveItem(idx, idx + 1);
    }
  }, [items.length, moveItem]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (items.length === 0) {
    return <p className={styles.empty}>Нет элементов</p>;
  }

  return (
    <div className={styles.wrapper}>
      {/* Screen reader announcement for reorder operations */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      >
        {announcement}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.dragHandleTh}></th>
            {columns.map(col => (
              <th key={col.key}>{col.header}</th>
            ))}
            {actions && <th>Действия</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={item.id}
              className={`${styles.row} ${dragIndex === idx ? styles.dragging : ''} ${overIndex === idx ? styles.dropOver : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <td
                className={styles.dragHandle}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                role="button"
                aria-label={`Переместить элемент ${idx + 1} из ${items.length}. Используйте стрелки вверх и вниз для изменения порядка`}
              >
                <span className={styles.grip} title="Перетащите для изменения порядка">⠿</span>
              </td>
              {columns.map(col => (
                <td key={col.key}>{col.render(item)}</td>
              ))}
              {actions && (
                <td className={styles.actions}>
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DraggableTable;
export type { Column };