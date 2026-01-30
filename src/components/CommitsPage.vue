<template>
  <!-- Темная тема, как у вас -->
  <div :class="isDarkMode ? 'dark' : ''">
    <!-- Фон и мин-высота -->
    <div class="min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 relative">

      <div class="w-full max-w-full px-2 sm:px-4 lg:px-6 xl:px-8">
        <div class="sticky top-0 z-40 bg-gray-200 dark:bg-gray-800 shadow-lg">
          <AppToolbar 
            :is-settings-loading="isSettingsLoading" 
            :settings="settings"
            v-model:selectedGitlabUrl="selectedGitlabUrl" 
            v-model:selectedProjectId="selectedProjectId"
            v-model:sourceBranch="sourceBranch" 
            v-model:targetBranch="targetBranch" 
            v-model:patchNumber="patchNumber"
            v-model:forceRefresh="forceRefresh"
            :is-refresh-disabled="isRefreshDisabled" 
            :patches="tasksStore.patches" 
            :patches-loading="tasksStore.patchesLoading"
            :is-dark-mode="isDarkMode"
            @update:is-dark-mode="isDarkMode = $event"
            :show-user-menu="showUserMenu"
            @update:show-user-menu="showUserMenu = $event"
            :auth-store="authStore"
            @go-to-settings="goToSettings"
            @handle-logout="handleLogout"
            @refresh-table="refreshTable" />
        </div>
        
        <!-- Клик вне меню для закрытия (для меню в тулбаре) -->
        <div v-if="showUserMenu" @click="showUserMenu = false" class="fixed inset-0 z-30"></div>

        <div class="w-full max-w-full px-2 sm:px-4 lg:px-6 xl:px-8">
          <CommitsTable :tasks-store="tasksStore"
            :filtered-tasks-without-target-commits="filteredTasksWithoutTargetCommits"
            v-model:selectedAuthors="selectedAuthors" :sort-direction="sortDirection"
            @toggle-commit-selection="handleToggleCommitSelection" @cherry-pick-request="handleCherryPickRequest"
            @cherry-pick-list="handleCherryPickList" @toggle-mr-number-sort="toggleMrNumberSort" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTasksStore } from '@/stores/commitsStore';
import { useAuthStore } from '@/stores/authStore';
import AppToolbar from './AppToolbar.vue';
import CommitsTable from './CommitsTable.vue';

