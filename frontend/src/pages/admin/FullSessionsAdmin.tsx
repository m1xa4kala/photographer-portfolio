import React, { useState, useEffect } from 'react';
import { useAdminFullSessions, useAdminFullSessionFiles } from '../../hooks';
import { useConfirm } from '../../hooks/useConfirm';
import api from '../../services/api';
import DropZone from '../../components/DropZone';
import type { UploadedFileInfo } from '../../components/DropZone';
import type { FullSession } from '../../types';
import styles from './adminCrud.module.css';

const FullSessionsAdmin: React.FC = () => {
  const { items: sessions, loading, error, createItem, updateItem, deleteItem } = useAdminFullSessions();
  const { files, loading: filesLoading, fetchFiles, deleteFile } = useAdminFullSessionFiles();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<FullSession | null>(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [touched, setTouched] = useState(false);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const isFormValid = form.title.trim().length > 0;
  const [, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [tokenUrl, setTokenUrl] = useState<string | null>(null);
  const [downloadsEnabled, setDownloadsEnabled] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const selectedSession = sessions.find(s => s.id === selectedId);
  const filesForSession = selectedId ? files : [];

  useEffect(() => {
    if (selectedId) {
      const s = sessions.find(x => x.id === selectedId);
      setTokenUrl(s?.downloadToken ? `/download/${s.downloadToken}` : null);
      setDownloadsEnabled(s?.downloadsEnabled ?? false);
      // Refresh file list when a new session is selected
      fetchFiles(selectedId).catch(() => {});
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleDropZoneUpload = async (uploadedFiles: UploadedFileInfo[]) => {
    if (!selectedId) return;
    setUploadError(null);
    setUploadSuccess(null);
    // Files were already uploaded by DropZone via uploadUrl.
    // Always show success — files ARE on the server even if refresh fails.
    setUploadSuccess(`${uploadedFiles.length} файлов успешно загружено ✓`);
    try {
      // Just refresh the file list to show updated count.
      await fetchFiles(selectedId);
    } catch {
      // List refresh failed, but files are already uploaded — show a warning,
      // not a blocking error. The user can reload manually.
      setUploadSuccess(`${uploadedFiles.length} файлов загружено. Не удалось обновить список — перезагрузите страницу`);
    }
  };

  const handleGenerateToken = async () => {
    if (!selectedId) return;
    const res = await api.post(`/admin/full-sessions/${selectedId}/generate-token`);
    setTokenUrl(res.data.url);
  };

  const handleRevokeToken = async () => {
    if (!selectedId) return;
    await api.post(`/admin/full-sessions/${selectedId}/revoke-token`);
    setTokenUrl(null);
    setDownloadsEnabled(false);
  };

  const handleSync = async () => {
    if (!await confirm('Проверить все записи в бакете и удалить из БД те, что отсутствуют?')) return;
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await api.post('/admin/full-sessions/sync');
      setSyncResult(`✅ Синхронизация завершена: удалено ${res.data.deleted} из ${res.data.total} записей`);
    } catch {
      setSyncResult('❌ Ошибка синхронизации');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleToggleDownloads = async (enabled: boolean) => {
    if (!selectedId) return;
    await api.patch(`/admin/full-sessions/${selectedId}/toggle-downloads`, { enabled });
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
          onChange={e => { setForm({ ...form, title: e.target.value }); setTouched(true); }}
          className={!form.title.trim() && touched ? styles.inputError : ''}
        />
        <input
          type="text"
          placeholder="Описание (необязательно)"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && (
          <button onClick={() => { setEditing(null); setForm({ title: '', description: '' }); setTouched(false); }}>
            Отмена
          </button>
        )}
        {touched && !isFormValid && <p className={styles.validationError}>Заполните название фотосессии</p>}
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
            <button aria-label="Редактировать" onClick={e => { e.stopPropagation(); handleEdit(s); }}>✏️</button>
            <button aria-label="Удалить" onClick={async e => {
              e.stopPropagation();
              if (await confirm(`Удалить полную сессию "${s.title}"? Это действие нельзя отменить.`)) {
                await deleteItem(s.id);
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
          <DropZone
            onUploadComplete={handleDropZoneUpload}
            uploadUrl={`/admin/full-sessions/${selectedId}/upload-files`}
            showPreviews={false}
            onUploadError={setUploadError}
          />
          {/* uploadError is already shown by DropZone internally — avoid duplicate display */}
          {uploadSuccess && <div className={styles.successMessage}>{uploadSuccess}</div>}

          <div className={styles.formRow}>
            <button onClick={handleSync} disabled={syncLoading}>
              {syncLoading ? 'Синхронизация...' : '🔄 Синхронизировать с бакетом'}
            </button>
            {syncResult && (
              <span className={styles.successMessage}>
                {syncResult}
              </span>
            )}
          </div>

          <h4>Файлы ({filesForSession.length} шт.)</h4>
          {filesLoading ? (
            <p>Загрузка...</p>
          ) : filesForSession.length === 0 ? (
            <p className={styles.hint}>Файлы не загружены</p>
          ) : (
            <div className={styles.fileList}>
              {filesForSession.slice(0, 20).map(f => (
                <div key={f.id} className={styles.fileItem}>
                  <span>{f.originalName}</span>
                  <span className={styles.fileSize}>{formatSize(f.fileSize)}</span>
                  <button aria-label="Удалить файл" onClick={async () => {
                    if (await confirm(`Удалить файл "${f.originalName}"? Это действие нельзя отменить.`)) {
                      await deleteFile(selectedSession.id, f.id);
                    }
                  }}>🗑️</button>
                </div>
              ))}
              {filesForSession.length > 20 && (
                <p className={styles.hint}>
                  и ещё {filesForSession.length - 20} файлов...
                </p>
              )}
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
      <ConfirmDialogComponent />
    </div>
  );
};

export default FullSessionsAdmin;