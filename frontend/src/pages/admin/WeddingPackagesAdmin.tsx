import React, { useState, useMemo } from 'react';
import { useAdminWeddingPackages } from '../../hooks';
import ImageUploadButton from '../../components/ImageUploadButton';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import WeddingCard from '../../components/WeddingCard/WeddingCard';
import AutoTextarea from '../../components/AutoTextarea/AutoTextarea';
import type { Column } from '../../components/DraggableTable';
import type { WeddingPackage } from '../../types';
import styles from './adminCrud.module.css';

const WeddingPackagesAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminWeddingPackages();
  const [editing, setEditing] = useState<WeddingPackage | null>(null);
  const [form, setForm] = useState<{
    name: string;
    duration: string;
    includes: string;
    imageUrl: string | null;
    prices: { label: string; amount: string }[];
  }>({
    name: '',
    duration: '',
    includes: '',
    imageUrl: null,
    prices: [{ label: '', amount: '' }],
  });
  const [touched, setTouched] = useState(false);

  const isFormValid = form.name.trim().length > 0 && form.duration.trim().length > 0
    && form.prices.length >= 1 && form.prices[0].label.trim().length > 0;

  const addPrice = () => {
    if (form.prices.length < 3) {
      setForm({ ...form, prices: [...form.prices, { label: '', amount: '' }] });
    }
  };

  const removePrice = (idx: number) => {
    if (form.prices.length > 1) {
      const updated = form.prices.filter((_, i) => i !== idx);
      setForm({ ...form, prices: updated });
    }
  };

  const updatePrice = (idx: number, field: 'label' | 'amount', value: string) => {
    const updated = form.prices.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    setForm({ ...form, prices: updated });
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', duration: '', includes: '', imageUrl: null, prices: [{ label: '', amount: '' }] });
    setTouched(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ name: '', duration: '', includes: '', imageUrl: null, prices: [{ label: '', amount: '' }] });
    setTouched(false);
  };

  const handleImageUpload = (url: string) => {
    setForm(prev => ({ ...prev, imageUrl: url || null }));
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const previewItem: WeddingPackage = useMemo(() => ({
    id: -1,
    name: form.name || 'Название пакета',
    duration: form.duration || 'Продолжительность',
    includes: form.includes || null,
    imageUrl: form.imageUrl,
    prices: form.prices.filter(p => p.label.trim().length > 0).length > 0
      ? form.prices.filter(p => p.label.trim().length > 0)
      : [{ label: 'Стандарт', amount: '0' }],
    orderIndex: 0,
  }), [form]);

  const columns: Column<WeddingPackage>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    {
      key: 'imageUrl',
      header: 'Фото',
      render: (item) =>
        item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <span style={{ color: '#999', fontSize: '0.85rem' }}>—</span>
        ),
    },
    { key: 'name', header: 'Название', render: (item) => item.name },
    { key: 'duration', header: 'Длительность', render: (item) => item.duration },
    {
      key: 'prices',
      header: 'Цены',
      render: (item) => item.prices.map(p => p.label).join(', '),
    },
  ];

  return (
    <AdminPageLayout title="Свадебные пакеты" error={error}>
      <div className={styles.form}>
        {/* Name */}
        <input
          type="text"
          placeholder="Название пакета"
          value={form.name}
          onChange={e => { setForm({ ...form, name: e.target.value }); setTouched(true); }}
          className={!form.name.trim() && touched ? styles.inputError : ''}
        />
        {/* Duration */}
        <input
          type="text"
          placeholder="Продолжительность (например, 6 часов)"
          value={form.duration}
          onChange={e => { setForm({ ...form, duration: e.target.value }); setTouched(true); }}
          className={!form.duration.trim() && touched ? styles.inputError : ''}
        />
        {/* Includes */}
        <AutoTextarea
          placeholder="Что входит (каждая строка — отдельный пункт)"
          value={form.includes}
          onChange={e => setForm({ ...form, includes: e.target.value })}
          rows={3}
        />
        {/* Prices */}
        <div className={styles.pricesBlock}>
          <label className={styles.formLabel}>Варианты цен</label>
          {form.prices.map((opt, idx) => (
            <div key={idx} className={styles.priceRow}>
              <input
                type="text"
                placeholder="Название (например, Стандарт)"
                value={opt.label}
                onChange={e => { updatePrice(idx, 'label', e.target.value); setTouched(true); }}
                className={!opt.label.trim() && idx === 0 && touched ? styles.inputError : ''}
                style={{ width: '40%' }}
              />
              <input
                type="text"
                placeholder="Цена (например, 50 000)"
                value={opt.amount}
                onChange={e => updatePrice(idx, 'amount', e.target.value)}
                style={{ width: '40%' }}
              />
              {form.prices.length > 1 && (
                <button type="button" onClick={() => removePrice(idx)} className={styles.removeBtn} aria-label="Удалить вариант цены">✕</button>
              )}
            </div>
          ))}
          {form.prices.length < 3 && (
            <button type="button" onClick={addPrice} className={styles.addBtn}>+ Добавить вариант цены</button>
          )}
        </div>
        {/* Image */}
        <ImageUploadButton
          onUpload={handleImageUpload}
          currentUrl={form.imageUrl ?? undefined}
          label="Фото пакета"
        />
        {/* Submit */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
          {editing && <button onClick={handleCancel}>Отмена</button>}
        </div>
        {touched && !isFormValid && <p className={styles.validationError}>Заполните обязательные поля (название, длительность и хотя бы одну цену)</p>}
      </div>

      {/* Live preview */}
      <div className={styles.previewSection}>
        <h3 className={styles.previewLabel}>Предпросмотр карточки</h3>
        <div className={styles.previewCardWrapper}>
          <WeddingCard item={previewItem} />
        </div>
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button aria-label="Редактировать" onClick={() => {
              setEditing(item);
              setForm({
                name: item.name,
                duration: item.duration,
                includes: item.includes ?? '',
                imageUrl: item.imageUrl,
                prices: item.prices.length > 0 ? item.prices : [{ label: '', amount: '' }],
              });
            }}>✏️</button>
            <DeleteButton itemName={`пакет "${item.name}"`} onDelete={() => deleteItem(item.id)} />
          </>
        )}
      />
    </AdminPageLayout>
  );
};

export default WeddingPackagesAdmin;