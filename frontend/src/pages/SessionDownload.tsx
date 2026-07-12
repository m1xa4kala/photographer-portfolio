import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import styles from './SessionDownload.module.css';

interface SessionInfo {
  title: string;
  description: string | null;
  fileCount: number;
  totalSize: number;
}

const SessionDownload: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchSession = async () => {
      try {
        const res = await api.get(`/content/full-session-by-token/${token}`);
        setSession(res.data);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 403) {
          setError('Ссылка скачивания отключена. Обратитесь к фотографу.');
        } else if (status === 404) {
          setError('Сессия не найдена. Проверьте ссылку.');
        } else {
          setError('Не удалось загрузить информацию о сессии');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [token]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>😕</h1>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>📸 {session?.title}</h1>
        {session?.description && <p className={styles.description}>{session.description}</p>}
        <p className={styles.info}>
          {session?.fileCount} файлов • {formatSize(session?.totalSize || 0)}
        </p>
        <a
          href={`/api/content/download-session/${token}`}
          className={styles.downloadBtn}
        >
          ⬇ Скачать все фото (архив ZIP)
        </a>
      </div>
    </div>
  );
};

export default SessionDownload;