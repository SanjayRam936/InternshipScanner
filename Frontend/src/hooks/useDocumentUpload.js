import { useState, useCallback } from 'react';
import { uploadDocument } from '../api/documentApi';

const useDocumentUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);

  const uploadFile = useCallback(async (file) => {
    setIsUploading(true);
    setError(null);
    setDocument(null);

    try {
      const { data } = await uploadDocument(file);
      setDocument(data);
      return data;
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.images?.[0] ||
        'Upload failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDocument(null);
    setError(null);
    setIsUploading(false);
  }, []);

  return { isUploading, document, error, uploadFile, reset };
};

export default useDocumentUpload;
