import { useState } from 'react';
import { useAdminPortfolioPhotos, useAdminPortfolioCategories, useAdminPortfolioSessions } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DropZone from '../../components/DropZone';
import type { UploadedFileInfo } from '../../components/DropZone';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { PortfolioPhoto } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioPhotosAdmin: React.FC = () => {
  const { items, loading, error, createItem, deleteItem, reorderItems } = useAdminPortfolioPhotos();
  const { items: categories } = useAdminPortfolioCategories();
  const { items: sessions } = useAdminPortfolioSessions();
  const [bulkSessionId, setBulkSessionId] = useState<number>(0);
  const [bulkCategoryId, setBulkCategoryId] = useState<number>(0);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const selectedSessionPhotos = bulkSessionId
    ? items.filter(p => p.sessionId === bulkSessionId)
    : [];
  const photoLimitReached = selectedSessionPhotos.length >= 15;
  const remainingSlots = 15 - selectedSessionPhotos.length;

  const handleBulkUpload = async (files: UploadedFileInfo[]) => {
    if (!bulkSessionId || files.length === 0) return;
    setBulkError(null);
    for (const { url, name } of files) {
      try {
        await createItem({ title: name, imageUrl: url, sessionId: bulkSessionId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setBulkError(`Ошибка при сохранении "${name}": ${message}`);
        return;
      }
    }
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const bulkFilteredSessions = bulkCategoryId
    ? sessions.filter(s => s.categoryId === bulkCategoryId)
    : sessions;

  const getSessionName = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    return session ? session.name : '—';
  };

  const getCategoryName = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
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
      render: (item) => <img src={item.imageUrl} width="50" />,
    },
  ];

  return (
    <div className={styles.crudPage}>
      <h2>Фото портфолио</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      {/* ===== МАССОВАЯ ЗАГРУЗКА ===== */}
      <div className={styles.sectionCard}>
        <h3>📸 Массовая загрузка фото</h3>
        <div className={styles.formRow}>
          <select
            value={bulkCategoryId}
            onChange={e => {
              setBulkCategoryId(+e.target.value);
              setBulkSessionId(0);
            }}
          >
            <option value={0}>Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={bulkSessionId}
            onChange={e => setBulkSessionId(+e.target.value)}
          >
            <option value={0}>Выберите фотосессию</option>
            {bulkFilteredSessions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {bulkError && <div className={styles.error}>{bulkError}</div>}
        {bulkSessionId ? (
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
          <p className={styles.hint}>Сначала выберите категорию и фотосессию</p>
        )}
      </div>

      {/* ===== ТАБЛИЦА ===== */}
      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <button onClick={() => {
            if (confirmDelete(`фото "${item.title}"`)) {
              deleteItem(item.id);
            }
          }}>🗑️</button>
        )}
      />
    </div>
  );
};

export default PortfolioPhotosAdmin;