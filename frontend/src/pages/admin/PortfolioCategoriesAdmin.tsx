import React, { useState } from 'react';
import { useAdminPortfolioCategories } from '../../hooks';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import type { Column } from '../../components/DraggableTable';
import type { PortfolioCategory } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioCategoriesAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminPortfolioCategories();
  const [editing, setEditing] = useState<PortfolioCategory | null>(null);
  const [form, setForm] = useState<Pick<PortfolioCategory, 'name'>>({ name: '' });
  const [touched, setTouched] = useState(false);

  const isFormValid = form.name.trim().length > 0;

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '' });
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<PortfolioCategory>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'name', header: 'Название', render: (item) => item.name },
  ];

  return (
    <AdminPageLayout title="Категории портфолио" error={error}>
      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название категории"
          value={form.name}
          onChange={e => { setForm({ ...form, name: e.target.value }); setTouched(true); }}
          className={!form.name.trim() && touched ? styles.inputError : ''}
        />
        <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '' }); setTouched(false); }}>Отмена</button>}
        {touched && !isFormValid && <p className={styles.validationError}>Заполните название категории</p>}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button aria-label="Редактировать" onClick={() => { setEditing(item); setForm({ name: item.name }); }}>✏️</button>
            <DeleteButton itemName={`категорию "${item.name}"`} onDelete={() => deleteItem(item.id)} />
          </>
        )}
      />
    </AdminPageLayout>
  );
};

export default PortfolioCategoriesAdmin;