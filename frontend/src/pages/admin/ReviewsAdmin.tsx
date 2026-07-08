import React, { useState } from 'react';
import { useAdminReviews, useUploadImage } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import type { Review } from '../../types';
import styles from './adminCrud.module.css';

const ReviewsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem } = useAdminReviews();
  const { uploadImage, uploading } = useUploadImage();
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<{
    clientName: string;
    text: string;
    clientPhotoUrl: string | null;
  }>({
    clientName: '',
    text: '',
    clientPhotoUrl: null,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      setForm(prev => ({ ...prev, clientPhotoUrl: url }));
    }
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ clientName: '', text: '', clientPhotoUrl: null });
  };

  return (
    <div className={styles.crudPage}>
      <h2>Отзывы</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Имя клиента"
          value={form.clientName}
          onChange={e => setForm({ ...form, clientName: e.target.value })}
        />
        <textarea
          placeholder="Текст отзыва"
          value={form.text}
          onChange={e => setForm({ ...form, text: e.target.value })}
        />
        <div>
          <label>Фото клиента (аватар)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {form.clientPhotoUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <img
                src={form.clientPhotoUrl}
                alt="avatar preview"
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, clientPhotoUrl: null })}
                style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ clientName: '', text: '', clientPhotoUrl: null }); }}>Отмена</button>}
      </div>

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr><th>ID</th><th>Фото</th><th>Клиент</th><th>Текст</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>
                  {item.clientPhotoUrl ? (
                    <img
                      src={item.clientPhotoUrl}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                  )}
                </td>
                <td>{item.clientName}</td>
                <td>{item.text.substring(0, 50)}...</td>
                <td>
                  <button onClick={() => { setEditing(item); setForm({ clientName: item.clientName, text: item.text, clientPhotoUrl: item.clientPhotoUrl }); }}>✏️</button>
                  <button onClick={() => {
                  if (confirmDelete(`отзыв "${item.clientName}"`)) {
                    deleteItem(item.id);
                  }
                }}>🗑️</button>
                 </td>
               </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReviewsAdmin;