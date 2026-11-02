import React, { useState } from 'react';
import { useAdminWeddingFaqItems } from '../../hooks';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import AutoTextarea from '../../components/AutoTextarea/AutoTextarea';
import type { Column } from '../../components/DraggableTable';
import type { WeddingFaqItem } from '../../types';
import styles from './adminCrud.module.css';

const WeddingFaqAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminWeddingFaqItems();
  const [editing, setEditing] = useState<WeddingFaqItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [touched, setTouched] = useState(false);

  const isFormValid = question.trim().length > 0 && answer.trim().length > 0;

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, { question, answer });
    } else {
      await createItem({ question, answer });
    }
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setTouched(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setTouched(false);
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<WeddingFaqItem>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'question', header: 'Вопрос', render: (item) => item.question },
    { key: 'answer', header: 'Ответ', render: (item) => item.answer.length > 80 ? item.answer.substring(0, 80) + '...' : item.answer },
  ];

  return (
    <AdminPageLayout title="FAQ — вопросы и ответы" error={error}>
      <div className={styles.form}>
        <input
          type="text"
          placeholder="Вопрос"
          value={question}
          onChange={e => { setQuestion(e.target.value); setTouched(true); }}
          className={!question.trim() && touched ? styles.inputError : ''}
        />
        <AutoTextarea
          placeholder="Ответ"
          value={answer}
          onChange={e => { setAnswer(e.target.value); setTouched(true); }}
          rows={3}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
          {editing && <button onClick={handleCancel}>Отмена</button>}
        </div>
        {touched && !isFormValid && <p className={styles.validationError}>Заполните вопрос и ответ</p>}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button aria-label="Редактировать" onClick={() => { setEditing(item); setQuestion(item.question); setAnswer(item.answer); }}>✏️</button>
            <DeleteButton itemName={`вопрос "${item.question.substring(0, 40)}"`} onDelete={() => deleteItem(item.id)} />
          </>
        )}
      />
    </AdminPageLayout>
  );
};

export default WeddingFaqAdmin;