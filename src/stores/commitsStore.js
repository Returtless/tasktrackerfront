import { defineStore } from 'pinia';
import axios from 'axios';

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
      } finally {
        this.loading = false;
      }
    },

    async sendCherryPickRequest(mrNumber, taskKey) {
      try {
        console.log('Sending cherry-pick request', { mrNumber, taskKey });
    
        // Отправка запроса на сервер
        const response = await axios.post('http://localhost:8080/api/cherrypick', null, {
          params: { mrNumber, taskKey },
        });
    
        // Логируем полный ответ
        console.log('Server response:', response);
    
        // Получаем данные из ответа (структура TaskInfo)
        const taskInfo = response.data;
        console.log('Task Info from server:', taskInfo);
    
        // Находим задачу в masterTasks по ключу
        const task = this.masterTasks.find((task) => task.key === taskKey);
        
        // Логируем найденную задачу
        if (task) {
          console.log('Found task:', task);
          task.releaseCommits.push(...taskInfo.commits); // Добавляем коммиты из ответа
          console.log('Updated task releaseCommits:', task.releaseCommits);
        } else {
          console.warn('Task not found:', taskKey);
        }
      } catch (error) {
        console.error('Error sending cherry-pick request:', error);
      }
    }
    ,
  },
});
