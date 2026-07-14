import axiosClient from './axiosClient';

export const login = (username, password) =>
  axiosClient.post('/auth/login/', { username, password });

export const register = (username, email, password) =>
  axiosClient.post('/auth/register/', { username, email, password });

export const fetchCurrentUser = () =>
  axiosClient.get('/auth/me/');

export const updateCurrentUser = (data) =>
  axiosClient.patch('/auth/me/', data);

export const changePassword = (old_password, new_password) =>
  axiosClient.post('/auth/change-password/', { old_password, new_password });

export const refreshToken = (refresh) =>
  axiosClient.post('/auth/refresh/', { refresh });
