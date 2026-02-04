import { defineStore } from 'pinia';
import api from '@/services/api';
import { showNotification } from '@/services/notificationService';
import i18n from '@/i18n';

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
          title: i18n.t('notifications.warning'),
          text: i18n.t('notifications.waitForSync'),
          type: 'warning',
        });
        return false;
      }
      
      this.isLoading = true;
      try {
        const response = await api.put('/api/settings/app', { settings });
        this.appSettings = response.data || {};
          showNotification({
            title: i18n.t('notifications.success'),
            text: i18n.t('notifications.settingsSaved'),
            type: 'success',
          });
        return true;
      } catch (error) {
          showNotification({
            title: i18n.t('notifications.error'),
            text: error.response?.data?.message || i18n.t('notifications.failedToSaveSettings'),
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
            title: i18n.t('notifications.success'),
            text: i18n.t('notifications.settingsSaved'),
            type: 'success',
          });
        return true;
      } catch (error) {
          showNotification({
            title: i18n.t('notifications.error'),
            text: error.response?.data?.message || i18n.t('notifications.failedToSaveSettings'),
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
            title: i18n.t('notifications.success'),
            text: i18n.t('notifications.gitlabInstanceCreated'),
            type: 'success',
          });
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Не удалось создать экземпляр GitLab';
        showNotification({
          title: i18n.t('notifications.error'),
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
            title: i18n.t('notifications.success'),
            text: i18n.t('notifications.gitlabInstanceUpdated'),
            type: 'success',
          });
        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Не удалось обновить экземпляр GitLab';
        showNotification({
          title: i18n.t('notifications.error'),
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
            title: i18n.t('notifications.success'),
            text: i18n.t('notifications.gitlabInstanceDeleted'),
            type: 'success',
          });
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Не удалось удалить экземпляр GitLab';
        showNotification({
          title: i18n.t('notifications.error'),
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
            title: i18n.t('notifications.success'),
            text: i18n.t('notifications.syncStarted'),
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
                           'Не удалось синхронизировать экземпляры GitLab';
        showNotification({
          title: i18n.t('notifications.error'),
          text: errorMessage,
          type: 'error',
        });
        console.error('Error syncing GitLab instances:', error.response?.data || error);
        return false;
      }
    },

    async loadSelectedProjectsAndBranches() {
      try {
        await this.loadUserSettings();
        const selectionJson = this.userSettings['selected_projects_and_branches'];
        if (selectionJson) {
          return JSON.parse(selectionJson);
        }
        return null;
      } catch (error) {
        console.error('Error loading selected projects and branches:', error);
        return null;
      }
    },

    async saveSelectedProjectsAndBranches(selection) {
      try {
        const response = await api.put('/api/settings/user/projects-branches', { selection });
        this.userSettings = response.data || {};
          showNotification({
            title: i18n.t('notifications.success'),
            text: i18n.t('notifications.selectionSaved'),
            type: 'success',
          });
        return true;
      } catch (error) {
          showNotification({
            title: i18n.t('notifications.error'),
            text: error.response?.data?.message || i18n.t('notifications.failedToSaveSelection'),
            type: 'error',
          });
        console.error('Error saving selected projects and branches:', error);
        return false;
      }
    },

    reset() {
      this.appSettings = {};
      this.userSettings = {};
      this.gitlabInstances = [];
      this.isLoading = false;
      this.isSyncing = false;
    },
  },
});

