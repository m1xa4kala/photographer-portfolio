import React, { useState } from 'react';
import { useAdminPortfolioSessions, useAdminPortfolioCategories } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { PortfolioSession } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioSessionsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminPortfolioSessions();
  const { items: categories } = useAdminPortfolioCategories();
  const [editing, setEditing] = useState<PortfolioSession | null>(null);
  const [form, setForm] = useState<Pick<PortfolioSession, 'name' | 'categoryId'>>({
    name: '',
    categoryId: 0,
  });

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', categoryId: 0 });
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const getCategoryName = (catId: number) => {
    return categories.find(c => c.id === catId)?.name || '—';
  };

  const columns: Column<PortfolioSession>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'name', header: 'Название', render: (item) => item.name },
    { key: 'category', header: 'Категория', render: (item) => getCategoryName(item.categoryId) },
  ];

  return (
    <div className={styles.crudPage}>
      <h2>Фотосессии</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название фотосессии"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <select
          value={form.categoryId}
          onChange={e => setForm({ ...form, categoryId: +e.target.value })}
        >
          <option value={0}>Выберите категорию</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', categoryId: 0 }); }}>Отмена</button>}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button onClick={() => {
              setEditing(item);
              setForm({ name: item.name, categoryId: item.categoryId });
            }}>✏️</button>
            <button onClick={() => {
              if (confirmDelete(`сессию "${item.name}" (все фото в ней удалятся)`)) {
                deleteItem(item.id);
              }
            }}>🗑️</button>
          </>
        )}
      />
    </div>
  );
};

export default PortfolioSessionsAdmin;