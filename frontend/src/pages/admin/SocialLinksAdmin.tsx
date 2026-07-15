import React, { useState } from 'react';
import { useAdminSocialLinks } from '../../hooks';
import { useConfirm } from '../../hooks/useConfirm';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { SocialLink } from '../../types';
import {
  SiInstagram,
  SiVk,
  SiTelegram,
  SiWhatsapp,
  SiYoutube,
  SiTiktok,
  SiX,
  SiPinterest,
  SiViber,
  SiVimeo,
} from 'react-icons/si';
import styles from './adminCrud.module.css';

const PLATFORMS = [
  'Instagram',
  'VK',
  'Telegram',
  'WhatsApp',
  'YouTube',
  'TikTok',
  'Twitter',
  'Pinterest',
  'Viber',
  'Vimeo',
];

const PLATFORM_ICONS: Record<string, string> = {
  Instagram: 'SiInstagram',
  VK: 'SiVk',
  Telegram: 'SiTelegram',
  WhatsApp: 'SiWhatsapp',
  YouTube: 'SiYoutube',
  TikTok: 'SiTiktok',
  Twitter: 'SiX',
  Pinterest: 'SiPinterest',
  Viber: 'SiViber',
  Vimeo: 'SiVimeo',
};

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number }>> = {
  SiInstagram,
  SiVk,
  SiTelegram,
  SiWhatsapp,
  SiYoutube,
  SiTiktok,
  SiX,
  SiPinterest,
  SiViber,
  SiVimeo,
};

const SocialLinksAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminSocialLinks();
  const { confirm, ConfirmDialogComponent } = useConfirm();
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
    <div className={styles.crudPage}>
      <h2>Социальные сети</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

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
            <button
              aria-label="Удалить"
              onClick={async () => {
                if (await confirm(`Удалить ссылку на ${item.platform}? Это действие нельзя отменить.`)) {
                  await deleteItem(item.id);
                }
              }}
            >
              🗑️
            </button>
          </>
        )}
      />
      <ConfirmDialogComponent />
    </div>
  );
};

export default SocialLinksAdmin;