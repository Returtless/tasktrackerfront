<!-- src/components/CommitsPage.vue -->
<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <!-- Переключатель темы -->
    <div class="fixed top-2 right-2">
      <label class="switch">
        <input type="checkbox" v-model="isDarkMode" />
        <span class="slider"></span>
      </label>
    </div>

    <!-- Подкомпонент панели инструментов -->
    <AppToolbar
      :is-settings-loading="isSettingsLoading"
      :settings="settings"
      v-model:selectedGitlabUrl="selectedGitlabUrl"
      v-model:selectedProjectId="selectedProjectId"
      v-model:sourceBranch="sourceBranch"
      v-model:targetBranch="targetBranch"
      v-model:patchNumber="patchNumber"
      v-model:startDate="startDate"
      :is-refresh-disabled="isRefreshDisabled"
      @refresh-table="refreshTable"
      @toggle-date-sort="toggleDateSort"
    />

    <!-- Подкомпонент таблицы коммитов -->
    <CommitsTable
      :tasks-store="tasksStore"
      :filtered-tasks-without-target-commits="filteredTasksWithoutTargetCommits"
      v-model:selectedAuthors="selectedAuthors"
      :sort-direction="sortDirection"
      @toggle-commit-selection="handleToggleCommitSelection"
      @cherry-pick-request="handleCherryPickRequest"
      @cherry-pick-list="handleCherryPickList"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useTasksStore } from '@/stores/commitsStore';
import AppToolbar from './AppToolbar.vue';
import CommitsTable from './CommitsTable.vue';

export default {
  name: 'CommitsPage',
  components: { AppToolbar, CommitsTable },
  setup() {
    const tasksStore = useTasksStore();

    // Состояния для AppToolbar
    const settings = ref({ gitlabUrls: [] });
    const selectedGitlabUrl = ref('');
    const selectedProjectId = ref('');
    const sourceBranch = ref('');
    const targetBranch = ref('');
    const patchNumber = ref('');
    const startDate = ref('');
    const isSettingsLoading = ref(true);
    const isDarkMode = ref(false);

    // Дополнительные состояния
    const selectedAuthors = ref([]);
    const sortDirection = ref({ date: 'asc' });

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
      // Можно использовать getter из store или свою логику
      return tasksStore.masterTasks;
    });

    // Методы
    const refreshTable = async () => {
      try {
        tasksStore.loading = true;
        await tasksStore.fetchCommits({
          gitlabUrl: selectedGitlabUrl.value,
          projectId: selectedProjectId.value,
          sourceBranch: sourceBranch.value,
          targetBranch: targetBranch.value,
          patchNumber: patchNumber.value,
          startDate: startDate.value,
        });
      } catch (error) {
        console.error('Error refreshing table:', error);
      } finally {
        tasksStore.loading = false;
      }
    };

    const toggleDateSort = () => {
      sortDirection.value.date = sortDirection.value.date === 'asc' ? 'desc' : 'asc';
    };

    // Обработчик события toggle-commit-selection
    const handleToggleCommitSelection = (mrNumber) => {
      tasksStore.toggleCommitSelection(mrNumber);
    };

    // Обработчик события cherry-pick-request
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

    // Обработчик события cherry-pick-list
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

    onMounted(async () => {
      try {
        isSettingsLoading.value = true;
        settings.value = await tasksStore.fetchSettings();
        tasksStore.subscribeToTaskStatus();
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        isSettingsLoading.value = false;
      }
    });

    return {
      tasksStore,
      settings,
      selectedGitlabUrl,
      selectedProjectId,
      sourceBranch,
      targetBranch,
      patchNumber,
      startDate,
      isSettingsLoading,
      isDarkMode,
      selectedAuthors,
      sortDirection,
      isRefreshDisabled,
      filteredTasksWithoutTargetCommits,
      refreshTable,
      toggleDateSort,
      handleToggleCommitSelection,
      handleCherryPickRequest,
      handleCherryPickList,
    };
  },
};
</script>

<style>
/* Глобальные стили можно разместить здесь */
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.dark body {
  background-color: #121212;
  color: #ffffff;
}

/* Стили переключателя темы */
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
</style>
