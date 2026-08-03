import React, { useState, useMemo } from 'react';
import { useAdminPriceItems } from '../../hooks';
import ImageUploadButton from '../../components/ImageUploadButton';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import PriceCard from '../../components/PriceCard/PriceCard';
import AutoTextarea from '../../components/AutoTextarea/AutoTextarea';
import type { Column } from '../../components/DraggableTable';
import type { PriceItem } from '../../types';
import styles from './adminCrud.module.css';

const PriceItemsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminPriceItems();
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [form, setForm] = useState<Pick<PriceItem, 'name' | 'description' | 'price'> & { imageUrl: string | null }>({
    name: '',
    description: '',
    price: '',
    imageUrl: null,
  });
  const [touched, setTouched] = useState(false);

  const isFormValid = form.name.trim().length > 0 && form.price.trim().length > 0;

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', description: '', price: '', imageUrl: null });
    setTouched(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', imageUrl: null });
    setTouched(false);
  };

  const handleImageUpload = (url: string) => {
    setForm(prev => ({ ...prev, imageUrl: url || null }));
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const previewItem: PriceItem = useMemo(() => ({
    id: -1,
    name: form.name || 'Название услуги',
    description: form.description,
    price: form.price || '0',
    orderIndex: 0,
    imageUrl: form.imageUrl,
  }), [form]);

  const columns: Column<PriceItem>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    {
      key: 'imageUrl',
      header: 'Фото',
      render: (item) =>
        item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <span style={{ color: '#999', fontSize: '0.85rem' }}>—</span>
        ),
    },
    { key: 'name', header: 'Название', render: (item) => item.name },
    { key: 'description', header: 'Описание', render: (item) => item.description },
    { key: 'price', header: 'Цена', render: (item) => `${item.price} ₽` },
  ];

  return (
    <AdminPageLayout title="Прайс-лист" error={error}>
      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название услуги"
          value={form.name}
          onChange={e => { setForm({ ...form, name: e.target.value }); setTouched(true); }}
          className={!form.name.trim() && touched ? styles.inputError : ''}
        />
        <AutoTextarea
          placeholder="Описание (каждая строка — отдельный пункт)"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
        <input
          type="text"
          placeholder="Цена (например, 8 000)"
          value={form.price}
          onChange={e => { setForm({ ...form, price: e.target.value }); setTouched(true); }}
          className={!form.price.trim() && touched ? styles.inputError : ''}
        />

        <ImageUploadButton
          onUpload={handleImageUpload}
          currentUrl={form.imageUrl ?? undefined}
          label="Фото услуги"
        />

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
          {editing && <button onClick={handleCancel}>Отмена</button>}
        </div>
        {touched && !isFormValid && <p className={styles.validationError}>Заполните обязательные поля (название и цена)</p>}
      </div>

      {/* ── Live preview ── */}
      <div className={styles.previewSection}>
        <h3 className={styles.previewLabel}>Предпросмотр карточки</h3>
        <div className={styles.previewCardWrapper}>
          <PriceCard item={previewItem} />
        </div>
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button aria-label="Редактировать" onClick={() => { setEditing(item); setForm({ name: item.name, description: item.description, price: item.price, imageUrl: item.imageUrl }); }}>✏️</button>
            <DeleteButton itemName={`услугу "${item.name}"`} onDelete={() => deleteItem(item.id)} />
          </>
        )}
      />
    </AdminPageLayout>
  );
};

export default PriceItemsAdmin;