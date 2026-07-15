import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminPortfolioPhotos, useAdminPortfolioCategories, useAdminPortfolioSessions } from '../../hooks';
import { useConfirm } from '../../hooks/useConfirm';
import DropZone from '../../components/DropZone';
import type { UploadedFileInfo } from '../../components/DropZone';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { PortfolioPhoto } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioPhotosAdmin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterCategoryId = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : undefined;
  const filterSessionId = searchParams.get('sessionId')
    ? Number(searchParams.get('sessionId'))
    : undefined;

  const { items, loading, error, createItem, deleteItem, reorderItems } =
    useAdminPortfolioPhotos(filterSessionId);
  const { items: categories } = useAdminPortfolioCategories();
  const { items: allSessions } = useAdminPortfolioSessions();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Filter sessions by selected category (client-side, for the dropdown)
  const filteredSessions = filterCategoryId
    ? allSessions.filter(s => s.categoryId === filterCategoryId)
    : allSessions;

  const selectedSessionPhotos = items;
  const photoLimitReached = selectedSessionPhotos.length >= 15;
  const remainingSlots = 15 - selectedSessionPhotos.length;

  const handleCategoryChange = (catId: number) => {
    const next = new URLSearchParams(searchParams);
    if (catId) {
      next.set('categoryId', String(catId));
    } else {
      next.delete('categoryId');
    }
    // Reset session when category changes
    next.delete('sessionId');
    setSearchParams(next, { replace: true });
  };

  const handleSessionChange = (sessionId: number) => {
    const next = new URLSearchParams(searchParams);
    if (sessionId) {
      next.set('sessionId', String(sessionId));
    } else {
      next.delete('sessionId');
    }
    setSearchParams(next, { replace: true });
  };

  const handleBulkUpload = async (files: UploadedFileInfo[]) => {
    if (!filterSessionId || files.length === 0) return;
    setBulkError(null);
    for (const { url, name } of files) {
      try {
        const title = name.replace(/\.[^.]+$/, '');
        await createItem({ title, imageUrl: url, sessionId: filterSessionId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setBulkError(`Ошибка при сохранении "${name}": ${message}`);
        continue;
      }
    }
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const getSessionName = (sessionId: number) => {
    const session = allSessions.find(s => s.id === sessionId);
    return session ? session.name : '—';
  };

  const getCategoryName = (sessionId: number) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return '—';
    const cat = categories.find(c => c.id === session.categoryId);
    return cat ? cat.name : '—';
  };

  const columns: Column<PortfolioPhoto>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'title', header: 'Название', render: (item) => item.title || '—' },
    { key: 'category', header: 'Категория', render: (item) => getCategoryName(item.sessionId) },
    { key: 'session', header: 'Фотосессия', render: (item) => getSessionName(item.sessionId) },
    {
      key: 'image',
      header: 'Изображение',
      render: (item) => <img src={item.imageUrl} alt="" width="50" />,
    },
  ];

  return (
    <div className={styles.crudPage}>
      <h2>Фото портфолио</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      {/* ===== ФИЛЬТРЫ И МАССОВАЯ ЗАГРУЗКА ===== */}
      <div className={styles.sectionCard}>
        <h3>📸 Фильтр и массовая загрузка</h3>
        <div className={styles.formRow}>
          <select
            value={filterCategoryId ?? 0}
            onChange={e => handleCategoryChange(+e.target.value)}
          >
            <option value={0}>Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={filterSessionId ?? 0}
            onChange={e => handleSessionChange(+e.target.value)}
          >
            <option value={0}>Все фотосессии</option>
            {filteredSessions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {bulkError && <div className={styles.error}>{bulkError}</div>}
        {filterSessionId ? (
          photoLimitReached ? (
            <p className={styles.limitMessage}>
              ❌ Достигнут лимит в 15 фото для этой сессии.
            </p>
          ) : (
            <>
              <p className={styles.limitHint}>Осталось мест: {remainingSlots} / 15</p>
              <DropZone onUploadComplete={handleBulkUpload} />
            </>
          )
        ) : (
          <p className={styles.hint}>Выберите фотосессию для загрузки фото</p>
        )}
      </div>

      {/* ===== ТАБЛИЦА ===== */}
      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <button aria-label="Удалить" onClick={async () => {
            if (await confirm(`Удалить фото "${item.title}"? Это действие нельзя отменить.`)) {
              await deleteItem(item.id);
            }
          }}>🗑️</button>
        )}
      />
      <ConfirmDialogComponent />
    </div>
  );
};

export default PortfolioPhotosAdmin;