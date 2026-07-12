import React, { useState, useEffect } from 'react';
import { useAdminFullSessions, useAdminFullSessionFiles } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DropZone from '../../components/DropZone';
import type { UploadedFileInfo } from '../../components/DropZone';
import type { FullSession } from '../../types';
import styles from './adminCrud.module.css';

const FullSessionsAdmin: React.FC = () => {
  const { items: sessions, loading, error, createItem, updateItem, deleteItem } = useAdminFullSessions();
  const { files, loading: filesLoading, uploadFiles, deleteFile } = useAdminFullSessionFiles();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<FullSession | null>(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tokenUrl, setTokenUrl] = useState<string | null>(null);
  const [downloadsEnabled, setDownloadsEnabled] = useState(false);

  const selectedSession = sessions.find(s => s.id === selectedId);
  const filesForSession = selectedId ? files : [];

  useEffect(() => {
    if (selectedId) {
      const s = sessions.find(x => x.id === selectedId);
      setTokenUrl(s?.downloadToken ? `/download/${s.downloadToken}` : null);
      setDownloadsEnabled(s?.downloadsEnabled ?? false);
    }
  }, [selectedId, sessions]);

  const handleSubmit = async () => {
    await (editing
      ? updateItem(editing.id, form as any)
      : createItem(form as any));
    setEditing(null);
    setForm({ title: '', description: '' });
  };

  const handleEdit = (s: FullSession) => {
    setEditing(s);
    setForm({ title: s.title, description: s.description || '' });
  };

  const handleFileUpload = async (uploadedFiles: UploadedFileInfo[]) => {
    if (!selectedId) return;
    setUploadError(null);
    try {
      const formData = new FormData();
      for (const f of uploadedFiles) {
        const resp = await fetch(f.url);
        const blob = await resp.blob();
        formData.append('files', blob, f.name);
      }
      await uploadFiles(selectedId, formData.getAll('files') as File[]);
    } catch {
      setUploadError('Ошибка загрузки файлов');
    }
  };

  const handleGenerateToken = async () => {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/full-sessions/${selectedId}/generate-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    });
    const data = await res.json();
    setTokenUrl(data.url);
  };

  const handleRevokeToken = async () => {
    if (!selectedId) return;
    await fetch(`/api/admin/full-sessions/${selectedId}/revoke-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    });
    setTokenUrl(null);
    setDownloadsEnabled(false);
  };

  const handleToggleDownloads = async (enabled: boolean) => {
    if (!selectedId) return;
    await fetch(`/api/admin/full-sessions/${selectedId}/toggle-downloads`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({ enabled }),
    });
    setDownloadsEnabled(enabled);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className={styles.crudPage}><p>Загрузка...</p></div>;
  if (error) return <div className={styles.crudPage}><div className={styles.error}>Ошибка: {error}</div></div>;

  return (
    <div className={styles.crudPage}>
      <h2>📦 Полные фотосессии</h2>

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название (например, Свадьба Ивана — оригиналы)"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Описание (необязательно)"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && (
          <button onClick={() => { setEditing(null); setForm({ title: '', description: '' }); }}>
            Отмена
          </button>
        )}
      </div>

      <div className={styles.sectionCard}>
        <h3>Список полных фотосессий</h3>
        {sessions.map(s => (
          <div
            key={s.id}
            className={`${styles.listItem} ${selectedId === s.id ? styles.listItemActive : ''}`}
            onClick={() => setSelectedId(s.id)}
          >
            <span>{s.title}</span>
            <span className={styles.badge}>{s.originalFiles?.length || 0} файлов</span>
            <button onClick={e => { e.stopPropagation(); handleEdit(s); }}>✏️</button>
            <button onClick={e => {
              e.stopPropagation();
              if (confirmDelete(`полную сессию "${s.title}"`)) {
                deleteItem(s.id);
                if (selectedId === s.id) setSelectedId(null);
              }
            }}>🗑️</button>
          </div>
        ))}
        {sessions.length === 0 && <p className={styles.hint}>Нет полных фотосессий</p>}
      </div>

      {selectedSession && (
        <div className={styles.sectionCard}>
          <h3>📂 {selectedSession.title}</h3>

          <h4>Загрузка оригиналов</h4>
          <DropZone onUploadComplete={handleFileUpload} />
          {uploadError && <div className={styles.error}>{uploadError}</div>}

          <h4>Файлы ({filesForSession.length} шт.)</h4>
          {filesLoading ? (
            <p>Загрузка...</p>
          ) : (
            <div className={styles.fileList}>
              {filesForSession.map(f => (
                <div key={f.id} className={styles.fileItem}>
                  <span>{f.originalName}</span>
                  <span className={styles.fileSize}>{formatSize(f.fileSize)}</span>
                  <button onClick={async () => {
                    if (confirmDelete(`файл "${f.originalName}"`)) {
                      await deleteFile(selectedSession.id, f.id);
                    }
                  }}>🗑️</button>
                </div>
              ))}
              {filesForSession.length === 0 && <p className={styles.hint}>Файлы не загружены</p>}
            </div>
          )}

          <h4>🔗 Ссылка для скачивания</h4>
          {tokenUrl ? (
            <div className={styles.tokenSection}>
              <p>
                Ссылка:{' '}
                <a href={tokenUrl} target="_blank" rel="noopener noreferrer">
                  {window.location.origin}{tokenUrl}
                </a>
              </p>
              <div className={styles.formRow}>
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}${tokenUrl}`)}>
                  📋 Скопировать
                </button>
                <button onClick={handleRevokeToken}>🚫 Отозвать</button>
              </div>
              <div className={styles.formRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={downloadsEnabled}
                    onChange={e => handleToggleDownloads(e.target.checked)}
                  />{' '}
                  Разрешить скачивание
                </label>
              </div>
            </div>
          ) : (
            <button onClick={handleGenerateToken}>🔗 Создать ссылку</button>
          )}
        </div>
      )}
    </div>
  );
};

export default FullSessionsAdmin;