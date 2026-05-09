import React, { useState } from 'react';
import { useAdminPriceItems } from '../../hooks';
import type { PriceItem } from '../../types';
import styles from './adminCrud.module.css';

const PriceItemsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem } = useAdminPriceItems();
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [form, setForm] = useState<Omit<PriceItem, 'id'>>({ name: '', description: '', price: '', orderIndex: 0 });

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', description: '', price: '', orderIndex: 0 });
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className={styles.crudPage}>
      <h2>Прайс-лист</h2>
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
        <input
          type="number"
          placeholder="Порядок"
          value={form.orderIndex}
          onChange={e => setForm({ ...form, orderIndex: +e.target.value })}
        />
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '', orderIndex: 0 }); }}>Отмена</button>}
      </div>
      <table className={styles.table}>
        <thead>
          <tr><th>ID</th><th>Название</th><th>Описание</th><th>Цена</th><th>Порядок</th><th>Действия</th></tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>{item.price} ₽</td>
              <td>{item.orderIndex}</td>
              <td>
                <button onClick={() => { setEditing(item); setForm({ name: item.name, description: item.description, price: item.price, orderIndex: item.orderIndex }); }}>✏️</button>
                <button onClick={() => deleteItem(item.id)}>🗑️</button>
               </td>
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PriceItemsAdmin;