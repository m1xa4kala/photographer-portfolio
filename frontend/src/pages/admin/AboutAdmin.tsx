import React, { useState, useEffect, useMemo } from 'react';
import { useAdminAbout } from '../../hooks';
import ImageUploadButton from '../../components/ImageUploadButton';
import AutoTextarea from '../../components/AutoTextarea/AutoTextarea';
import type { About } from '../../types';
import styles from './adminAbout.module.css';
import crudStyles from './adminCrud.module.css';

const AboutAdmin: React.FC = () => {
  const { about, loading, error, updateAbout } = useAdminAbout();
  const [form, setForm] = useState<Partial<About>>({});
  const [touched, setTouched] = useState(false);
  const initialized = React.useRef(false);

  const previewAbout: About = useMemo(() => ({
    id: -1,
    fullName: form.fullName || 'Ваше имя',
    bioText: form.bioText || 'Текст биографии',
    photoUrl: form.photoUrl ?? null,
  }), [form]);

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
            <AutoTextarea
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

      {/* ── Live preview ── */}
      <div className={crudStyles.previewSection}>
        <h3 className={crudStyles.previewLabel}>Предпросмотр</h3>
        <div className={crudStyles.previewCardWrapper}>
          <div className={styles.previewCard}>
            <div className={styles.previewPhoto}>
              {previewAbout.photoUrl ? (
                <img src={previewAbout.photoUrl} alt={previewAbout.fullName} />
              ) : (
                <div className={styles.previewPhotoPlaceholder} />
              )}
            </div>
            <div className={styles.previewBio}>
              <h3>{previewAbout.fullName}</h3>
              <p>{previewAbout.bioText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutAdmin;