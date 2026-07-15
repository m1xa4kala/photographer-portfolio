import { useState } from 'react';
import { useAdminBestPhotos } from '../../hooks';
import { useConfirm } from '../../hooks/useConfirm';
import DropZone from '../../components/DropZone';
import type { UploadedFileInfo } from '../../components/DropZone';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import styles from './adminCrud.module.css';

const BestPhotosAdmin: React.FC = () => {
  const { items, loading, error, createItem, deleteItem, reorderItems } = useAdminBestPhotos();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [bulkError, setBulkError] = useState<string | null>(null);

  const handleBulkUpload = async (files: UploadedFileInfo[]) => {
    setBulkError(null);
    for (const { url, name } of files) {
      try {
        const title = name.replace(/\.[^.]+$/, '');
        await createItem({ title, imageUrl: url });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setBulkError(`Ошибка при сохранении "${name}": ${message}`);
        continue;
      }
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (await confirm(`Удалить "${title}"? Это действие нельзя отменить.`)) {
      await deleteItem(id);
    }
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<typeof items[0]>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'title', header: 'Название', render: (item) => item.title },
    {
      key: 'image',
      header: 'Изображение',
      render: (item) => item.imageUrl ? <img src={item.imageUrl} alt="" width="50" /> : '—',
    },
  ];

  return (
    <div className={styles.crudPage}>
      <h2>Лучшие фото</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      <div className={styles.sectionCard}>
        <h3>📸 Загрузка лучших фото</h3>
        {bulkError && <div className={styles.error}>{bulkError}</div>}
        <DropZone onUploadComplete={handleBulkUpload} />
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <button aria-label="Удалить" onClick={() => handleDelete(item.id, item.title)}>🗑️</button>
        )}
      />
    <ConfirmDialogComponent />
    </div>
  );
};

export default BestPhotosAdmin;