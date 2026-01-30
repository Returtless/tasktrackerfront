<!-- src/components/AppToolbar.vue -->
<template>
  <div class="toolbar flex flex-wrap justify-between items-center p-4 bg-gray-200 dark:bg-gray-800 shadow-lg gap-4 relative">
    <!-- Индикатор загрузки настроек -->
    <div v-if="isSettingsLoading" class="w-full">
      <div class="relative h-2 bg-gray-300 dark:bg-gray-700 rounded">
        <div class="absolute h-full bg-blue-500 dark:bg-blue-400 rounded animate-loading" style="width: 100%;"></div>
      </div>
    </div>
    <!-- Основной блок, когда настройки загружены -->
    <template v-else>
      <div class="flex flex-wrap items-center gap-4">
        <!-- Выбор GitLab URL -->
        <select v-model="localSelectedGitlabUrl" class="p-2 border rounded w-64 dark:bg-gray-700 dark:text-white">
          <option value="" disabled>Select GitLab URL</option>
          <option v-for="url in sortedGitlabUrls" :key="url.url" :value="url.url">
            {{ url.url }}
          </option>
        </select>

        <!-- Выбор проекта -->
        <select v-model="localSelectedProjectId" class="p-2 border rounded w-64 dark:bg-gray-700 dark:text-white"
          :disabled="!localSelectedGitlabUrl">
          <option value="" disabled>Select Project</option>
          <option v-for="project in sortedSelectedGitlabUrlProjects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>

        <!-- Выбор веток -->
        <select v-model="localSourceBranch" class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white"
          :disabled="!localSelectedProjectId">
          <option value="" disabled>Select Source Branch</option>
          <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
            {{ branch }}
          </option>
        </select>
        <span class="text-gray-600 dark:text-gray-400">→</span>
        <select v-model="localTargetBranch" class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white"
          :disabled="!localSelectedProjectId">
          <option value="" disabled>Select Target Branch</option>
          <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
            {{ branch }}
          </option>
        </select>
      </div>

      <!-- Поля Patch Number и кнопка Refresh -->
      <div class="flex items-center gap-4">
        <div class="relative w-64">
          <select v-model="localPatchNumber" 
            class="p-2 border rounded w-full dark:bg-gray-700 dark:text-white pr-8"
            :disabled="patchesLoading || !selectedProjectId">
            <option value="" disabled>
              {{ patchesLoading ? 'Загрузка патчей...' : 'Выберите патч' }}
            </option>
            <option v-for="patch in patches" :key="patch.key" :value="patch.key">
              {{ patch.summary || patch.key }}
            </option>
          </select>
          <!-- Индикатор загрузки -->
          <div v-if="patchesLoading" 
            class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
        </div>
        
        <!-- Toggle для Force Refresh -->
        <div class="flex items-center gap-2">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="localForceRefresh" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
            <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap" :title="localForceRefresh ? 'Принудительное обновление (игнорирует кеш БД)' : 'Обычное обновление (использует кеш БД)'">
              {{ localForceRefresh ? '🔥 Force' : '💾 Cache' }}
            </span>
          </label>
        </div>
        
        <button @click="$emit('refresh-table')"
          class="refresh-button px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          :class="localForceRefresh ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-blue-500 text-white hover:bg-blue-600'"
          :disabled="isRefreshDisabled">
          {{ localForceRefresh ? 'Force Refresh' : 'Refresh Table' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'AppToolbar',
  props: {
    isSettingsLoading: {
      type: Boolean,
      required: true
    },
    settings: {
      type: Object,
      required: true
    },
    selectedGitlabUrl: {
      type: String,
      required: true
    },
    selectedProjectId: {
      type: String,
      required: true
    },
    sourceBranch: {
      type: String,
      required: true
    },
    targetBranch: {
      type: String,
      required: true
    },
    patchNumber: {
      type: String,
      required: true
    },
    forceRefresh: {
      type: Boolean,
      default: false
    },
    isRefreshDisabled: {
      type: Boolean,
      required: true
    },
    patches: {
      type: Array,
      default: () => []
    },
    patchesLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    // Двусторонняя привязка для пропсов
    localSelectedGitlabUrl: {
      get() {
        return this.selectedGitlabUrl;
      },
      set(val) {
        this.$emit('update:selectedGitlabUrl', val);
      }
    },
    localSelectedProjectId: {
      get() {
        return this.selectedProjectId;
      },
      set(val) {
        this.$emit('update:selectedProjectId', val);
      }
    },
    localSourceBranch: {
      get() {
        return this.sourceBranch;
      },
      set(val) {
        this.$emit('update:sourceBranch', val);
      }
    },
    localTargetBranch: {
      get() {
        return this.targetBranch;
      },
      set(val) {
        this.$emit('update:targetBranch', val);
      }
    },
    localPatchNumber: {
      get() {
        return this.patchNumber;
      },
      set(val) {
        this.$emit('update:patchNumber', val);
      }
    },
    localForceRefresh: {
      get() {
        return this.forceRefresh;
      },
      set(val) {
        this.$emit('update:forceRefresh', val);
      }
    },

    // Отсортированные массивы для комбобоксов
    sortedGitlabUrls() {
      if (!this.settings || !this.settings.gitlabUrls) return [];
      return this.settings.gitlabUrls.slice().sort((a, b) =>
        a.url.localeCompare(b.url)
      );
    },
    sortedSelectedGitlabUrlProjects() {
      const urlData = this.settings.gitlabUrls.find(
        url => url.url === this.selectedGitlabUrl
      );
      if (!urlData || !urlData.projects) return [];
      return urlData.projects.slice().sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    },
    sortedSelectedProjectBranches() {
      const projects = this.sortedSelectedGitlabUrlProjects;
      const projectData = projects.find(
        proj => proj.id === this.selectedProjectId
      );
      if (!projectData || !projectData.branches) return [];
      return projectData.branches.slice().sort((a, b) =>
        a.localeCompare(b)
      );
    }
  }
};
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
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
</style>
