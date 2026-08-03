import React, { useState } from 'react';
import { useAdminSocialLinks } from '../../hooks';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import type { Column } from '../../components/DraggableTable';
import type { SocialLink } from '../../types';
import { PLATFORMS, PLATFORM_ICONS, ICON_COMPONENTS } from '../../utils/socialIconMap';
import styles from './adminCrud.module.css';

const SocialLinksAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminSocialLinks();
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [form, setForm] = useState<{
    platform: string;
    url: string;
    iconName: string;
  }>({ platform: '', url: '', iconName: '' });
  const [touched, setTouched] = useState(false);

  const isFormValid = form.platform.trim().length > 0 && form.url.trim().length > 0;

  const handlePlatformChange = (platform: string) => {
    const iconName = PLATFORM_ICONS[platform] ?? '';
    setForm({ ...form, platform, iconName });
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ platform: '', url: '', iconName: '' });
    setTouched(false);
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<SocialLink>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'platform', header: 'Платформа', render: (item) => item.platform },
    { key: 'url', header: 'URL', render: (item) => item.url },
    {
      key: 'iconName',
      header: 'Иконка',
      render: (item) => {
        const IconComponent = ICON_COMPONENTS[item.iconName];
        return IconComponent ? <IconComponent size={24} /> : item.iconName;
      },
    },
  ];

  return (
    <AdminPageLayout title="Социальные сети" error={error}>
      <div className={styles.form}>
        <h3>{editing ? 'Редактировать' : 'Добавить'} социальную сеть</h3>
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
          value={form.url}
          onChange={(e) => { setForm({ ...form, url: e.target.value }); setTouched(true); }}
          className={!form.url.trim() && touched ? styles.inputError : ''}
        />
        <input
          type="text"
          placeholder="Иконка (например, SiInstagram)"
          value={form.iconName}
          onChange={(e) => setForm({ ...form, iconName: e.target.value })}
        />
        <button onClick={handleSubmit} disabled={!isFormValid}>
          {editing ? 'Обновить' : 'Создать'}
        </button>
        {editing && (
          <button onClick={() => {
            setEditing(null);
            setForm({ platform: '', url: '', iconName: '' });
            setTouched(false);
          }}>
            Отмена
          </button>
        )}
        {touched && !isFormValid && (
          <p className={styles.validationError}>Заполните обязательные поля (платформа и URL)</p>
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
                setForm({ platform: item.platform, url: item.url, iconName: item.iconName });
              }}
            >
              ✏️
            </button>
            <DeleteButton itemName={`ссылку на ${item.platform}`} onDelete={() => deleteItem(item.id)} />
          </>
        )}
      />
    </AdminPageLayout>
  );
};

export default SocialLinksAdmin;