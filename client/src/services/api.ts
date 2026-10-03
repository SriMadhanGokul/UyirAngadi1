import axios, { AxiosError } from 'axios';
import type { ApiError } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const TOKEN_KEY = 'uyirangadi_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/** Attach the JWT (if any) to every outgoing request. */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalise API errors into a human-readable message. */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;

    // An expired or invalid session should not leave a stale token behind.
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (!error.response) {
      return Promise.reject(new Error('Cannot reach the server. Please check your connection.'));
    }

    const message =
      error.response.data?.message ||
      (status === 403
        ? 'You do not have permission to do that.'
        : status === 404
          ? 'That item could not be found.'
          : status && status >= 500
            ? 'Something went wrong on our side. Please try again.'
            : 'Request failed. Please try again.');

    return Promise.reject(new Error(message));
  }
);

export default api;
