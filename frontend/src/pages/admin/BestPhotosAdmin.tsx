import { useState } from 'react';
import { useAdminBestPhotos } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DropZone from '../../components/DropZone';
import type { UploadedFileInfo } from '../../components/DropZone';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import styles from './adminCrud.module.css';

const BestPhotosAdmin: React.FC = () => {
  const { items, loading, error, createItem, deleteItem, reorderItems } = useAdminBestPhotos();
  const [bulkError, setBulkError] = useState<string | null>(null);

  const handleBulkUpload = async (files: UploadedFileInfo[]) => {
    setBulkError(null);
    for (const { url, name } of files) {
      try {
        await createItem({ title: name, imageUrl: url });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setBulkError(`Ошибка при сохранении "${name}": ${message}`);
        return;
      }
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (confirmDelete(title)) {
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
      render: (item) => item.imageUrl ? <img src={item.imageUrl} width="50" /> : '—',
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
          <button onClick={() => handleDelete(item.id, item.title)}>🗑️</button>
        )}
      />
    </div>
  );
};

export default BestPhotosAdmin;