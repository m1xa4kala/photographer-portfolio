import React, { useState } from 'react';
import { useAdminReviews } from '../../hooks';
import type { Review } from '../../types';
import styles from './adminCrud.module.css';

const ReviewsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem } = useAdminReviews();
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<Omit<Review, 'id' | 'date'>>({
    clientName: '',
    text: '',
    rating: 5,
    isActive: true,
  });

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ clientName: '', text: '', rating: 5, isActive: true });
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className={styles.crudPage}>
      <h2>Отзывы</h2>
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
        <select
          value={form.rating}
          onChange={e => setForm({ ...form, rating: +e.target.value })}
        >
          {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} звезд</option>)}
        </select>
        <label>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => setForm({ ...form, isActive: e.target.checked })}
          />
          Активен
        </label>
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ clientName: '', text: '', rating: 5, isActive: true }); }}>Отмена</button>}
      </div>
      <table className={styles.table}>
        <thead>
          <tr><th>ID</th><th>Клиент</th><th>Текст</th><th>Рейтинг</th><th>Активен</th><th>Дата</th><th>Действия</th></tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.clientName}</td>
              <td>{item.text.substring(0, 50)}...</td>
              <td>{item.rating}</td>
              <td>{item.isActive ? 'Да' : 'Нет'}</td>
              <td>{new Date(item.date).toLocaleDateString()}</td>
              <td>
                <button onClick={() => { setEditing(item); setForm({ clientName: item.clientName, text: item.text, rating: item.rating, isActive: item.isActive }); }}>✏️</button>
                <button onClick={() => deleteItem(item.id)}>🗑️</button>
               </td>
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewsAdmin;