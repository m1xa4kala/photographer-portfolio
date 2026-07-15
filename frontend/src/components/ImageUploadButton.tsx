import { useRef, type ChangeEvent } from 'react';
import { useUploadImage } from '../hooks';
import styles from './ImageUploadButton.module.css';

interface ImageUploadButtonProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  label?: string;
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onUpload,
  currentUrl,
  label = 'Выбрать фото',
}) => {
  const { uploadImage, uploading, error } = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    try {
      if (file) {
        const url = await uploadImage(file);
        onUpload(url);
      }
    } catch {
      // Error state is already set by the hook
    } finally {
      // Reset input so the same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onUpload('');
  };

  return (
    <div className={styles.container}>
      {currentUrl ? (
        <div className={styles.previewContainer}>
          <img
            src={currentUrl}
            alt="preview"
            className={styles.previewImage}
          />
          <button
            type="button"
            className={styles.removeButton}
            onClick={handleRemove}
            title="Удалить фото"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`${styles.uploadButton} ${uploading ? styles.uploadButtonDisabled : ''}`}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <span>⏳ Загрузка...</span>
          ) : (
            <>
              <span style={{ fontSize: '1.5rem' }}>📷</span>
              <span>{label}</span>
            </>
          )}
        </button>
      )}
      {error && <p className={styles.errorText}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        hidden
      />
    </div>
  );
};

export default ImageUploadButton;