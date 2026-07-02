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
  const dragNode = useRef<HTMLElement | null>(null);

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

    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, items, onReorder]);

  const handleDragEnd = useCallback(() => {
    document.querySelectorAll(`.${styles.dragging}`).forEach(el => el.classList.remove(styles.dragging));
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (items.length === 0) {
    return <p className={styles.empty}>Нет элементов</p>;
  }

  return (
    <div className={styles.wrapper}>
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
              <td className={styles.dragHandle}>
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