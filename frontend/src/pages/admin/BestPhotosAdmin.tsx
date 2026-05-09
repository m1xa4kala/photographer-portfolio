import React, { useState } from 'react';
import { useUploadImage, useAdminBestPhotos } from '../../hooks';
import styles from './adminCrud.module.css';

const BestPhotosAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem } = useAdminBestPhotos();
  const { uploadImage, uploading } = useUploadImage();
  const [editing, setEditing] = useState<null | number>(null);
  const [form, setForm] = useState({ title: '', imageUrl: '', orderIndex: 0 });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      setForm(prev => ({ ...prev, imageUrl: url }));
    }
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ title: '', imageUrl: '', orderIndex: 0 });
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className={styles.crudPage}>
      <h2>Лучшие фото</h2>
      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="number"
          placeholder="Порядок"
          value={form.orderIndex}
          onChange={e => setForm({ ...form, orderIndex: +e.target.value })}
        />
        <input type="file" onChange={handleFileChange} disabled={uploading} />
        {form.imageUrl && <img src={form.imageUrl} alt="preview" width="80" />}
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ title: '', imageUrl: '', orderIndex: 0 }); }}>Отмена</button>}
      </div>
      <table className={styles.table}>
        <thead>
          <tr><th>ID</th><th>Название</th><th>Порядок</th><th>Изображение</th><th>Действия</th></tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.title}</td>
              <td>{item.orderIndex}</td>
              <td><img src={item.imageUrl} width="50" /></td>
              <td>
                <button onClick={() => { setEditing(item.id); setForm(item); }}>✏️</button>
                <button onClick={() => deleteItem(item.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
       </table>
    </div>
  );
};

export default BestPhotosAdmin;