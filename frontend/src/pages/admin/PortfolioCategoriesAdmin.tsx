import React, { useState } from 'react';
import { useAdminPortfolioCategories } from '../../hooks';
import type { PortfolioCategory } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioCategoriesAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem } = useAdminPortfolioCategories();
  const [editing, setEditing] = useState<PortfolioCategory | null>(null);
  const [form, setForm] = useState<Omit<PortfolioCategory, 'id'>>({ name: '', slug: '', orderIndex: 0 });

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', slug: '', orderIndex: 0 });
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

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

  return (
    <div className={styles.crudPage}>
      <h2>Категории портфолио</h2>
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
        <input
          type="number"
          placeholder="Порядок"
          value={form.orderIndex}
          onChange={e => setForm({ ...form, orderIndex: +e.target.value })}
        />
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', slug: '', orderIndex: 0 }); }}>Отмена</button>}
      </div>
      <table className={styles.table}>
        <thead>
          <tr><th>ID</th><th>Название</th><th>Slug</th><th>Порядок</th><th>Действия</th></tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.slug}</td>
              <td>{item.orderIndex}</td>
              <td>
                <button onClick={() => { setEditing(item); setForm({ name: item.name, slug: item.slug, orderIndex: item.orderIndex }); }}>✏️</button>
                <button onClick={() => deleteItem(item.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
       </table>
    </div>
  );
};

export default PortfolioCategoriesAdmin;