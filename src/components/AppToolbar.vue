<!-- src/components/AppToolbar.vue -->
<template>
  <div class="toolbar flex flex-wrap justify-between items-center p-4 bg-gray-200 dark:bg-gray-800 shadow-lg gap-4">
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

      <!-- Поля Patch Number, Start Date и кнопка Refresh -->
      <div class="flex items-center gap-4">
        <input type="text" v-model="localPatchNumber" placeholder="Patch Number"
          class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white" />
        <input type="date" v-model="localStartDate" class="p-2 border rounded w-40 dark:bg-gray-700 dark:text-white" />
        <button @click="$emit('refresh-table')"
          class="refresh-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          :disabled="isRefreshDisabled">
          Refresh Table
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
    startDate: {
      type: String,
      required: true
    },
    isRefreshDisabled: {
      type: Boolean,
      required: true
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
    localStartDate: {
      get() {
        return this.startDate;
      },
      set(val) {
        this.$emit('update:startDate', val);
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
