<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <!-- Theme Switcher -->
    <div class="fixed top-2 right-2">
      <label class="switch">
        <input type="checkbox" v-model="isDarkMode" />
        <span class="slider"></span>
      </label>
    </div>

    <div class="relative">
      <!-- Панель инструментов -->
      <div class="flex flex-wrap justify-between items-center p-4 bg-gray-200 dark:bg-gray-800 shadow-lg gap-4">
        <!-- Индикатор загрузки -->
        <div v-if="isSettingsLoading" class="w-full">
          <div class="relative h-2 bg-gray-300 dark:bg-gray-700 rounded">
            <div class="absolute h-full bg-blue-500 dark:bg-blue-400 rounded animate-loading" style="width: 100%;">
            </div>
          </div>
        </div>

        <!-- Секция с выпадающими списками -->
        <template v-else>
          <div class="flex flex-wrap items-center gap-4">
            <!-- Выбор URL GitLab -->
            <select v-model="selectedGitlabUrl" class="p-2 border rounded w-64 dark:bg-gray-700 dark:text-white">
              <option value="" disabled>Select GitLab URL</option>
              <option v-for="url in settings?.gitlabUrls || []" :key="url.url" :value="url.url">
                {{ url.url }}
              </option>
            </select>

            <!-- Выбор проекта -->
            <select v-model="selectedProjectId" class="p-2 border rounded w-64 dark:bg-gray-700 dark:text-white"
              :disabled="!selectedGitlabUrl">
              <option value="" disabled>Select Project</option>
              <option v-for="project in selectedGitlabUrlProjects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>

            <!-- Выбор веток -->
            <select v-model="sourceBranch" class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white"
              :disabled="!selectedProjectId">
              <option value="" disabled>Select Source Branch</option>
              <option v-for="branch in selectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
            <span class="text-gray-600 dark:text-gray-400">→</span>
            <select v-model="targetBranch" class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white"
              :disabled="!selectedProjectId">
              <option value="" disabled>Select Target Branch</option>
              <option v-for="branch in selectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>

          <!-- Поля Patch Number и Start Date рядом с Refresh -->
          <div class="flex items-center gap-4">
            <input type="text" v-model="patchNumber" placeholder="Patch Number"
              class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white" />

            <input type="date" v-model="startDate" class="p-2 border rounded w-40 dark:bg-gray-700 dark:text-white" />

            <button @click="refreshTable"
              class="refresh-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              :disabled="isRefreshDisabled" :class="{ 'opacity-50 cursor-not-allowed': isRefreshDisabled }">
              Refresh Table
            </button>
          </div>
        </template>
      </div>
    </div>


    <div
      class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors duration-300">
      <div class="container mx-auto py-8 px-4">
          <!-- Card Wrapper -->
          <div class="mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg w-fit">
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
                  @click="handleCherryPickList" :class="[
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
    <div v-if="!tasksStore.loading && !tasksStore.error" class="flex justify-center">
    <div class="w-fit">
      <table class="table-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
      

                <thead>
                  <tr>
                    <th class="border-b p-4 text-left w-1/12">Select</th>
                    <th class="border-b p-4 text-left w-2/12">Issue Key</th>
                    <th class="border-b p-4 text-left w-2/12">Date</th>
                    <th class="border-b p-4 text-left w-3/12">Source Commits</th>
                    <th class="border-b p-4 text-left w-2/12">Author</th>
                    <th class="border-b p-4 text-left w-3/12">Target Commits</th>
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
                          :key="commit?.mrNumber || Math.random()" class="relative flex items-center space-x-1">
                          <button v-if="commit?.mrNumber" @click="openLink(`${commit.url}`)"
                            class="bg-blue-500 text-white px-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            MR #{{ commit?.mrNumber }}
                          </button>

                          <button v-if="commit?.commit?.webUrl" @click="openLink(`${commit.commit.webUrl}`)"
                            class="bg-purple-500 text-white w-6 h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center"
                            title="Open commit web URL">
                            🔗
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

                    <!-- Target Commits -->
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li v-for="commit in (task.releaseCommits ? Object.values(task.releaseCommits) : [])"
                          :key="commit?.mrNumber || Math.random()" class="relative flex items-center space-x-1">
                          <button v-if="commit?.mrNumber" @click="openLink(`${commit.url}`)"
                            class="bg-blue-500 text-white px-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            MR #{{ commit?.mrNumber }}
                          </button>

                          <button v-if="commit?.commit?.webUrl" @click="openLink(`${commit.commit.webUrl}`)"
                            class="bg-purple-500 text-white w-6 h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center"
                            title="Open commit web URL">
                            🔗
                          </button>
                        </li>
                      </ul>
                    </td>

                    <!-- Cherry-pick -->
                    <td class="p-4 text-center">
                      <ul class="list-none space-y-2">
                        <li v-for="commit in (task.commits ? filteredCommits(task.commits) : [])"
                          :key="commit?.mrNumber || Math.random()" class="relative">
                          <button
  :disabled="tasksStore.loadingButtons.has(commit.mrNumber)"
  @click="handleCherryPickRequest(commit.mrNumber, task.key)"
  class="relative flex justify-center items-center w-32 h-10 px-4 py-2 rounded text-white transition-all duration-300 ease-in-out"
  :class="[
    tasksStore.loadingButtons.has(commit.mrNumber) ? 'bg-red-500' : 'bg-green-500 hover:bg-green-600',
  ]"
  :title="tasksStore.loadingButtons.has(commit.mrNumber) ? tasksStore.getTaskStatus(task.key) : 'Cherry-pick'"
