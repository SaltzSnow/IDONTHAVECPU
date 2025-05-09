// src/services/api.ts
import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
    AxiosResponse,
  } from 'axios';
  import { getAccessToken, getRefreshToken, storeTokens, clearTokens } from './tokenService';
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const REFRESH_TOKEN_URL = '/auth/token/refresh/'; // Endpoint สำหรับ refresh token
  
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );
  
  let isRefreshing = false;
  let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];
  
  const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };
  
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
  
      if (error.response?.status === 401 && originalRequest.url !== REFRESH_TOKEN_URL && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              if (originalRequest.headers) originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }
  
        originalRequest._retry = true;
        isRefreshing = true;
  
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          isRefreshing = false;
          clearTokens();
          if (typeof window !== 'undefined') window.location.href = '/login';
          return Promise.reject(error);
        }
  
        try {
          const { data } = await axios.post<{ access: string; refresh?: string }>(
            `<span class="math-inline">\{API\_BASE\_URL\}</span>{REFRESH_TOKEN_URL}`,
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
  
          const newAccessToken = data.access;
          const newRefreshToken = data.refresh || refreshToken;
          storeTokens(newAccessToken, newRefreshToken);
  
          if (apiClient.defaults.headers.common) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          }
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          }
  
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } catch (refreshError: any) {
          processQueue(refreshError as AxiosError, null);
          clearTokens();
          if (typeof window !== 'undefined') window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    }
  );
  
  export default apiClient;