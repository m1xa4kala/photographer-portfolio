import { useState, useEffect } from 'react';
import api from '../services/api';

export interface UploadStatus {
  uploadId: string;
  total: number;
  completed: number;
  failed: number;
  errors: string[];
  status: 'uploading' | 'completed' | 'error' | 'partial';
  retryCount: number;
}

const POLL_INTERVAL = 800;
/**
 * Max polling attempts before giving up.
 * ~40 minutes (3000 × 800ms) covers the worst case: 7 batches × 2 min Axios timeout × 3 retries.
 */
const MAX_POLL_ATTEMPTS = 3000;

export function useUploadStatus(uploadId: string | null) {
  const [status, setStatus] = useState<UploadStatus | null>(null);

  useEffect(() => {
    if (!uploadId) {
      setStatus(null);
      return;
    }

    let active = true;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      attempts++;
      if (attempts > MAX_POLL_ATTEMPTS) {
        if (active) {
          setStatus({
            uploadId,
            total: 0,
            completed: 0,
            failed: 0,
            errors: ['Превышено время ожидания статуса загрузки'],
            status: 'error',
            retryCount: 0,
          });
        }
        return;
      }

      try {
        const res = await api.get<UploadStatus>(`/upload/status/${uploadId}`);
        if (!active) return;
        setStatus(res.data);
        // Stop polling on terminal statuses
        if (res.data.status === 'completed' || res.data.status === 'error') {
          return;
        }
      } catch (err: any) {
        if (!active) return;
        // 404 means the upload hasn't started processing yet — keep polling
        // Any other network error is transient — keep polling too
      }

      timeoutId = setTimeout(poll, POLL_INTERVAL);
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [uploadId]);

  const progress =
    status && status.total > 0
      ? Math.round((status.completed / status.total) * 100)
      : 0;

  return {
    status,
    progress,
    isUploading:
      status?.status === 'uploading' || status?.status === 'partial',
    isDone: status?.status === 'completed' || status?.status === 'error',
    hasError: status?.status === 'error',
  } as const;
}