import React, { useState } from 'react';
import { useAdminPortfolioCategories, useUploadImage } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { PortfolioCategory } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioCategoriesAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminPortfolioCategories();
  const { uploadImage, uploading } = useUploadImage();
  const [editing, setEditing] = useState<PortfolioCategory | null>(null);
  const [form, setForm] = useState<Pick<PortfolioCategory, 'name' | 'slug' | 'coverImageUrl'>>({ name: '', slug: '', coverImageUrl: '' });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      setForm(prev => ({ ...prev, coverImageUrl: url }));
    }
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', slug: '', coverImageUrl: '' });
  };

  // Генерация slug из name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm(prev => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<PortfolioCategory>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'name', header: 'Название', render: (item) => item.name },
    { key: 'slug', header: 'Slug', render: (item) => item.slug },
    {
      key: 'cover',
      header: 'Изображение',
      render: (item) => item.coverImageUrl ? <img src={item.coverImageUrl} width="50" /> : '—',
    },
  ];

  return (
    <div className={styles.crudPage}>
      <h2>Категории портфолио</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название"
          value={form.name}
          onChange={e => handleNameChange(e.target.value)}
        />
        <input
          type="text"
          placeholder="Slug"
          value={form.slug}
          onChange={e => setForm({ ...form, slug: e.target.value })}
        />
        <input type="file" onChange={handleFileChange} disabled={uploading} />
        {form.coverImageUrl && <img src={form.coverImageUrl} alt="preview" width="80" />}
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', slug: '', coverImageUrl: '' }); }}>Отмена</button>}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ name: item.name, slug: item.slug, coverImageUrl: item.coverImageUrl || '' }); }}>✏️</button>
            <button onClick={() => {
              if (confirmDelete(`категорию "${item.name}" (все фото в ней тоже удалятся)`)) {
                deleteItem(item.id);
              }
            }}>🗑️</button>
          </>
        )}
      />
    </div>
  );
};

export default PortfolioCategoriesAdmin;