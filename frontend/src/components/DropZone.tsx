import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import api from '../services/api';
import { useUploadStatus } from '../hooks/useUploadStatus';
import styles from './DropZone.module.css';

interface FileWithPreview {
  file: File;
  preview: string;
  uploaded: boolean;
  url: string;
  error: boolean;
}

export interface UploadedFileInfo {
  url: string;
  name: string;
}

interface DropZoneProps {
  onUploadComplete?: (files: UploadedFileInfo[]) => void;
  /** Custom upload URL (e.g. for direct upload to a session endpoint). Defaults to /upload/multiple */
  uploadUrl?: string;
  /** Show preview thumbnails. Default true. Set false for large batches (e.g. full sessions) */
  showPreviews?: boolean;
  /** Called when an upload error occurs */
  onUploadError?: (error: string) => void;
}

const BATCH_SIZE = 50;
const MAX_BATCH_RETRIES = 3;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isNetworkError(err: any): boolean {
  if (!err) return false;
  // Axios timeout (ECONNABORTED) or network error (no response received)
  if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') return true;
  if (!err.response) return true;
  return false;
}

const DropZone: React.FC<DropZoneProps> = ({
  onUploadComplete,
  uploadUrl,
  showPreviews = true,
  onUploadError,
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);

  // Revoke all blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const { status, progress, isDone } = useUploadStatus(uploadId);

  // When the server reports completion, stop the uploading state
  useEffect(() => {
    if (isDone) {
      setUploading(false);
    }
  }, [isDone]);

  const addFiles = (newFiles: FileList) => {
    setErrorMessage(null);
    const entries: FileWithPreview[] = Array.from(newFiles)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => {
        const preview = URL.createObjectURL(file);
        previewUrlsRef.current.push(preview);
        return {
          file,
          preview,
          uploaded: false,
          url: '',
          error: false,
        };
      });
    setFiles((prev) => [...prev, ...entries]);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const entry = files[index];
    URL.revokeObjectURL(entry.preview);
    previewUrlsRef.current = previewUrlsRef.current.filter(url => url !== entry.preview);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    const toUpload = files.filter((f) => !f.uploaded && !f.error);
    if (toUpload.length === 0) return;

    setUploading(true);
    setErrorMessage(null);
    setUploadProgress(null);

    // Generate a UUID for progress tracking
    const id = crypto.randomUUID();
    setUploadId(id);

    const targetUrl = uploadUrl || '/upload/multiple';
    const urlWithId = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}uploadId=${id}&total=${toUpload.length}`;
    const allUploaded: UploadedFileInfo[] = [];
    const totalBatches = Math.ceil(toUpload.length / BATCH_SIZE);
    let hasError = false;

    try {
      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        const start = batchIdx * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, toUpload.length);
        const batch = toUpload.slice(start, end);

        if (totalBatches > 1) {
          setUploadProgress(
            `Загрузка... ${start + 1}–${end} из ${toUpload.length} (пакет ${batchIdx + 1}/${totalBatches})`
          );
        } else {
          setUploadProgress(`Загрузка... ${toUpload.length} файлов`);
        }

        const formData = new FormData();
        batch.forEach((f) => formData.append('files', f.file));

        // Retry loop for this batch
        let batchSuccess = false;
        for (let attempt = 0; attempt <= MAX_BATCH_RETRIES; attempt++) {
          try {
            const res = await api.post<{ urls?: string[] } | any[]>(urlWithId, formData);
            batchSuccess = true;

            // Handle different response formats
            if (Array.isArray(res.data)) {
              // Direct upload response (e.g. /admin/full-sessions/:id/upload-files returns array)
              for (let i = 0; i < batch.length; i++) {
                allUploaded.push({ url: '', name: batch[i].file.name });
              }
            } else if (res.data.urls) {
              // /upload/multiple response: { urls: string[] }
              const urls = res.data.urls;
              for (let i = 0; i < batch.length; i++) {
                const url = urls[i] || '';
                allUploaded.push({ url, name: batch[i].file.name });
              }
            } else {
              // Fallback: just mark as uploaded
              for (const f of batch) {
                allUploaded.push({ url: '', name: f.file.name });
              }
            }

            // Mark batch files as uploaded immediately
            setFiles((prev) => {
              let fileIdx = 0;
              return prev.map((f) => {
                if (!f.uploaded && !f.error && fileIdx < batch.length) {
                  const info = allUploaded[allUploaded.length - batch.length + fileIdx];
                  fileIdx++;
                  // Upload succeeded at the HTTP level — mark as uploaded.
                  // `url` may be empty for endpoints that don't return URLs
                  // (e.g. /admin/full-sessions/:id/upload-files returns an array).
                  // error=true should only mean the request itself failed.
                  return { ...f, uploaded: true, url: info?.url || '', error: false };
                }
                return f;
              });
            });

            break; // Success — exit retry loop
          } catch (err: any) {
            if (attempt < MAX_BATCH_RETRIES && isNetworkError(err)) {
              const wait = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
              setUploadProgress(
                `Загрузка... ${start + 1}–${end} из ${toUpload.length} (попытка ${attempt + 2}/${MAX_BATCH_RETRIES + 1}, сеть нестабильна)`
              );
              await delay(wait);
              continue;
            }
            // Non-retryable error or exhausted retries
            throw err;
          }
        }

        if (!batchSuccess) {
          throw new Error('Не удалось загрузить пакет после всех попыток');
        }
      }

      // All batches uploaded successfully — signal completion to the server
      // so the polling hook transitions status to 'completed' and the UX shows
      // the progress bar reaching 100% before it disappears.
      try {
        await api.post(`/upload/status/${id}/complete`);
      } catch {
        // Non-critical — all files are already on disk.
        // The polling hook will eventually time out if this fails.
      }

      setUploadProgress(null);
      setUploadProgress('Все файлы успешно загружены ✓');

      await onUploadComplete?.(allUploaded);
    } catch (err: any) {
      hasError = true;
      const message =
        err?.response?.status
          ? `Ошибка ${err.response.status}: ${err.response.data?.message || err.message || 'Неизвестная ошибка'}`
          : err?.message || 'Неизвестная ошибка при загрузке';
      setErrorMessage(message);
      setUploadProgress(null); // Clear any success progress so it doesn't show alongside the error
      onUploadError?.(message);
      // Backend already rolled back via S3 deletes — don't mark files on the client
      // so the user can retry cleanly
    } finally {
      if (hasError) {
        setUploading(false);
        setUploadId(null);
      }
      // On success, keep uploading=true until the polling hook reports completion
    }
  };

  const pendingCount = files.filter((f) => !f.uploaded && !f.error).length;
  const uploadedCount = files.filter((f) => f.uploaded).length;
  const erroredCount = files.filter((f) => f.error).length;

  return (
    <div className={styles.dropZone}>
      <div
        className={`${styles.dropArea} ${dragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          hidden
        />
        <div className={styles.dropText}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p>Перетащите фото сюда или кликните для выбора</p>
          <span>Поддерживаются JPG, PNG, WebP до 10MB</span>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className={styles.errorMessage} role="alert">
          ❌ {errorMessage}
        </div>
      )}

      {/* Progress message */}
      {uploadProgress && (
        <div className={`${styles.progressMessage} ${uploadProgress.includes('успешно') ? styles.successMessage : ''}`} role="alert">
          {uploadProgress.includes('успешно') ? '✅ ' : '⏳ '}{uploadProgress}
        </div>
      )}
      {/* Progress tracking bar from server status */}
      {uploading && uploadId && status && (
        <div className={styles.progressSection} aria-live="polite">
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className={styles.progressInfo}>
            Загружено: {status.completed}/{status.total} файлов
            {status.failed > 0 && (
              <span className={styles.errorBadge}>  Ошибок: {status.failed}</span>
            )}
          </div>
          {status.retryCount > 0 && (
            <div className={styles.retryBadge}>
              Повторных попыток: {status.retryCount}
            </div>
          )}
        </div>
      )}

      {/* File count info (always visible when files are selected) */}
      {files.length > 0 && !showPreviews && (
        <div className={styles.fileCountInfo} aria-live="polite">
          <p><strong>{files.length}</strong> файлов выбрано</p>
          {uploadedCount > 0 && !errorMessage && (
            <p className={styles.uploadedInfo}>✅ {uploadedCount} загружено</p>
          )}
          {uploadedCount > 0 && errorMessage && (
            <p className={styles.erroredInfo}>⚠️ {uploadedCount} загружено с ошибками</p>
          )}
          {erroredCount > 0 && (
            <p className={styles.erroredInfo}>❌ {erroredCount} с ошибкой</p>
          )}
        </div>
      )}

      {/* Preview grid (only when showPreviews is true) */}
      {showPreviews && files.length > 0 && (
        <div className={styles.previewGrid}>
          {files.map((entry, i) => (
            <div key={i} className={`${styles.previewItem} ${entry.error ? styles.error : ''}`}>
              <img src={entry.preview} alt="" />
              <button
                className={styles.removeBtn}
                onClick={() => removeFile(i)}
                disabled={uploading}
                title="Удалить"
                aria-label="Удалить"
              >
                ✕
              </button>
              {entry.uploaded && <div className={styles.badge}>✓</div>}
              {entry.error && <div className={styles.badgeError}>✕</div>}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <button className={styles.uploadBtn} onClick={uploadAll} disabled={uploading}>
          {uploading
            ? 'Загрузка...'
            : `Загрузить ${pendingCount} ${pendingCount === 1 ? 'фото' : 'фото'}`
          }
        </button>
      )}

      {/* Success message when all files are uploaded */}
      {uploadedCount > 0 && pendingCount === 0 && erroredCount === 0 && (
        <p className={styles.successText} aria-live="polite">✅ Все {uploadedCount} фото загружены</p>
      )}

      {erroredCount > 0 && pendingCount === 0 && (
        <p className={styles.errorText} role="alert">
          ❌ {erroredCount} {erroredCount === 1 ? 'фото не загружено' : 'фото не загружены'}.
          Исправьте ошибку и попробуйте снова.
        </p>
      )}
    </div>
  );
};

export default DropZone;