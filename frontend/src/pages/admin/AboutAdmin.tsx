import React, { useState, useEffect } from 'react';
import { useAdminAbout } from '../../hooks';
import ImageUploadButton from '../../components/ImageUploadButton';
import type { About } from '../../types';
import styles from './adminAbout.module.css';

const AboutAdmin: React.FC = () => {
  const { about, loading, error, updateAbout } = useAdminAbout();
  const [form, setForm] = useState<Partial<About>>({});
  const [touched, setTouched] = useState(false);
  const initialized = React.useRef(false);

  const isFormValid = (form.fullName?.trim().length ?? 0) > 0 && (form.bioText?.trim().length ?? 0) > 0;

  useEffect(() => {
    if (about && !initialized.current) {
      setForm(about);
      initialized.current = true;
    }
  }, [about]);

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
            <ImageUploadButton onUpload={(url) => setForm(prev => ({ ...prev, photoUrl: url }))} currentUrl={form.photoUrl ?? undefined} label="Фото профиля" />
          </div>
          <div>
            <label>Полное имя</label>
            <input
              type="text"
              value={form.fullName || ''}
              onChange={e => { setForm({ ...form, fullName: e.target.value }); setTouched(true); }}
              className={!form.fullName?.trim() && touched ? styles.inputError : ''}
            />
          </div>
          <div>
            <label>Текст биографии</label>
            <textarea
              value={form.bioText || ''}
              onChange={e => { setForm({ ...form, bioText: e.target.value }); setTouched(true); }}
              rows={5}
              className={!form.bioText?.trim() && touched ? styles.inputError : ''}
            />
          </div>
          <button type="submit" disabled={!isFormValid}>Сохранить</button>
          {touched && !isFormValid && <p style={{ color: 'var(--admin-danger, #dc3545)', fontSize: '0.85rem', margin: 0 }}>Заполните имя и текст биографии</p>}
        </form>
      )}
    </div>
  );
};

export default AboutAdmin;