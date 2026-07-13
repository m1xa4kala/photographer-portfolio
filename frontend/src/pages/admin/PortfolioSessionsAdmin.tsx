import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminPortfolioSessions, useAdminPortfolioCategories } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { PortfolioSession } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioSessionsAdmin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterCategoryId = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : undefined;

  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } =
    useAdminPortfolioSessions(filterCategoryId);
  const { items: categories } = useAdminPortfolioCategories();
  const [editing, setEditing] = useState<PortfolioSession | null>(null);
  const [form, setForm] = useState<Pick<PortfolioSession, 'name' | 'categoryId'>>({
    name: '',
    categoryId: filterCategoryId ?? 0,
  });

  const handleCategoryFilterChange = (catId: number) => {
    const next = new URLSearchParams(searchParams);
    if (catId) {
      next.set('categoryId', String(catId));
    } else {
      next.delete('categoryId');
    }
    setSearchParams(next, { replace: true });
    // Reset form category to match the new filter
    setForm(prev => ({ ...prev, categoryId: catId }));
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', categoryId: filterCategoryId ?? 0 });
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
          value={filterCategoryId ?? 0}
          onChange={e => handleCategoryFilterChange(+e.target.value)}
        >
          <option value={0}>Все категории</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', categoryId: filterCategoryId ?? 0 }); }}>Отмена</button>}
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