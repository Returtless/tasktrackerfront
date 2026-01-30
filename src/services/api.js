import axios from 'axios';
import router from '@/router';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true, // Важно для работы с сессиями
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Можно добавить токен или другие заголовки здесь
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 401 Unauthorized - редирект на страницу входа
      if (error.response.status === 401) {
        // Только если не на странице логина и не идет запрос на /api/auth/me (чтобы избежать цикла)
        const currentPath = router.currentRoute.value.path;
        const requestUrl = error.config?.url || '';
        
        if (currentPath !== '/login' && !requestUrl.includes('/api/auth/me')) {
          router.push('/login').catch(() => {
            // Игнорируем ошибки навигации (например, если уже идет редирект)
          });
        }
      }
      // 403 Forbidden - не редиректим автоматически, это может быть нормальная ситуация
      // (например, пользователь не имеет прав на определенный ресурс)
    }
    return Promise.reject(error);
  }
);

export default api;