>
  <!-- Фиолетовый индикатор загрузки снизу -->
  <div
    v-if="tasksStore.loadingButtons.has(commit.mrNumber)"
    class="absolute bottom-0 left-0 h-1 bg-purple-500 w-full animate-progress"
  ></div>

  <!-- Контейнер текста -->
  <span
    class="flex items-center justify-center w-full h-full text-center px-2 leading-normal"
    :class="{
      'text-sm': tasksStore.loadingButtons.has(commit.mrNumber) ? tasksStore.getTaskStatus(task.key).length <= 15 : true,
      'text-xs': tasksStore.loadingButtons.has(commit.mrNumber) ? tasksStore.getTaskStatus(task.key).length > 15 : false,
      'text-[10px]': tasksStore.loadingButtons.has(commit.mrNumber) ? tasksStore.getTaskStatus(task.key).length > 30 : false,
    }"
  >
    {{
      tasksStore.loadingButtons.has(commit.mrNumber)
        ? tasksStore.getTaskStatus(task.key).slice(0, 18) + (tasksStore.getTaskStatus(task.key).length > 18 ? "..." : "")
        : "Cherry-pick"
    }}
  </span>
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
import { ref, watch, computed, onMounted } from 'vue';
import Multiselect from 'vue-multiselect';

export default {
  components: { Multiselect },
  setup() {
    const tasksStore = useTasksStore();

    // Новые данные для панели инструментов
    const settings = ref({ gitlabUrls: [] });
    const selectedGitlabUrl = ref('');
    const selectedProjectId = ref('');
    const sourceBranch = ref('');
    const targetBranch = ref('');

    // Существующие данные
    const isDarkMode = ref(false);
    const selectedAuthors = ref([]);
    const sortKey = ref(null);
    const sortDirection = ref({ date: 'asc' });
    const gitlabUrl = ref('');
    const selectedProject = ref('');
    const patchNumber = ref('');
    const startDate = ref('');
    const isRefreshing = ref(false);
    const isSettingsLoading = ref(true);
    // Вспомогательные вычисления для зависимых списков
    const selectedGitlabUrlProjects = computed(() => {
      const urlData = settings.value?.gitlabUrls.find((url) => url.url === selectedGitlabUrl.value);
      return urlData?.projects || [];
    });

    const selectedProjectBranches = computed(() => {
      const projectData = selectedGitlabUrlProjects.value.find((proj) => proj.id === selectedProjectId.value);
      return projectData?.branches || [];
    });

    const authorOptions = computed(() => {
      const authors = new Set();
      tasksStore.masterTasks.forEach((task) =>
        Object.values(task.commits || {}).forEach((commit) =>
          authors.add(commit.commit.authorEmail?.split('@')[0])
        )
      );
      return Array.from(authors);
    });

    const isRefreshDisabled = computed(() => {
      return (
        isSettingsLoading.value || // Если данные загружаются
        !selectedGitlabUrl.value || // Если GitLab URL не выбран
        !selectedProjectId.value || // Если проект не выбран
        !sourceBranch.value || // Если исходная ветка не выбрана
        !targetBranch.value // Если целевая ветка не выбрана
      );
    });

    // Методы
    const refreshTable = async () => {
      try {
        isRefreshing.value = true;
        tasksStore.loading = true;
        console.log({
          gitlabUrl: selectedGitlabUrl.value,
          projectId: selectedProjectId.value,
          sourceBranch: sourceBranch.value,
          targetBranch: targetBranch.value,
          patchNumber: patchNumber.value,
          startDate: startDate.value,
        });
        await tasksStore.fetchCommits({
          gitlabUrl: selectedGitlabUrl.value,
          projectId: selectedProjectId.value,
          sourceBranch: sourceBranch.value,
          targetBranch: targetBranch.value,
          patchNumber: patchNumber.value,
          startDate: startDate.value,
        });
      } catch (error) {
        console.error('Failed to refresh table:', error);
      } finally {
        isRefreshing.value = false;
        tasksStore.loading = false;
      }
    };

    const handleCherryPickRequest = (mrNumber, taskKey) => {
      const payload = {
        gitlabUrl: selectedGitlabUrl.value,
        projectId: selectedProjectId.value,
        branchFrom: sourceBranch.value,
        branchTo: targetBranch.value,
        mrNumber,
        taskKey,
      };

      tasksStore.sendCherryPickRequest(payload);
    };

    const handleCherryPickList = () => {
      const payload = {
        gitlabUrl: selectedGitlabUrl.value,
        projectId: selectedProjectId.value,
        branchFrom: sourceBranch.value,
        branchTo: targetBranch.value,
        mrNumbers: Array.from(tasksStore.selectedCommits), // Список выбранных MR
      };

      tasksStore.sendCherryPickList(payload);
    };

    const toggleDateSort = () => {
      sortDirection.value.date = sortDirection.value.date === 'asc' ? 'desc' : 'asc';
      sortKey.value = 'date';
    };

    const openLink = (url) => {
      window.open(url, '_blank');
    };

    const filteredCommits = (commits) => {
      if (!commits) {
        console.error('Commits object is undefined or null:', commits);
        return [];
      }
      return Object.values(commits).filter(
        (commit) =>
          selectedAuthors.value.length === 0 ||
          selectedAuthors.value.includes(commit?.commit?.authorEmail?.split('@')[0])
      );
    };

    const filteredTasks = computed(() => {
      let tasks = tasksStore.masterTasks;

      if (selectedAuthors.value.length > 0) {
        tasks = tasks.filter((task) =>
          task.commits &&
          Object.values(task.commits).some((commit) =>
            selectedAuthors.value.includes(commit?.commit?.authorEmail?.split('@')[0])
          )
        );
      }

      if (sortKey.value === 'date') {
        tasks = tasks.slice().sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return sortDirection.value.date === 'asc' ? dateA - dateB : dateB - dateA;
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

    // Загрузка настроек при монтировании компонента
    onMounted(async () => {
      try {
        isSettingsLoading.value = true; // Показать индикатор загрузки
        settings.value = await tasksStore.fetchSettings();
        tasksStore.subscribeToTaskStatus();
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        isSettingsLoading.value = false; // Скрыть индикатор загрузки
      }
    });

    // Возвращаем все данные и методы
    return {
      tasksStore,
      isDarkMode,
      selectedAuthors,
      authorOptions,
      sortKey,
      sortDirection,
      filteredTasks,
      patchNumber,
      startDate,
      filteredCommits,
      toggleDateSort,
      openLink,
      gitlabUrl,
      selectedProject,
      sourceBranch,
      targetBranch,
      selectedGitlabUrl,
      selectedProjectId,
      selectedGitlabUrlProjects,
      selectedProjectBranches,
      refreshTable,
      settings,
      handleCherryPickRequest,
      handleCherryPickList,
      isSettingsLoading,
      isRefreshDisabled,
    };
  }
  ,
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

.flex-wrap {
  flex-wrap: wrap;
}

.gap-4 {
  gap: 1rem;
}

.refresh-button {
  height: 40px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

select {
  min-width: 120px;
}

@media (max-width: 768px) {
  .flex-wrap {
    flex-direction: column;
    align-items: flex-start;
  }

  .gap-4 {
    gap: 0.5rem;
  }

  .refresh-button {
    align-self: center;
  }
}

.animate-loading {
  background: linear-gradient(90deg, rgba(59, 130, 246, 1) 25%, rgba(59, 130, 246, 0.5) 50%, rgba(59, 130, 246, 1) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

.opacity-50 {
  opacity: 0.5;
}

.cursor-not-allowed {
  cursor: not-allowed;
}

.bg-purple-500 {
  background-color: #9b59b6;
}

.bg-purple-600 {
  background-color: #8e44ad;
}

.focus:ring-purple-400 {
  box-shadow: 0 0 0 3px rgba(155, 89, 182, 0.5);
}

.flex {
  display: flex;
  align-items: center;
}

.space-x-1> :not([hidden])~ :not([hidden]) {
  margin-left: 0.25rem;
}

@keyframes progress {
  from { width: 0%; }
  to { width: 100%; }
}

.animate-progress {
  animation: progress 2s linear infinite;
}

</style>