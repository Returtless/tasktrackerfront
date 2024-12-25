import { defineStore } from 'pinia';
import axios from 'axios';
import { showNotification } from '@/services/notificationService';

export const useTasksStore = defineStore('tasksStore', {
  state: () => ({
    masterTasks: [],
    loading: false,
    loadingButton: false,
    loadingListButton: false, // Для кнопки Cherry-pick Selected
    selectedCommits: new Set(),
    error: null,
  }),

  actions: {
    async fetchCommits() {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get('http://localhost:8080/api/commits', {
          params: { since: '21.11.2024', key: 'SUF-6177' },
        });

        const masterTasks = response.data.masterTasks;
        const releaseTasks = response.data.releaseTasks;

        // Проверяем на наличие ошибок
        const errorTasks = masterTasks.filter((task) => task.key === 'Error');
        if (errorTasks.length > 0) {
          errorTasks.forEach((errorTask) => {
            showNotification({
              title: 'Error',
              text: errorTask.errorMessage || 'An unknown error occurred.',
              type: 'error',
            });
          });
          return;
        }

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

    async sendCherryPickRequest(mrNumber, taskKey, event) {
      this.loadingButton = true;
      const buttonPosition = event?.target?.getBoundingClientRect();

      try {
        const response = await axios.post('http://localhost:8080/api/cherrypick', null, {
          params: { mrNumber, taskKey },
        });

        const taskInfo = response.data;

        // Проверяем на наличие ошибки
        if (taskInfo.key === 'Error') {
          showNotification({
            title: 'Error',
            text: taskInfo.errorMessage || 'An unknown error occurred.',
            type: 'error',
            position: buttonPosition,
          });
          return;
        }

        const task = this.masterTasks.find((task) => task.key === taskKey);
        if (task) {
          task.releaseCommits.push(...taskInfo.commits);
          showNotification({
            title: 'Success',
            text: `Cherry-pick request completed for MR #${mrNumber}.`,
            type: 'success',
            position: buttonPosition,
          });
        } else {
          console.warn('Task not found:', taskKey);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.errorMessage || error.message || 'Unknown error';
        showNotification({
          title: 'Error',
          text: `Error sending cherry-pick request: ${errorMessage}`,
          type: 'error',
          position: buttonPosition,
        });
        console.error('Error sending cherry-pick request:', error);
      } finally {
        this.loadingButton = false;
      }
    },

    async sendCherryPickList() {
      if (this.selectedCommits.size === 0) {
        showNotification({
          title: 'Warning',
          text: 'No commits selected.',
          type: 'warning',
        });
        return;
      }
    
      this.loadingListButton = true;
    
      try {
        const params = new URLSearchParams();
        Array.from(this.selectedCommits).forEach((mrNumber) => {
          params.append('mrNumbers', mrNumber);
        });
    
        const response = await axios.post(
          `http://localhost:8080/api/cherrypicklist?${params.toString()}`
        );
    
        const taskInfos = response.data;
    
        // Проверяем на наличие ошибок
        const errorTasks = taskInfos.filter((task) => task.key === 'Error');
    
        if (errorTasks.length > 0) {
          // Выводим текст ошибки для каждого TaskInfo с ключом "Error"
          errorTasks.forEach((errorTask) => {
            const errorMessage =
              errorTask.errorMessage || 'An unknown error occurred.';
            showNotification({
              title: 'Error',
              text: errorMessage,
              type: 'error',
            });
          });
        } else {
          showNotification({
            title: 'Success',
            text: `Cherry-pick request sent successfully for ${taskInfos.length} tasks.`,
            type: 'success',
          });
          // Очищаем выбранные коммиты после успешного выполнения
          this.selectedCommits.clear();
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.map((err) => err.errorMessage).join(', ') ||
          error.message ||
          'Unknown error';
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
  },

  getters: {
    isCherryPickListButtonDisabled(state) {
      return state.selectedCommits.size === 0;
    },
  },
});
