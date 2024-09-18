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
            <div class="p-4 text-center" v-if="tasksStore.loading">
              <svg class="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    <th class="border-b p-4 text-left text-center">Release Commits</th>
                    <th class="border-b p-4 text-left text-center">Cherry-pick</th> <!-- Новый столбец для кнопки -->
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in tasksStore.masterTasks" :key="task.key" class="border-b">
                    <td class="p-4 text-center">
                      <button @click="openLink(`https://job-jira.otr.ru/browse/${task.key}`)" class="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500">
                        {{ task.key }}
                      </button>
                    </td>
                    <td class="p-4 text-center">{{ new Date(task.date).toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }) }}</td>

                    <!-- Столбец Master Commits -->
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li v-for="commit in task.commits" :key="commit.mrNumber" class="relative">
                          <button @click="openLink(`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${commit.mrNumber}`)" class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            MR #{{ commit.mrNumber }}
                          </button>
                        </li>
                      </ul>
                    </td>

                    <!-- Столбец Release Commits -->
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li v-for="commit in task.releaseCommits" :key="commit.mrNumber">
                          <button @click="openLink(`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${commit.mrNumber}`)" class="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                            MR #{{ commit.mrNumber }}
                          </button>
                        </li>
                      </ul>
                    </td>

                    <!-- Столбец для кнопки Cherry-pick -->
                    <td class="p-4 text-center">
                      <!-- Отдельная кнопка для Cherry-pick -->
                      <button
                        v-if="task.releaseCommits.length === 0"
                        @click="sendCherryPickRequest(task.commits[0].mrNumber, task.key)"
                        class="bg-gray-500 text-white py-2 px-4 rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-300"
                        title="Cherry-pick commit"
                      >
                        Cherry-pick
                      </button>
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
import { useTasksStore } from '@/stores/commitsStore'
import { ref, watch } from 'vue';

export default {
  setup() {
    const tasksStore = useTasksStore();
    tasksStore.fetchCommits();

    const isDarkMode = ref(false);

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

    return { tasksStore, isDarkMode };
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
  content: "";
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

/* Кнопка Cherry-pick */
button[title="Cherry-pick commit"] {
  font-size: 14px;
  padding: 0.75rem 1rem;
}
</style>
