import React, { useState } from 'react';
import { useAdminPriceItems } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { PriceItem } from '../../types';
import styles from './adminCrud.module.css';

const PriceItemsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminPriceItems();
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [form, setForm] = useState<Pick<PriceItem, 'name' | 'description' | 'price'>>({ name: '', description: '', price: '' });

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
          onChange={e => setForm({ ...form, name: e.target.value })}
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
          onChange={e => setForm({ ...form, price: e.target.value })}
        />
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '' }); }}>Отмена</button>}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ name: item.name, description: item.description, price: item.price }); }}>✏️</button>
            <button onClick={() => {
              if (confirmDelete(`услугу "${item.name}"`)) {
                deleteItem(item.id);
              }
            }}>🗑️</button>
          </>
        )}
      />
    </div>
  );
};

export default PriceItemsAdmin;