import React, { useState } from 'react';
import { useAdminReviews } from '../../hooks';
import { useConfirm } from '../../hooks/useConfirm';
import ImageUploadButton from '../../components/ImageUploadButton';
import type { Review } from '../../types';
import styles from './adminCrud.module.css';

const ReviewsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem } = useAdminReviews();
  const { confirm, ConfirmDialogComponent } = useConfirm();
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
  const [touched, setTouched] = useState(false);

  const isFormValid = form.clientName.trim().length > 0 && form.text.trim().length > 0;

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
          onChange={e => { setForm({ ...form, clientName: e.target.value }); setTouched(true); }}
          className={!form.clientName.trim() && touched ? styles.inputError : ''}
        />
        <textarea
          placeholder="Текст отзыва"
          value={form.text}
          onChange={e => { setForm({ ...form, text: e.target.value }); setTouched(true); }}
          className={!form.text.trim() && touched ? styles.inputError : ''}
        />
        <div>
          <label>Фото клиента (аватар)</label>
          <ImageUploadButton
            onUpload={(url) => setForm(prev => ({ ...prev, clientPhotoUrl: url }))}
            currentUrl={form.clientPhotoUrl || undefined}
            label="Фото клиента"
          />
        </div>
        <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ clientName: '', text: '', clientPhotoUrl: null }); setTouched(false); }}>Отмена</button>}
        {touched && !isFormValid && <p className={styles.validationError}>Заполните имя клиента и текст отзыва</p>}
      </div>

      {loading ? (
        <div>Загрузка...</div>
      ) : items.length === 0 ? (
        <p className={styles.hint}>Нет отзывов</p>
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
                <td>{item.text.length > 50 ? `${item.text.substring(0, 50)}...` : item.text}</td>
                <td>
                  <button aria-label="Редактировать" onClick={() => { setEditing(item); setForm({ clientName: item.clientName, text: item.text, clientPhotoUrl: item.clientPhotoUrl }); }}>✏️</button>
                  <button aria-label="Удалить" onClick={async () => {
                  if (await confirm(`Удалить отзыв "${item.clientName}"? Это действие нельзя отменить.`)) {
                    await deleteItem(item.id);
                  }
                }}>🗑️</button>
                 </td>
               </tr>
            ))}
          </tbody>
        </table>
      )}
      <ConfirmDialogComponent />
    </div>
  );
};

export default ReviewsAdmin;