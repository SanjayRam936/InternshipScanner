import axiosClient from './axiosClient';

/**
 * Upload a document.
 * Always sends images as a single-element array for this version.
 * NOTE: Multi-page upload deliberately deferred — the backend supports images[],
 * but the review/adjust UI is single-page only. Revisit when multi-page flow is designed.
 */
export const uploadDocument = (file, title = '', language = 'eng') => {
  const formData = new FormData();
  formData.append('images', file); // single-element array
  if (title) formData.append('title', title);
  formData.append('language', language);
  return axiosClient.post('/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listDocuments = () =>
  axiosClient.get('/documents/');

export const getDocument = (id) =>
  axiosClient.get(`/documents/${id}/`);

export const updateCorners = (id, pages) =>
  axiosClient.patch(`/documents/${id}/corners/`, { pages });

export const confirmDocument = (id) =>
  axiosClient.post(`/documents/${id}/confirm/`);

export const searchDocuments = (q) =>
  axiosClient.get(`/documents/search/`, { params: { q } });

export const deleteDocument = (id) =>
  axiosClient.delete(`/documents/${id}/`);
