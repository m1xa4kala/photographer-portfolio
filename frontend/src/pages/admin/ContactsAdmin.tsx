import React, { useState } from 'react';
import { useAdminContacts } from '../../hooks';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import type { Column } from '../../components/DraggableTable';
import type { Contact } from '../../types';
import { PLATFORMS, PLATFORM_ICONS, ICON_COMPONENTS } from '../../utils/socialIconMap';
import styles from './adminCrud.module.css';

const CONTACT_TYPES = [
  { value: 'phone', label: 'Телефон' },
  { value: 'social', label: 'Соцсеть' },
];

const ContactsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminContacts();
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<{
    type: 'phone' | 'social';
    value: string;
    platform: string;
    iconName: string;
    label: string;
  }>({ type: 'social', value: '', platform: '', iconName: '', label: '' });
  const [touched, setTouched] = useState(false);

  const isFormValid = form.value.trim().length > 0 && (form.type !== 'social' || form.platform.trim().length > 0);

  const handlePlatformChange = (platform: string) => {
    const iconName = PLATFORM_ICONS[platform] ?? '';
    setForm({ ...form, platform, iconName });
  };

  const handleSubmit = async () => {
    const payload: Omit<Contact, 'id'> = {
      type: form.type,
      value: form.value,
      ...(form.type === 'social' ? { platform: form.platform, iconName: form.iconName } : {}),
      ...(form.label ? { label: form.label } : {}),
    };

    if (editing) {
      await updateItem(editing.id, payload);
    } else {
      await createItem(payload);
    }
    resetForm();
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ type: 'social', value: '', platform: '', iconName: '', label: '' });
    setTouched(false);
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<Contact>[] = [
    {
      key: 'type',
      header: 'Тип',
      render: (item) => (item.type === 'phone' ? '📞 Телефон' : '🔗 Соцсеть'),
    },
    {
      key: 'value',
      header: 'Значение',
      render: (item) =>
        item.type === 'phone' ? item.value : (
          <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
            {item.value}
          </a>
        ),
    },
    {
      key: 'platform',
      header: 'Платформа',
      render: (item) => {
        if (item.type === 'social' && item.iconName) {
          const IconComponent = ICON_COMPONENTS[item.iconName];
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              {IconComponent && <IconComponent size={20} />}
              {item.platform}
            </span>
          );
        }
        return item.platform ?? '—';
      },
    },
    {
      key: 'label',
      header: 'Описание',
      render: (item) => item.label ?? '—',
    },
  ];

  return (
    <AdminPageLayout title="Контакты" error={error}>
      <div className={styles.form}>
        <h3>{editing ? 'Редактировать' : 'Добавить'} контакт</h3>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as 'phone' | 'social' })}
          disabled={!!editing}
        >
          {CONTACT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {form.type === 'phone' ? (
          <input
            type="tel"
            placeholder="Номер телефона (например, +7 999 123-45-67)"
            value={form.value}
            onChange={(e) => { setForm({ ...form, value: e.target.value }); setTouched(true); }}
            className={!form.value.trim() && touched ? styles.inputError : ''}
          />
        ) : (
          <>
            <select
              value={form.platform}
              onChange={(e) => { handlePlatformChange(e.target.value); setTouched(true); }}
              className={!form.platform.trim() && touched ? styles.inputError : ''}
            >
              <option value="">Выберите платформу</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="url"
              placeholder="URL (например, https://instagram.com/...)"
              value={form.value}
              onChange={(e) => { setForm({ ...form, value: e.target.value }); setTouched(true); }}
              className={!form.value.trim() && touched ? styles.inputError : ''}
            />
          </>
        )}
        <input
          type="text"
          placeholder="Описание (например, Мобильный, Рабочий)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <button onClick={handleSubmit} disabled={!isFormValid}>
          {editing ? 'Обновить' : 'Создать'}
        </button>
        {editing && (
          <button onClick={resetForm}>Отмена</button>
        )}
        {touched && !isFormValid && (
          <p className={styles.validationError}>Заполните обязательные поля</p>
        )}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button
              aria-label="Редактировать"
              onClick={() => {
                setEditing(item);
                setForm({
                  type: item.type,
                  value: item.value,
                  platform: item.platform ?? '',
                  iconName: item.iconName ?? '',
                  label: item.label ?? '',
                });
              }}
            >
              ✏️
            </button>
            <DeleteButton
              itemName={`${item.type === 'phone' ? 'телефон' : 'ссылку'} ${item.platform || item.value}`}
              onDelete={() => deleteItem(item.id)}
            />
          </>
        )}
      />
    </AdminPageLayout>
  );
};

export default ContactsAdmin;