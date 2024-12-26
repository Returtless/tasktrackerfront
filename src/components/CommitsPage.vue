<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <!-- Theme Switcher -->
    <div class="fixed top-2 right-2">
      <label class="switch">
        <input type="checkbox" v-model="isDarkMode" />
        <span class="slider"></span>
      </label>
    </div>

    <!-- Панель инструментов -->
    <div class="flex justify-between items-center p-4 bg-gray-200 dark:bg-gray-800 shadow-lg">
      <div class="flex space-x-4">
        <!-- Ввод URL GitLab -->
        <input
          type="text"
          v-model="gitlabUrl"
          placeholder="Enter GitLab URL"
          class="p-2 border rounded w-64 dark:bg-gray-700 dark:text-white"
        />
        <!-- Выбор проекта -->
        <input
          type="text"
          v-model="selectedProject"
          placeholder="Enter Project Name"
          class="p-2 border rounded w-64 dark:bg-gray-700 dark:text-white"
        />
        <!-- Выбор веток -->
        <div class="flex items-center space-x-2">
          <input
            type="text"
            v-model="sourceBranch"
            placeholder="Source Branch"
            class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white"
          />
          <span class="text-gray-600 dark:text-gray-400">→</span>
          <input
            type="text"
            v-model="targetBranch"
            placeholder="Target Branch"
            class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
      <button
        @click="refreshTable"
        class="refresh-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Refresh Table
      </button>
    </div>

    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors duration-300">
     <div class="container mx-auto py-8 px-4">
        <div class="max-w-4xl mx-auto">
          <!-- Card Wrapper -->
          <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <!-- Header -->
            <div class="bg-blue-500 dark:bg-gray-700 text-white p-4 rounded-t-lg">
              <h1 class="text-center text-xl font-bold">Commits Page</h1>
              <!-- Filters -->
              <div class="flex justify-between items-center mt-2">
                <!-- Левый блок: комбобокс и сортировка -->
                <div class="flex items-center space-x-4">
                  <!-- Multiselect Component -->
                  <multiselect v-model="selectedAuthors" :options="authorOptions" :multiple="true" :show-labels="false"
                    placeholder="Filter by Author" class="w-64" />
                  <button @click="toggleDateSort" class="sort-date bg-gray-300 p-2 rounded hover:bg-gray-400">
                    Sort by Date ({{ sortDirection.date }})
                  </button>
                </div>
                <!-- Правый блок: Cherry-pick кнопка -->
                <button class="cherry-pick"
                  :disabled="tasksStore.isCherryPickListButtonDisabled || tasksStore.loadingListButton"
                  @click="tasksStore.sendCherryPickList" :class="[
                    tasksStore.loadingListButton
                      ? 'animate-pulse bg-green-500'
                      : 'bg-green-500 hover:bg-green-600',
                    tasksStore.isCherryPickListButtonDisabled || tasksStore.loadingListButton
                      ? 'opacity-50 cursor-not-allowed'
                      : '',
                    'text-white px-4 py-2 rounded focus:outline-none focus:ring-2'
                  ]">
                  <span v-if="tasksStore.loadingListButton">Processing...</span>
                  <span v-else>Cherry-pick Selected</span>
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
              <table class="min-w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                style="table-layout: fixed;">
                <thead>
                  <tr>
                    <th class="border-b p-4 text-left w-1/12">Select</th>
                    <th class="border-b p-4 text-left w-2/12">Issue Key</th>
                    <th class="border-b p-4 text-left w-2/12">Date</th>
                    <th class="border-b p-4 text-left w-3/12">Master Commits</th>
                    <th class="border-b p-4 text-left w-2/12">Author</th>
                    <th class="border-b p-4 text-left w-3/12">Release Commits</th>
                    <th class="border-b p-4 text-left w-2/12">Cherry-pick</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in filteredTasks" :key="task.key" class="border-b">
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li v-for="commit in (task.commits ? filteredCommits(task.commits) : [])"
                          :key="commit?.mrNumber || Math.random()">
                          <input type="checkbox" :checked="tasksStore.selectedCommits?.has(commit?.mrNumber)"
                            @change="commit?.mrNumber && tasksStore.toggleCommitSelection(commit.mrNumber)" />
                        </li>
                      </ul>
                    </td>
                    <td class="p-4 text-center">
                      <button @click="openLink(`https://job-jira.otr.ru/browse/${task.key}`)"
                        class="bg-orange-500 text-white px-2 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500">
                        {{ task.key }}
                      </button>
                    </td>
                    <td class="p-4 text-center whitespace-nowrap">
                      {{ new Date(task.date).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', year:
                      'numeric', hour: '2-digit', minute: '2-digit'
                      }).replace(',', '') }}
                    </td>

                    <!-- Master Commits -->
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li v-for="commit in (task.commits ? filteredCommits(task.commits) : [])"
                          :key="commit?.mrNumber || Math.random()" class="relative">
                          <button v-if="commit?.mrNumber"
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
                        <li v-for="commit in (task.commits ? filteredCommits(task.commits) : [])"
                          :key="commit?.mrNumber || Math.random()" class="whitespace-nowrap">
                          {{ commit?.commit?.authorEmail?.split('@')[0] || 'Unknown' }}
                        </li>
                      </ul>
                    </td>

                    <!-- Release Commits -->
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li v-for="commit in (task.releaseCommits ? Object.values(task.releaseCommits) : [])"
                          :key="commit?.mrNumber || Math.random()" class="relative">
                          <button v-if="commit?.mrNumber" :class="[
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
                        <li v-for="commit in (task.commits ? filteredCommits(task.commits) : [])"
                          :key="commit?.mrNumber || Math.random()" class="relative">
                          <button v-if="task.releaseCommits?.length === 0" :class="[
                            'bg-gray-500 text-white px-2 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-300',
                            tasksStore.loadingButton ? 'animate-pulse' : '',
                          ]" :disabled="tasksStore.loadingButton"
                            @click="tasksStore.sendCherryPickRequest(commit.mrNumber, task.key, $event)">
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
import Multiselect from 'vue-multiselect';

