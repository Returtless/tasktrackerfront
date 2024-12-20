<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <!-- Theme Switcher -->
    <div class="fixed top-2 right-2">
      <label class="switch">
        <input type="checkbox" v-model="isDarkMode" />
        <span class="slider"></span>
      </label>
    </div>

    <!-- Main Container -->
    <div
      class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors duration-300">
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-4xl mx-auto">
          <!-- Card Wrapper -->
          <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <!-- Header -->
            <div class="bg-blue-500 dark:bg-gray-700 text-white p-4 rounded-t-lg">
              <h1 class="text-center text-xl font-bold">Commits Page</h1>
              <!-- Filters -->
              <div class="flex justify-end mt-2">
                <input
                  v-model="authorFilter"
                  class="border p-2 rounded mr-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                  placeholder="Filter by Author"
                />
                <button @click="toggleDateSort" class="bg-gray-300 p-2 rounded hover:bg-gray-400">
                  Sort by Date ({{ sortDirection.date }})
                </button>
              </div>
            </div>

            <!-- Loading Spinner -->
            <div class="p-4 text-center" v-if="tasksStore.loading">
              <svg class="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            </div>

            <!-- Error Message -->
            <div v-if="tasksStore.error" class="text-center text-red-500 p-4">
              {{ tasksStore.error }}
            </div>

            <!-- Data Table -->
            <div v-if="!tasksStore.loading && !tasksStore.error">
              <table class="min-w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
                <thead>
                  <tr>
                    <th class="border-b p-4 text-left text-center">Issue Key</th>
                    <th class="border-b p-4 text-left text-center">Date</th>
                    <th class="border-b p-4 text-left text-center">Master Commits</th>
                    <th class="border-b p-4 text-left text-center">Author</th>
                    <th class="border-b p-4 text-left text-center">Release Commits</th>
                    <th class="border-b p-4 text-left text-center">Cherry-pick</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in filteredTasks" :key="task.key" class="border-b">
                    <td class="p-4 text-center">
                      <button @click="openLink(`https://job-jira.otr.ru/browse/${task.key}`)"
                        class="bg-orange-500 text-white px-2 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500">
                        {{ task.key }}
                      </button>
                    </td>
                    <td class="p-4 text-center whitespace-nowrap">
                      {{ new Date(task.date).toLocaleString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                      }) }}
                    </td>

                    <!-- Master Commits -->
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li
                          v-for="commit in (task.commits ? filteredCommits(task.commits) : [])"
                          :key="commit?.mrNumber || Math.random()"
                          class="relative">
                          <button
                            v-if="commit?.mrNumber"
                            @click="openLink(`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${commit.mrNumber}`)"
                            class="bg-blue-500 text-white px-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            MR #{{ commit?.mrNumber }}
                          </button>
                        </li>
                      </ul>
                    </td>

                    <!-- Author -->
                    <td class="p-4 text-center align-middle">
                      <ul class="list-none space-y-2">
                        <li
                          v-for="commit in (task.commits ? filteredCommits(task.commits) : [])"
                          :key="commit?.mrNumber || Math.random()"
                          class="whitespace-nowrap">
                          {{ commit?.commit?.authorEmail?.split('@')[0] || 'Unknown' }}
                        </li>
                      </ul>
                    </td>

                    <!-- Release Commits -->
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li
                          v-for="commit in (task.releaseCommits ? Object.values(task.releaseCommits) : [])"
                          :key="commit?.mrNumber || Math.random()"
                          class="relative">
                          <button
                            v-if="commit?.mrNumber"
                            :class="[
                              Object.keys(task.commits || {}).length !==
                              Object.keys(task.releaseCommits || {}).length
                                ? 'bg-red-500 focus:ring-red-500 hover:bg-red-600'
                                : 'bg-green-500 focus:ring-green-500 hover:bg-green-600',
                              'text-white px-2 rounded focus:outline-none focus:ring-2',
                            ]"
                            @click="openLink(`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${commit.mrNumber}`)">
                            MR #{{ commit.mrNumber }}
                          </button>
                        </li>
                      </ul>
                    </td>

                    <!-- Cherry-pick -->
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li
                          v-for="commit in (task.commits ? filteredCommits(task.commits) : [])"
                          :key="commit?.mrNumber || Math.random()"
                          class="relative">
                          <button
                            v-if="task.releaseCommits?.length === 0"
                            :class="[
                              'bg-gray-500 text-white px-2 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-300',
                              tasksStore.loadingButton ? 'animate-pulse' : '',
                            ]"
                            :disabled="tasksStore.loadingButton"
                            @click="tasksStore.sendCherryPickRequest(commit.mrNumber, task.key)">
                            <span v-if="tasksStore.loadingButton">Ожидание...</span>
                            <span v-else>Cherry-pick</span>
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
import { useTasksStore } from '@/stores/commitsStore';
import { ref, watch, computed } from 'vue';

export default {
  setup() {
    const tasksStore = useTasksStore();
    tasksStore.fetchCommits();

    const isDarkMode = ref(false);
    const authorFilter = ref('');
    const sortKey = ref(null);
    const sortDirection = ref({ date: 'asc' });

    const filteredCommits = (commits) => {
      if (!commits) {
        console.error('Commits object is undefined or null:', commits);
        return [];
      }
      const result = Object.values(commits).filter(
        (commit) =>
          authorFilter.value === '' ||
          commit?.commit?.authorEmail?.toLowerCase().includes(authorFilter.value.toLowerCase())
      );
      return result;
    };

    const filteredTasks = computed(() => {
      let tasks = tasksStore.masterTasks;
      if (!tasks) {
        console.error('Tasks are undefined or null:', tasks);
        return [];
      }
      if (authorFilter.value) {
        tasks = tasks.filter((task) => {
          const hasValidCommits = Object.values(task.commits || {}).some((commit) =>
            commit?.commit?.authorEmail?.toLowerCase().includes(authorFilter.value.toLowerCase())
          );
          return hasValidCommits;
        });
      }
      if (sortKey.value) {
        tasks = tasks.slice().sort((a, b) => {
          if (sortKey.value === 'date') {
            return sortDirection.value.date === 'asc'
              ? new Date(a.date) - new Date(b.date)
              : new Date(b.date) - new Date(a.date);
          }
          return 0;
        });
      }
      return tasks;
    });

    // Watcher для обновления темы
    watch(isDarkMode, (newVal) => {
      if (newVal) {
        document.body.classList.add('dark');
        document.body.classList.remove('bg-gray-100');
        document.body.classList.add('bg-gray-900');
      } else {
        document.body.classList.remove('dark');
        document.body.classList.add('bg-gray-100');
        document.body.classList.remove('bg-gray-900');
      }
    });

    function toggleDateSort() {
      sortDirection.value.date = sortDirection.value.date === 'asc' ? 'desc' : 'asc';
      sortKey.value = 'date';
    }

    return {
      tasksStore,
      isDarkMode,
      authorFilter,
      filteredTasks,
      toggleDateSort,
      filteredCommits,
      sortDirection,
    };
  },
  methods: {
    openLink(url) {
      window.open(url, '_blank');
    },
    sendCherryPickRequest(mrNumber, taskKey) {
      this.tasksStore.sendCherryPickRequest(mrNumber, taskKey);
    },
  },
};
</script>

<style scoped>
/* Toggle switch */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4caf50;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.dark input:checked + .slider {
  background-color: #000;
}

button {
  display: inline-block;
  white-space: nowrap;
  text-align: center;
}

.animate-pulse {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
