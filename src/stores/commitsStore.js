import { defineStore } from 'pinia';
import axios from 'axios';
import { showNotification } from '@/services/notificationService';

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
  }),

  actions: {
    async fetchSettings() {
      try {
        const response = await axios.get('http://localhost:8080/api/settings');
        return response.data;
      } catch (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }
    },
    
    async fetchCommits(payload) {
      this.loading = true;
      this.error = null;
    
      try {
        const response = await axios.post('http://localhost:8080/api/commits', payload);
        const masterTasks = response.data.masterTasks;
        const releaseTasks = response.data.releaseTasks;
    
        const releaseTasksMap = new Map();
        releaseTasks.forEach((task) => releaseTasksMap.set(task.key, task.commits));
    
        this.masterTasks = masterTasks.map((task) => ({
          ...task,
          releaseCommits: releaseTasksMap.get(task.key) || [],
        }));
      } catch (error) {
        const errorMessage = error.response?.data?.errorMessage || error.message || 'Unknown error';
        this.error = `Error fetching commits: ${errorMessage}`;
        showNotification({
          title: 'Error',
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
        const response = await axios.post('http://localhost:8080/api/cherrypick', payload);
    
        const taskInfo = response.data;
    
        if (taskInfo.key === 'Error') {
          showNotification({
            title: 'Error',
            text: taskInfo.errorMessage || 'An unknown error occurred.',
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
    
          task.releaseCommits.push(...commitsToAdd);
    
          showNotification({
            title: 'Success',
            text: `Cherry-pick request completed for MR #${payload.mrNumber}.`,
            type: 'success',
          });
        }
      } catch (error) {
        const errorMessage = error.response?.data?.errorMessage || error.message || 'Unknown error';
        showNotification({
          title: 'Error',
          text: `Error sending cherry-pick request: ${errorMessage}`,
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
          title: 'Warning',
          text: 'No commits selected.',
          type: 'warning',
        });
        return;
      }
    
      this.loadingListButton = true;
    
      try {
        const response = await axios.post('http://localhost:8080/api/cherrypicklist', payload);
    
        const taskInfos = response.data;
    
        const errorTasks = taskInfos.filter((task) => task.key === 'Error');
        if (errorTasks.length > 0) {
          errorTasks.forEach((errorTask) => {
            showNotification({
              title: 'Error',
              text: errorTask.errorMessage || 'An unknown error occurred.',
              type: 'error',
            });
          });
        } else {
          showNotification({
            title: 'Success',
            text: `Cherry-pick request sent successfully for ${taskInfos.length} tasks.`,
            type: 'success',
          });
          this.selectedCommits.clear();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.errorMessage || error.message || 'Unknown error';
        showNotification({
          title: 'Error',
          text: `Error sending cherry-pick list request: ${errorMessage}`,
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
      console.log('Updated selectedCommits:', Array.from(this.selectedCommits));
    },
    subscribeToTaskStatus() {
      const eventSource = new EventSource('http://localhost:8080/api/task-status');

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
