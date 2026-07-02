import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import api from '../services/api';
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
}

const DropZone: React.FC<DropZoneProps> = ({ onUploadComplete }) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList) => {
    const entries: FileWithPreview[] = Array.from(newFiles)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploaded: false,
        url: '',
        error: false,
      }));
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
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    const toUpload = files.filter((f) => !f.uploaded && !f.error);
    if (toUpload.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    toUpload.forEach((f) => formData.append('files', f.file));

    try {
      // 1. Загружаем файлы на сервер
      const res = await api.post<{ urls: string[] }>('/upload/multiple', formData);
      const urls = res.data.urls;

      // 2. Создаём записи в БД (onUploadComplete)
      let urlIdx = 0;
      const uploadedInfo: UploadedFileInfo[] = toUpload.map((f) => {
        const url = urls[urlIdx++] || '';
        const name = f.file.name.replace(/\.[^.]+$/, '');
        return { url, name };
      });

      await onUploadComplete?.(uploadedInfo);

      // 3. Только после успешного сохранения в БД — помечаем как загруженные
      setFiles((prev) => {
        let idx = 0;
        return prev.map((f) => {
          if (!f.uploaded && !f.error) {
            const info = uploadedInfo[idx++];
            if (!info) return f;
            return { ...f, uploaded: true, url: info.url, error: !info.url };
          }
          return f;
        });
      });
    } catch {
      setFiles((prev) =>
        prev.map((f) => (f.uploaded ? f : { ...f, error: true })),
      );
    } finally {
      setUploading(false);
    }
  };

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

      {files.length > 0 && (
        <div className={styles.previewGrid}>
          {files.map((entry, i) => (
            <div key={i} className={`${styles.previewItem} ${entry.error ? styles.error : ''}`}>
              <img src={entry.preview} alt="" />
              <button
                className={styles.removeBtn}
                onClick={() => removeFile(i)}
                disabled={uploading}
                title="Удалить"
              >
                ✕
              </button>
              {entry.uploaded && <div className={styles.badge}>✓</div>}
              {entry.error && <div className={styles.badgeError}>✕</div>}
            </div>
          ))}
        </div>
      )}

      {files.some((f) => !f.uploaded && !f.error) && (
        <button className={styles.uploadBtn} onClick={uploadAll} disabled={uploading}>
          {uploading ? 'Загрузка...' : `Загрузить ${files.filter((f) => !f.uploaded && !f.error).length} фото`}
        </button>
      )}

      {files.every((f) => f.uploaded) && files.length > 0 && (
        <p className={styles.successText}>✓ Все фото загружены</p>
      )}
    </div>
  );
};

export default DropZone;