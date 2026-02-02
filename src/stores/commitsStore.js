import { defineStore } from 'pinia';
import api from '@/services/api';
import { showNotification } from '@/services/notificationService';
import i18n from '@/i18n';

export const useTasksStore = defineStore('tasksStore', {
  state: () => ({
    masterTasks: [],
    loading: false,
    loadingListButton: false, // Для кнопки Cherry-pick Selected
    selectedCommits: new Set(),
    selectedAuthors: [], // Для фильтрации по авторам
    error: null,
    loadingButtons: new Set(),
    taskStatuses: {}, // Храним статусы для каждого taskKey
    patches: [], // Список патчей из Jira
    patchesLoading: false, // Загрузка патчей
  }),

  actions: {
    async fetchSettings() {
      try {
        const response = await api.get('/api/settings');
        return response.data;
      } catch (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }
    },

    async fetchPatches(projectKey = 'SPPDEV') {
      if (!projectKey) {
        this.patches = [];
        return;
      }
      
      this.patchesLoading = true;
      try {
        const response = await api.get('/api/patches', {
          params: { projectKey }
        });
        this.patches = response.data || [];
        // Если список пустой, это не ошибка - просто нет патчей для этого проекта
        if (this.patches.length === 0) {
          console.log(`No patches found for project ${projectKey}`);
        }
      } catch (error) {
        console.warn('Error fetching patches:', error);
        this.patches = [];
        // Не показываем ошибку, если это просто отсутствие проекта в Jira
        // Это нормальная ситуация для проектов, которые не синхронизированы с Jira
        if (error.response?.status !== 400) {
          showNotification({
            title: i18n.t('notifications.warning'),
            text: i18n.t('notifications.noPatchesFound', { projectKey }),
            type: 'warning',
          });
        }
      } finally {
        this.patchesLoading = false;
      }
    },

    async fetchRecentMRs(gitlabUrl, projectId, sourceBranch, targetBranch, mrCount) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await api.post('/api/recent-mrs', {
          gitlabUrl,
          projectId: parseInt(projectId),
          sourceBranch,
          targetBranch,
          mrCount
        });
        
        const masterTasks = response.data.masterTasks;
        const releaseTasks = response.data.releaseTasks;
    
        const releaseTasksMap = new Map();
        releaseTasks.forEach((task) => {
          const commitsArray = task.commits && typeof task.commits === 'object' && !Array.isArray(task.commits)
            ? Object.values(task.commits)
            : (Array.isArray(task.commits) ? task.commits : []);
          releaseTasksMap.set(task.key, commitsArray);
        });
    
        this.masterTasks = masterTasks.map((task) => ({
          ...task,
          releaseCommits: releaseTasksMap.get(task.key) || [],
        }));
      } catch (error) {
        const errorMessage = error.response?.data?.errorMessage || error.message || 'Неизвестная ошибка';
        this.error = `Ошибка получения последних MR: ${errorMessage}`;
        showNotification({
          title: i18n.t('notifications.error'),
          text: this.error,
          type: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    
    async fetchCommits(payload) {
      this.loading = true;
      this.error = null;
    
      try {
        const response = await api.post('/api/commits', payload);
        const masterTasks = response.data.masterTasks;
        const releaseTasks = response.data.releaseTasks;
    
        const releaseTasksMap = new Map();
        releaseTasks.forEach((task) => {
          // Преобразуем commits из Map в массив
          const commitsArray = task.commits && typeof task.commits === 'object' && !Array.isArray(task.commits)
            ? Object.values(task.commits)
            : (Array.isArray(task.commits) ? task.commits : []);
          releaseTasksMap.set(task.key, commitsArray);
        });
    
        this.masterTasks = masterTasks.map((task) => ({
          ...task,
          releaseCommits: releaseTasksMap.get(task.key) || [],
        }));
      } catch (error) {
        const errorMessage = error.response?.data?.errorMessage || error.message || 'Неизвестная ошибка';
        this.error = `Ошибка получения коммитов: ${errorMessage}`;
        showNotification({
          title: i18n.t('notifications.error'),
          text: this.error,
          type: 'error',
        });
      } finally {
        this.loading = false;
      }
    },

    async sendCherryPickRequest(payload) {
      try {
        this.loadingButtons.add(payload.mrNumber);
        const response = await api.post('/api/cherrypick', payload);
    
        const taskInfo = response.data;
    
        if (taskInfo.key === 'Error') {
          showNotification({
            title: i18n.t('notifications.error'),
            text: taskInfo.errorMessage || i18n.t('notifications.unknownError'),
            type: 'error',
          });
          return;
        }
    
        const task = this.masterTasks.find((task) => task.key === payload.taskKey);
        if (task) {
          // Преобразуем Map в массив для корректного использования spread
          const commitsToAdd = Array.isArray(taskInfo.commits)
            ? taskInfo.commits
            : Object.values(taskInfo.commits || {});

          // Убеждаемся, что releaseCommits существует и является массивом
          // (может быть объектом Map, если данные пришли напрямую с бэкенда)
          if (!task.releaseCommits) {
            task.releaseCommits = [];
          } else if (!Array.isArray(task.releaseCommits)) {
            // Если это объект (Map), преобразуем в массив
            task.releaseCommits = Object.values(task.releaseCommits);
          }
          task.releaseCommits.push(...commitsToAdd);

          // Помечаем исходный коммит как перенесённый, чтобы скрыть кнопку Cherry-pick
          if (task.commits) {
            Object.values(task.commits).forEach((commit) => {
              if (commit && commit.mrNumber === payload.mrNumber) {
                commit.transferred = true;
              }
            });
          }
    
          showNotification({
            title: i18n.t('notifications.success'),
            text: i18n.t('notifications.cherryPickCompleted', { mrNumber: payload.mrNumber }),
            type: 'success',
          });
        }
      } catch (error) {
        const errorMessage = error.response?.data?.errorMessage || error.message || 'Неизвестная ошибка';
        showNotification({
          title: 'Error',
          text: `Ошибка отправки запроса на перенос: ${errorMessage}`,
          type: 'error',
        });
        console.error('Error sending cherry-pick request:', error);
      } finally {
        this.loadingButtons.delete(payload.mrNumber); // Снимаем состояние загрузки
      }
    },

    async sendCherryPickList(payload) {
      if (!payload.mrNumbers || payload.mrNumbers.length === 0) {
        showNotification({
          title: i18n.t('notifications.warning'),
          text: i18n.t('notifications.noCommitsSelected'),
          type: 'warning',
        });
        return;
      }
    
      this.loadingListButton = true;
    
      try {
        const response = await api.post('/api/cherrypicklist', payload);
    
        const taskInfos = response.data;
    
        const errorTasks = taskInfos.filter((task) => task.key === 'Error');
        if (errorTasks.length > 0) {
          errorTasks.forEach((errorTask) => {
              showNotification({
                title: i18n.t('notifications.error'),
                text: errorTask.errorMessage || i18n.t('notifications.unknownError'),
                type: 'error',
              });
          });
        } else {
          // Обновляем состояние задач: добавляем releaseCommits и помечаем выбранные коммиты как transferred
          const selectedMrNumbers = new Set(payload.mrNumbers || []);
          
          taskInfos.forEach((taskInfo) => {
            const task = this.masterTasks.find((t) => t.key === taskInfo.key);
            if (task) {
              // Преобразуем commits из Map в массив
              const commitsToAdd = Array.isArray(taskInfo.commits)
                ? taskInfo.commits
                : Object.values(taskInfo.commits || {});
              
              // Добавляем releaseCommits (новый MR)
              // Убеждаемся, что releaseCommits является массивом (может быть объектом Map)
              if (!task.releaseCommits) {
                task.releaseCommits = [];
              } else if (!Array.isArray(task.releaseCommits)) {
                // Если это объект (Map), преобразуем в массив
                task.releaseCommits = Object.values(task.releaseCommits);
              }
              task.releaseCommits.push(...commitsToAdd);
              
              // Помечаем все выбранные коммиты этой задачи как transferred
              if (task.commits) {
                Object.values(task.commits).forEach((commit) => {
                  if (commit.mrNumber && selectedMrNumbers.has(commit.mrNumber)) {
                    commit.transferred = true;
                  }
                });
              }
            }
          });
          
          // Очищаем выбранные коммиты
          this.selectedCommits.clear();
          
          showNotification({
            title: i18n.t('notifications.success'),
            text: i18n.t('notifications.cherryPickListSent', { count: taskInfos.length }),
            type: 'success',
          });
        }
      } catch (error) {
        const errorMessage = error.response?.data?.errorMessage || error.message || 'Неизвестная ошибка';
        showNotification({
          title: 'Error',
          text: `Ошибка отправки запроса на перенос списка: ${errorMessage}`,
          type: 'error',
        });
        console.error('Error sending cherry-pick list request:', error);
      } finally {
        this.loadingListButton = false;
      }
    },

    toggleCommitSelection(mrNumber) {
      if (!this.selectedCommits) {
        this.selectedCommits = new Set();
      }
      if (this.selectedCommits.has(mrNumber)) {
        this.selectedCommits.delete(mrNumber);
      } else {
        this.selectedCommits.add(mrNumber);
      }
      this.selectedCommits = new Set(this.selectedCommits);
      console.log('Updated selectedCommits:', Array.from(this.selectedCommits));
    },
    subscribeToTaskStatus() {
      const eventSource = new EventSource('/api/task-status');

      eventSource.onmessage = (event) => {
        const statusUpdate = JSON.parse(event.data);
        this.taskStatuses[statusUpdate.taskKey] = statusUpdate.status;
      };

      eventSource.onerror = () => {
        console.error('Error with SSE connection.');
        eventSource.close();
      };
    },
  },

  getters: {
    isCherryPickListButtonDisabled(state) {
      return state.selectedCommits.size === 0;
    },
    filteredTasks(state) {
      if (state.selectedAuthors.length === 0) {
        return state.masterTasks;
      }

      return state.masterTasks.filter((task) =>
        Object.values(task.commits || {}).some((commit) =>
          state.selectedAuthors.includes(commit.commit.authorEmail?.split('@')[0])
        )
      );
    },
    getTaskStatus: (state) => (taskKey) => {
      return state.taskStatuses?.[taskKey] ?? 'Ожидание...'; // Безопасный доступ
    },
  },
});
