import React, { useState } from 'react';
import { useAdminPriceItems } from '../../hooks';
import { useConfirm } from '../../hooks/useConfirm';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { PriceItem } from '../../types';
import styles from './adminCrud.module.css';

const PriceItemsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminPriceItems();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [form, setForm] = useState<Pick<PriceItem, 'name' | 'description' | 'price'>>({ name: '', description: '', price: '' });
  const [touched, setTouched] = useState(false);

  const isFormValid = form.name.trim().length > 0 && form.price.trim().length > 0;

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', description: '', price: '' });
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<PriceItem>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'name', header: 'Название', render: (item) => item.name },
    { key: 'description', header: 'Описание', render: (item) => item.description },
    { key: 'price', header: 'Цена', render: (item) => `${item.price} ₽` },
  ];

  return (
    <div className={styles.crudPage}>
      <h2>Прайс-лист</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название услуги"
          value={form.name}
          onChange={e => { setForm({ ...form, name: e.target.value }); setTouched(true); }}
          className={!form.name.trim() && touched ? styles.inputError : ''}
        />
        <textarea
          placeholder="Описание"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="text"
          placeholder="Цена (например, 8 000)"
          value={form.price}
          onChange={e => { setForm({ ...form, price: e.target.value }); setTouched(true); }}
          className={!form.price.trim() && touched ? styles.inputError : ''}
        />
        <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '' }); setTouched(false); }}>Отмена</button>}
        {touched && !isFormValid && <p className={styles.validationError}>Заполните обязательные поля (название и цена)</p>}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button aria-label="Редактировать" onClick={() => { setEditing(item); setForm({ name: item.name, description: item.description, price: item.price }); }}>✏️</button>
            <button aria-label="Удалить" onClick={async () => {
              if (await confirm(`Удалить услугу "${item.name}"? Это действие нельзя отменить.`)) {
                await deleteItem(item.id);
              }
            }}>🗑️</button>
          </>
        )}
      />
      <ConfirmDialogComponent />
    </div>
  );
};

export default PriceItemsAdmin;