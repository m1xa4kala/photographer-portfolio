import { useState, useCallback } from 'react';
import api from '../../services/api';
import type { SessionOriginalFile } from '../../types';

interface UseAdminFullSessionFilesReturn {
  files: SessionOriginalFile[];
  loading: boolean;
  error: string | null;
  fetchFiles: (sessionId: number) => Promise<void>;
  uploadFiles: (sessionId: number, fileList: File[]) => Promise<void>;
  deleteFile: (sessionId: number, fileId: number) => Promise<void>;
}

export const useAdminFullSessionFiles = (): UseAdminFullSessionFilesReturn => {
  const [files, setFiles] = useState<SessionOriginalFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (sessionId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/full-sessions/${sessionId}`);
      setFiles(res.data.originalFiles || []);
      setError(null);
    } catch {
      setError('Не удалось загрузить файлы');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (sessionId: number, fileList: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      fileList.forEach(f => formData.append('files', f));
      await api.post(`/admin/full-sessions/${sessionId}/upload-files`, formData);
      await fetchFiles(sessionId);
    } catch {
      setError('Не удалось загрузить файлы');
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  const deleteFile = useCallback(async (sessionId: number, fileId: number) => {
    try {
      await api.delete(`/admin/full-sessions/${sessionId}/files/${fileId}`);
      await fetchFiles(sessionId);
    } catch {
      setError('Не удалось удалить файл');
    }
  }, [fetchFiles]);

  return { files, loading, error, fetchFiles, uploadFiles, deleteFile };
};