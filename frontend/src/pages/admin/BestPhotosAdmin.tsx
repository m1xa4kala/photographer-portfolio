import { useState } from 'react';
import { useAdminBestPhotos } from '../../hooks';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DropZone from '../../components/DropZone';
import type { UploadedFileInfo } from '../../components/DropZone';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import type { Column } from '../../components/DraggableTable';
import styles from './adminCrud.module.css';

const BestPhotosAdmin: React.FC = () => {
  const { items, loading, error, createItem, deleteItem, reorderItems } = useAdminBestPhotos();
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
    <AdminPageLayout title="Лучшие фото" error={error}>

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
          <DeleteButton itemName={`"${item.title}"`} onDelete={() => deleteItem(item.id)} />
        )}
      />
    </AdminPageLayout>
  );
};

export default BestPhotosAdmin;