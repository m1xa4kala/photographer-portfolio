import React, { useState } from 'react';
import { useAdminPortfolioPhotos, useUploadImage, useAdminPortfolioCategories } from '../../hooks';
import type { PortfolioPhoto } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioPhotosAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem } = useAdminPortfolioPhotos();
  const { items: categories } = useAdminPortfolioCategories();
  const { uploadImage, uploading } = useUploadImage();
  const [editing, setEditing] = useState<PortfolioPhoto | null>(null);
  const [form, setForm] = useState<Omit<PortfolioPhoto, 'id'>>({ title: '', imageUrl: '', categoryId: 0, orderIndex: 0 });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      setForm(prev => ({ ...prev, imageUrl: url }));
    }
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ title: '', imageUrl: '', categoryId: 0, orderIndex: 0 });
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className={styles.crudPage}>
      <h2>Фото портфолио</h2>
      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
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
        <input
          type="number"
          placeholder="Порядок"
          value={form.orderIndex}
          onChange={e => setForm({ ...form, orderIndex: +e.target.value })}
        />
        <input type="file" onChange={handleFileChange} disabled={uploading} />
        {form.imageUrl && <img src={form.imageUrl} alt="preview" width="80" />}
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ title: '', imageUrl: '', categoryId: 0, orderIndex: 0 }); }}>Отмена</button>}
      </div>
      <table className={styles.table}>
        <thead>
          <tr><th>ID</th><th>Название</th><th>Категория</th><th>Порядок</th><th>Изображение</th><th>Действия</th></tr>
        </thead>
        <tbody>
          {items.map(item => {
            const catName = categories.find(c => c.id === item.categoryId)?.name || '—';
            return (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{catName}</td>
                <td>{item.orderIndex}</td>
                <td><img src={item.imageUrl} width="50" /></td>
                <td>
                  <button onClick={() => { setEditing(item); setForm({ title: item.title, imageUrl: item.imageUrl, categoryId: item.categoryId, orderIndex: item.orderIndex }); }}>✏️</button>
                  <button onClick={() => deleteItem(item.id)}>🗑️</button>
                </td>
               </tr>
            );
          })}
        </tbody>
       </table>
    </div>
  );
};

export default PortfolioPhotosAdmin;