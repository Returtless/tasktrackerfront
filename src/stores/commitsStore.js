// src/stores/tasksStore.js
import { defineStore } from 'pinia';
import axios from 'axios';
import { showNotification } from '@/services/notificationService';

export const useTasksStore = defineStore('tasksStore', {
  state: () => ({
    masterTasks: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchCommits() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get('http://localhost:8080/api/commits', {
          params: {
            since: '25.08.2024',
            key: 'SUF-5047',
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
      }
    },
  },
});
