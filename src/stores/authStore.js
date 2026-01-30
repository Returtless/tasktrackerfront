import { defineStore } from 'pinia';
import api from '@/services/api';
import { showNotification } from '@/services/notificationService';
import router from '@/router';

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  actions: {
    async checkAuth() {
      // Предотвращаем повторные запросы если уже проверяем
      if (this.isLoading) {
        return;
      }
      
      this.isLoading = true;
      try {
        const response = await api.get('/api/auth/me');
        if (response.data) {
          this.user = response.data;
          this.isAuthenticated = true;
        } else {
          this.user = null;
          this.isAuthenticated = false;
        }
      } catch (error) {
        // 401 - это нормально, пользователь не авторизован
        if (error.response?.status === 401) {
          this.user = null;
          this.isAuthenticated = false;
        } else {
          // Другие ошибки - логируем, но не меняем состояние
          console.error('Auth check error:', error);
        }
      } finally {
        this.isLoading = false;
      }
    },

    async login(username, password) {
      try {
        const response = await api.post('/api/auth/login', { username, password });
        if (response.data.success) {
          this.user = response.data.user;
          this.isAuthenticated = true;
          showNotification({
            title: 'Success',
            text: 'Login successful',
            type: 'success',
          });
          router.push('/');
          return true;
        } else {
          showNotification({
            title: 'Error',
            text: response.data.message || 'Login failed',
            type: 'error',
          });
          return false;
        }
      } catch (error) {
        showNotification({
          title: 'Error',
          text: error.response?.data?.message || 'Login failed',
          type: 'error',
        });
        return false;
      }
    },

    async register(username, email, password) {
      try {
        const response = await api.post('/api/auth/register', { username, email, password });
        if (response.data.success) {
          this.user = response.data.user;
          this.isAuthenticated = true;
          showNotification({
            title: 'Success',
            text: 'Registration successful',
            type: 'success',
          });
          router.push('/');
          return true;
        } else {
          showNotification({
            title: 'Error',
            text: response.data.message || 'Registration failed',
            type: 'error',
          });
          return false;
        }
      } catch (error) {
        showNotification({
          title: 'Error',
          text: error.response?.data?.message || 'Registration failed',
          type: 'error',
        });
        return false;
      }
    },

    async logout() {
      try {
        await api.post('/api/auth/logout');
        this.user = null;
        this.isAuthenticated = false;
        router.push('/login');
        showNotification({
          title: 'Success',
          text: 'Logged out successfully',
          type: 'success',
        });
      } catch (error) {
        // Даже если ошибка, очищаем состояние
        this.user = null;
        this.isAuthenticated = false;
        router.push('/login');
      }
    },

    async checkFirstUser() {
      try {
        const response = await api.get('/api/auth/check-first-user');
        return response.data;
      } catch (error) {
        return false;
      }
    },
  },
});

