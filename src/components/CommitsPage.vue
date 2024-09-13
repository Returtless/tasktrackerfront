<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <!-- Theme Switcher -->
    <div class="fixed top-2 right-2">
      <input type="checkbox" v-model="isDarkMode" class="toggle-switch">
    </div>

    <!-- Main Container -->
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors duration-300">
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-4xl mx-auto">
          <!-- Card Wrapper -->
          <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <!-- Header -->
            <div class="bg-blue-500 dark:bg-gray-700 text-white p-4 rounded-t-lg">
              <h1 class="text-center text-xl font-bold">Commits Page</h1>
            </div>

            <!-- Loading Spinner -->
            <div class="p-4 text-center" v-if="loading">
              <svg class="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="text-center text-red-500 p-4">
              {{ error }}
            </div>

            <!-- Data Table -->
            <div v-if="!loading && !error">
              <table class="min-w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
                <thead>
                  <tr>
                    <th class="border-b p-4 text-left text-center">Issue Key</th>
                    <th class="border-b p-4 text-left text-center">Master Commits</th>
                    <th class="border-b p-4 text-left text-center">Release Commits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in masterTasks" :key="task.key" class="border-b">
                    <td class="p-4 text-center">
                      <button @click="openLink(`https://job-jira.otr.ru/browse/${task.key}`)" class="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500">
                        {{ task.key }}
                      </button>
                    </td>
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li v-for="commit in task.commits" :key="commit.mrNumber">
                          <button @click="openLink(`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${commit.mrNumber}`)" class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            MR #{{ commit.mrNumber }}
                          </button>
                        </li>
                      </ul>
                    </td>
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li v-for="commit in task.releaseCommits" :key="commit.mrNumber">
                          <button @click="openLink(`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${commit.mrNumber}`)" class="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                            MR #{{ commit.mrNumber }}
                          </button>
                        </li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      masterTasks: [],
      loading: true,
      error: null,
      isDarkMode: false, // По умолчанию светлая тема
    };
  },
  watch: {
    isDarkMode(newVal) {
      document.body.classList.toggle('dark', newVal);
    }
  },
  methods: {
    async fetchCommits() {
      try {
        const response = await axios.get('http://localhost:8080/api/commits', {
          params: {
            since: '01.09.2024',
            key: 'SUF-5045'
          }
        });
        const { masterTasks, releaseTasks } = response.data;

        const releaseTasksMap = new Map();
        releaseTasks.forEach(task => releaseTasksMap.set(task.key, task.commits));

        this.masterTasks = masterTasks.map(task => ({
          ...task,
          releaseCommits: releaseTasksMap.get(task.key) || []
        }));
      } catch (error) {
        this.error = 'Error fetching commits: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    openLink(url) {
      window.open(url, '_blank');
    }
  },
  mounted() {
    this.fetchCommits();
    document.body.classList.toggle('dark', this.isDarkMode);
  }
};
</script>

<style scoped>
.toggle-switch {
  width: 40px;
  height: 20px;
}
</style>