export default {
  components: { Multiselect },
  setup() {
    const tasksStore = useTasksStore();

    const isDarkMode = ref(false);
    const selectedAuthors = ref([]); // Для хранения выбранных авторов
    const sortKey = ref(null);
    const sortDirection = ref({ date: 'asc' });
    // Управление таблицей
    const gitlabUrl = ref('');
    const selectedProject = ref('');
    const sourceBranch = ref('master');
    const targetBranch = ref('release');
    const isRefreshing = ref(false);
    
    const refreshTable = async () => {
      try {
        isRefreshing.value = true;
        tasksStore.loading = true;
        await tasksStore.fetchCommits({
          gitlabUrl: gitlabUrl.value,
          project: selectedProject.value,
          sourceBranch: sourceBranch.value,
          targetBranch: targetBranch.value,
        });
      } catch (error) {
        console.error('Failed to refresh table:', error);
      } finally {
        isRefreshing.value = false;
        tasksStore.loading = false;
      }
    };

    // Генерация списка доступных авторов из masterTasks
    const authorOptions = computed(() => {
      const authors = new Set();
      tasksStore.masterTasks.forEach((task) =>
        Object.values(task.commits || {}).forEach((commit) =>
          authors.add(commit.commit.authorEmail?.split('@')[0])
        )
      );
      return Array.from(authors);
    });
    console.log('authorOptions:', authorOptions);
    const filteredCommits = (commits) => {
      if (!commits) {
        console.error('Commits object is undefined or null:', commits);
        return [];
      }
      const result = Object.values(commits).filter(
        (commit) =>
          selectedAuthors.value.length === 0 ||
          selectedAuthors.value.includes(commit?.commit?.authorEmail?.split('@')[0])
      );
      console.log('Filtered Commits:', result);
      return result;
    };

    const filteredTasks = computed(() => {
      let tasks = tasksStore.masterTasks;

      // Фильтрация по выбранным авторам
      if (selectedAuthors.value.length > 0) {
        tasks = tasks.filter((task) =>
          task.commits &&
          Object.values(task.commits).some((commit) =>
            selectedAuthors.value.includes(commit?.commit?.authorEmail?.split('@')[0])
          )
        );
      }

      // Сортировка по дате
      if (sortKey.value === 'date') {
        tasks = tasks.slice().sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return sortDirection.value.date === 'asc'
            ? dateA - dateB
            : dateB - dateA;
        });
      }
      return tasks;
    });

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

    const toggleDateSort = () => {
      sortDirection.value.date =
        sortDirection.value.date === 'asc' ? 'desc' : 'asc';
      sortKey.value = 'date';
    };

    const openLink = (url) => {
      window.open(url, '_blank');
    };

    return {
      tasksStore,
      isDarkMode,
      selectedAuthors,
      authorOptions,
      sortKey,
      sortDirection,
      filteredTasks,
      filteredCommits,
      toggleDateSort,
      openLink,
      gitlabUrl,
      selectedProject,
      sourceBranch,
      targetBranch,
      refreshTable,
    };
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

input:checked+.slider {
  background-color: #4caf50;
}

input:checked+.slider:before {
  transform: translateX(26px);
}

.dark input:checked+.slider {
  background-color: #000;
}

.dark {
  background-color: #121212;
  color: #ffffff;
}

.dark body {
  background-color: #121212;
}

.dark .container {
  background-color: transparent;
}

button {
  height: 40px;
  line-height: 40px;
  display: inline-block;
  white-space: nowrap;
}

button.cherry-pick {
  height: 40px;
  min-width: 150px;
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

.flex {
  display: flex;
  align-items: center;
  /* Выравнивание по вертикали */
  justify-content: space-between;
  /* Пространство между блоками */
}

.space-x-4>*+* {
  margin-left: 1rem;
  /* Отступы между элементами внутри flex-контейнера */
}

button.cherry-pick {
  height: 40px;
  min-width: 150px;
  line-height: 40px;
  /* Центрирование текста */
  padding: 0 10px;
  /* Добавляем внутренние отступы */
}

.multiselect {
  max-width: 300px;
  /* Ограничение ширины комбобокса */
}

button {
  white-space: nowrap;
  /* Запрещает перенос текста */
}

button.sort-date {
  height: 40px;
  /* Высота кнопки */
  line-height: 40px;
  /* Центрирование текста по вертикали */
  padding: 0 10px;
  /* Горизонтальные отступы */
  text-align: center;
  /* Центрирование текста */
  display: inline-block;
  /* Убедитесь, что кнопка отображается корректно */
  white-space: nowrap;
  /* Запрещает перенос текста */
}
.refresh-button {
  height: 40px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}
input.dark {
  background-color: #1a202c;
  color: #fff;
}
</style>