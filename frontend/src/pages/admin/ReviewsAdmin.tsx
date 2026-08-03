import React, { useState, useMemo } from 'react';
import { useAdminReviews } from '../../hooks';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import ImageUploadButton from '../../components/ImageUploadButton';
import AutoTextarea from '../../components/AutoTextarea/AutoTextarea';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import ReviewCard from '../../components/ReviewCard';
import type { Review } from '../../types';
import styles from './adminCrud.module.css';

const ReviewsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem } = useAdminReviews();
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
    setTouched(false);
  };

  const previewReview: Review = useMemo(() => ({
    id: -1,
    clientName: form.clientName || 'Имя клиента',
    text: form.text || 'Текст отзыва',
    clientPhotoUrl: form.clientPhotoUrl,
    orderIndex: 0,
  }), [form]);

  return (
    <AdminPageLayout title="Отзывы" error={error}>

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Имя клиента"
          value={form.clientName}
          onChange={e => { setForm({ ...form, clientName: e.target.value }); setTouched(true); }}
          className={!form.clientName.trim() && touched ? styles.inputError : ''}
        />
        <AutoTextarea
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

      {/* ── Live preview ── */}
      <div className={styles.previewSection}>
        <h3 className={styles.previewLabel}>Предпросмотр карточки</h3>
        <div className={styles.previewCardWrapper}>
          <ReviewCard review={previewReview} />
        </div>
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
                  <DeleteButton itemName={`отзыв "${item.clientName}"`} onDelete={() => deleteItem(item.id)} />
                 </td>
               </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminPageLayout>
  );
};

export default ReviewsAdmin;