export default {
  name: 'CommitsPage',
  components: { AppToolbar, CommitsTable },
  setup() {
    const router = useRouter();
    const tasksStore = useTasksStore();
    const authStore = useAuthStore();

    // Состояние для меню пользователя
    const showUserMenu = ref(false);

    // Методы для меню пользователя
    const goToSettings = () => {
      showUserMenu.value = false;
      router.push('/settings');
    };

    const handleLogout = async () => {
      showUserMenu.value = false;
      await authStore.logout();
    };

    // Router guard уже проверит аутентификацию, здесь просто инициализируем данные

    // Состояния для AppToolbar
    const settings = ref({ gitlabUrls: [] });
    const selectedGitlabUrl = ref('');
    const selectedProjectId = ref('');
    const sourceBranch = ref('');
    const targetBranch = ref('');
    const patchNumber = ref('');
    const forceRefresh = ref(false); // Принудительное обновление без кеша БД
    const isSettingsLoading = ref(true);
    const isDarkMode = ref(false);

    // Дополнительные состояния
    const selectedAuthors = ref([]);
    const sortDirection = ref({ mrNumber: null }); // null означает, что сортировка по MR не включена

    const isRefreshDisabled = computed(() => {
      return (
        isSettingsLoading.value ||
        !selectedGitlabUrl.value ||
        !selectedProjectId.value ||
        !sourceBranch.value ||
        !targetBranch.value
      );
    });

    // Пример вычисляемого свойства для фильтрации задач
    const filteredTasksWithoutTargetCommits = computed(() => {
      return tasksStore.masterTasks;
    });

    // Функция для извлечения ключа проекта из имени проекта
    const extractProjectKey = (projectName) => {
      if (!projectName) return 'SPPDEV';
      // Если имя содержит дефис, берем часть до дефиса
      let projectKey = projectName.includes('-') 
        ? projectName.split('-')[0] 
        : projectName;
      
      // Костыль: в GitLab проект называется SPS, а в Jira - SPPDEV
      // Поэтому нужно преобразовать SPS -> SPPDEV для запросов к Jira
      if (projectKey === 'SPS') {
        return 'SPPDEV';
      }
      
      return projectKey;
    };

    // Получаем ключ проекта из выбранного проекта
    const selectedProjectKey = computed(() => {
      if (!selectedProjectId.value || !settings.value.gitlabUrls) return 'SPPDEV';
      
      const urlData = settings.value.gitlabUrls.find(
        url => url.url === selectedGitlabUrl.value
      );
      if (!urlData || !urlData.projects) return 'SPPDEV';
      
      const project = urlData.projects.find(
        proj => proj.id === selectedProjectId.value
      );
      if (!project || !project.name) return 'SPPDEV';
      
      return extractProjectKey(project.name);
    });

    // Методы
    const refreshTable = async () => {
      try {
        tasksStore.loading = true;
        if (forceRefresh.value) {
          console.log('Sending request with patchNumber:', patchNumber.value, '(FORCE REFRESH mode)');
        } else {
          console.log('Sending request with patchNumber:', patchNumber.value);
        }
        await tasksStore.fetchCommits({
          gitlabUrl: selectedGitlabUrl.value,
          projectId: selectedProjectId.value,
          sourceBranch: sourceBranch.value,
          targetBranch: targetBranch.value,
          patchNumber: patchNumber.value,
          forceRefresh: forceRefresh.value, // Передаем флаг принудительного обновления
        });
      } catch (error) {
        console.error('Error refreshing table:', error);
      } finally {
        tasksStore.loading = false;
      }
    };

    const toggleMrNumberSort = () => {
      // Создаем новый объект для гарантии реактивности
      // Переключаем между тремя состояниями: null -> 'asc' -> 'desc' -> null
      let newDirection;
      if (sortDirection.value.mrNumber === null) {
        newDirection = 'asc';
      } else if (sortDirection.value.mrNumber === 'asc') {
        newDirection = 'desc';
      } else {
        newDirection = null; // Возврат к обычному режиму
      }
      
      sortDirection.value = {
        ...sortDirection.value,
        mrNumber: newDirection
      };
    };

    const handleToggleCommitSelection = (mrNumber) => {
      tasksStore.toggleCommitSelection(mrNumber);
    };

    const handleCherryPickRequest = (mrNumber, taskKey) => {
      tasksStore.sendCherryPickRequest({
        gitlabUrl: selectedGitlabUrl.value,
        projectId: selectedProjectId.value,
        branchFrom: sourceBranch.value,
        branchTo: targetBranch.value,
        mrNumber,
        taskKey,
      });
    };

    const handleCherryPickList = () => {
      const mrNumbers = Array.from(tasksStore.selectedCommits);
      tasksStore.sendCherryPickList({
        gitlabUrl: selectedGitlabUrl.value,
        projectId: selectedProjectId.value,
        branchFrom: sourceBranch.value,
        branchTo: targetBranch.value,
        mrNumbers,
      });
    };

    watch(isDarkMode, (newVal) => {
      document.body.classList.toggle('dark', newVal);
    });

    // Получаем список веток для выбранного проекта
    const availableBranches = computed(() => {
      if (!selectedProjectId.value || !settings.value.gitlabUrls) return [];
      
      const urlData = settings.value.gitlabUrls.find(
        url => url.url === selectedGitlabUrl.value
      );
      if (!urlData || !urlData.projects) return [];
      
      const project = urlData.projects.find(
        proj => proj.id === selectedProjectId.value
      );
      if (!project || !project.branches) return [];
      
      return project.branches;
    });

    // Автоматически выбираем ветки master и release, когда появляются ветки проекта
    watch(availableBranches, (branches) => {
      if (!branches || branches.length === 0) return;

      // Ищем ветку "master" для sourceBranch (только если ещё не выбрана)
      if (!sourceBranch.value && branches.includes('master')) {
        sourceBranch.value = 'master';
      }

      // Ищем ветку "release" для targetBranch (только если ещё не выбрана)
      if (!targetBranch.value && branches.includes('release')) {
        targetBranch.value = 'release';
      }
    });

    // Перезагружаем патчи при изменении проекта или веток
    watch(selectedProjectKey, async (newProjectKey) => {
      if (newProjectKey && selectedProjectId.value && !isSettingsLoading.value) {
        await tasksStore.fetchPatches(newProjectKey);
      }
    });

    // Также загружаем патчи при выборе веток (на случай, если проект уже был выбран)
    watch([sourceBranch, targetBranch], async ([newSourceBranch, newTargetBranch]) => {
      if (newSourceBranch && newTargetBranch && selectedProjectKey.value && !isSettingsLoading.value) {
        // Загружаем патчи, если они еще не загружены
        if (tasksStore.patches.length === 0 && !tasksStore.patchesLoading) {
          await tasksStore.fetchPatches(selectedProjectKey.value);
        }
      }
    });

    onMounted(async () => {
      try {
        isSettingsLoading.value = true;
        settings.value = await tasksStore.fetchSettings();
        tasksStore.subscribeToTaskStatus();
        // Загружаем патчи из Jira с ключом проекта по умолчанию
        await tasksStore.fetchPatches('SPPDEV');
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        isSettingsLoading.value = false;
      }
    });

    return {
      authStore,
      tasksStore,
      settings,
      selectedGitlabUrl,
      selectedProjectId,
      sourceBranch,
      targetBranch,
      patchNumber,
      forceRefresh,
      isSettingsLoading,
      isDarkMode,
      selectedAuthors,
      sortDirection,
      isRefreshDisabled,
      filteredTasksWithoutTargetCommits,
      showUserMenu,
      goToSettings,
      handleLogout,
      refreshTable,
      toggleMrNumberSort,
      handleToggleCommitSelection,
      handleCherryPickRequest,
      handleCherryPickList,
    };
  },
};
</script>

<style>
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.dark body {
  background-color: #121212;
  color: #ffffff;
}

/* Переключатель темы */
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
</style>
