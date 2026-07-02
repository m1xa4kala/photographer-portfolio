import React, { useState, useEffect, useRef } from 'react';
import { useAdminAbout, useUploadImage } from '../../hooks';
import type { About } from '../../types';
import styles from './adminAbout.module.css';

const AboutAdmin: React.FC = () => {
  const { about, loading, error, updateAbout } = useAdminAbout();
  const { uploadImage, uploading } = useUploadImage();
  const [form, setForm] = useState<Partial<About>>({});
  const initialized = useRef(false);

  useEffect(() => {
    if (about && !initialized.current) {
      setForm(about);
      initialized.current = true;
    }
  }, [about]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      setForm(prev => ({ ...prev, photoUrl: url }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAbout(form);
  };

  return (
    <div className={styles.aboutAdmin}>
      <h2>Редактировать "Обо мне"</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Фото профиля</label>
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            {form.photoUrl && <img src={form.photoUrl} alt="preview" width="100" />}
          </div>
          <div>
            <label>Полное имя</label>
            <input
              type="text"
              value={form.fullName || ''}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label>Текст биографии</label>
            <textarea
              value={form.bioText || ''}
              onChange={e => setForm({ ...form, bioText: e.target.value })}
              rows={5}
            />
          </div>
          <div>
            <label>Оборудование</label>
            <textarea
              value={form.equipmentText || ''}
              onChange={e => setForm({ ...form, equipmentText: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label>Телефон</label>
            <input
              type="text"
              value={form.phone || ''}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <button type="submit">Сохранить</button>
        </form>
      )}
    </div>
  );
};

export default AboutAdmin;