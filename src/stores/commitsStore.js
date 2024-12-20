// src/stores/tasksStore.js
import { defineStore } from 'pinia';
import axios from 'axios';
import { showNotification } from '@/services/notificationService';

export const useTasksStore = defineStore('tasksStore', {
  state: () => ({
    masterTasks: [],
    loading: false,
    loadingButton: false,
    error: null,
  }),

  actions: {
    async fetchCommits() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get('http://localhost:8080/api/commits', {
          params: {
            since: '21.11.2024',
            key: 'SUF-6177',
          },
        });
        const { masterTasks, releaseTasks } = response.data;

        const releaseTasksMap = new Map();
        releaseTasks.forEach((task) => releaseTasksMap.set(task.key, task.commits));

        this.masterTasks = masterTasks.map((task) => ({
          ...task,
          releaseCommits: releaseTasksMap.get(task.key) || [],
        }));
      } catch (error) {
        this.error = 'Error fetching commits: ' + error.message;
        showNotification({
          title: 'Error',
          text: this.error,
          type: 'error'
        });
      } finally {
        this.loading = false;
      }
    },

    async sendCherryPickRequest(mrNumber, taskKey) {
      this.loadingButton = true;
      console.log('loadingButton', this.loadingButton );
      try {
        const response = await axios.post('http://localhost:8080/api/cherrypick', null, {
          params: { mrNumber, taskKey },
        });

        const taskInfo = response.data;
        if (taskInfo.errorMessage) {
          console.log(taskInfo.errorMessage);
          showNotification({
            title: 'Cherry-pick error',
            text: taskInfo.errorMessage,
            type: 'error'
          });
        } else {
          const task = this.masterTasks.find((task) => task.key === taskKey);
          if (task) {
            task.releaseCommits.push(...taskInfo.commits);
            showNotification({
              title: 'Success',
              text: `Cherry-pick request completed for MR #${mrNumber}.`,
              type: 'success'
            });
          } else {
            console.warn('Task not found:', taskKey);
          }
        }
      } catch (error) {
        showNotification({
          title: 'Error',
          text: 'Error sending cherry-pick request.',
          type: 'error'
        });
        console.error('Error sending cherry-pick request:', error);
      } finally {
        this.loadingButton = false; // Установите loading в false после завершения запроса
        console.log('loadingButton', this.loadingButton );
      }
    },
  },
});
