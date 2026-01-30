import { defineStore } from 'pinia';
import api from '@/services/api';
import { showNotification } from '@/services/notificationService';

export const useSettingsStore = defineStore('settingsStore', {
  state: () => ({
    appSettings: {},
    userSettings: {},
    gitlabInstances: [],
    isLoading: false,
    isSyncing: false, // Отдельное состояние для синхронизации
  }),

  actions: {
    async loadAppSettings() {
      this.isLoading = true;
      try {
        const response = await api.get('/api/settings/app');
        this.appSettings = response.data || {};
      } catch (error) {
        console.error('Error loading app settings:', error);
        this.appSettings = {};
      } finally {
        this.isLoading = false;
      }
    },

    async loadUserSettings() {
      this.isLoading = true;
      try {
        const response = await api.get('/api/settings/user');
        this.userSettings = response.data || {};
      } catch (error) {
        console.error('Error loading user settings:', error);
        this.userSettings = {};
      } finally {
        this.isLoading = false;
      }
    },

    async updateAppSettings(settings) {
      if (this.isSyncing) {
        showNotification({
          title: 'Warning',
          text: 'Please wait for synchronization to complete',
          type: 'warning',
        });
        return false;
      }
      
      this.isLoading = true;
      try {
        const response = await api.put('/api/settings/app', { settings });
        this.appSettings = response.data || {};
        showNotification({
          title: 'Success',
          text: 'Settings saved successfully',
          type: 'success',
        });
        return true;
      } catch (error) {
        showNotification({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to save settings',
          type: 'error',
        });
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async updateUserSettings(settings) {
      try {
        const response = await api.put('/api/settings/user', { settings });
        this.userSettings = response.data || {};
        showNotification({
          title: 'Success',
          text: 'Settings saved successfully',
          type: 'success',
        });
        return true;
      } catch (error) {
        showNotification({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to save settings',
          type: 'error',
        });
        return false;
      }
    },

    async loadGitlabInstances() {
      this.isLoading = true;
      try {
        const response = await api.get('/api/settings/gitlab-instances');
        this.gitlabInstances = response.data || [];
      } catch (error) {
        console.error('Error loading GitLab instances:', error);
        this.gitlabInstances = [];
      } finally {
        this.isLoading = false;
      }
    },

    async createGitlabInstance(instance) {
      try {
        const response = await api.post('/api/settings/gitlab-instances', instance);
        await this.loadGitlabInstances();
        showNotification({
          title: 'Success',
          text: 'GitLab instance created successfully',
          type: 'success',
        });
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to create GitLab instance';
        showNotification({
          title: 'Error',
          text: errorMessage,
          type: 'error',
        });
        console.error('Error creating GitLab instance:', error.response?.data || error);
        return null;
      }
    },

    async updateGitlabInstance(id, instance) {
      try {
        const response = await api.put(`/api/settings/gitlab-instances/${id}`, instance);
        await this.loadGitlabInstances();
        showNotification({
          title: 'Success',
          text: 'GitLab instance updated successfully',
          type: 'success',
        });
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to update GitLab instance';
        showNotification({
          title: 'Error',
          text: errorMessage,
          type: 'error',
        });
        console.error('Error updating GitLab instance:', error.response?.data || error);
        return null;
      }
    },

    async deleteGitlabInstance(id) {
      try {
        await api.delete(`/api/settings/gitlab-instances/${id}`);
        await this.loadGitlabInstances();
        showNotification({
          title: 'Success',
          text: 'GitLab instance deleted successfully',
          type: 'success',
        });
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to delete GitLab instance';
        showNotification({
          title: 'Error',
          text: errorMessage,
          type: 'error',
        });
        console.error('Error deleting GitLab instance:', error.response?.data || error);
        return false;
      }
    },

    async syncGitlabInstances() {
      if (this.isSyncing) {
        return false; // Уже идет синхронизация
      }
      
      this.isSyncing = true;
      try {
        await api.post('/api/settings/gitlab-instances/sync');
        showNotification({
          title: 'Success',
          text: 'GitLab projects synchronization started. Please wait...',
          type: 'success',
        });
        // Ждем завершения синхронизации (она выполняется на бэкенде)
        // Синхронизация может занять время, поэтому ждем дольше
        setTimeout(async () => {
          await this.loadGitlabInstances();
          this.isSyncing = false;
        }, 8000); // Увеличиваем время ожидания для синхронизации
        return true;
      } catch (error) {
        this.isSyncing = false;
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to sync GitLab instances';
        showNotification({
          title: 'Error',
          text: errorMessage,
          type: 'error',
        });
        console.error('Error syncing GitLab instances:', error.response?.data || error);
        return false;
      }
    },
  },
});

