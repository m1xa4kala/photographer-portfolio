import { useState } from 'react';
import api from '../../services/api';

interface UploadImageReturn {
  uploadImage: (file: File) => Promise<string>;
  uploading: boolean;
  error: string | null;
}

export const useUploadImage = (): UploadImageReturn => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setError(null);
    try {
      const res = await api.post<{ url: string }>('/upload', formData);
      return res.data.url;
    } catch (err) {
      const message = 'Ошибка загрузки изображения';
      setError(message);
      throw new Error(message, { cause: err });
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, error };
};