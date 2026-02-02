<!-- src/components/AppToolbar.vue -->
<template>
  <div class="toolbar bg-gray-200 dark:bg-gray-800 shadow-lg">
    <!-- Индикатор загрузки настроек -->
    <div v-if="isSettingsLoading" class="w-full p-4">
      <div class="relative h-2 bg-gray-300 dark:bg-gray-700 rounded">
        <div class="absolute h-full bg-blue-500 dark:bg-blue-400 rounded animate-loading" style="width: 100%;"></div>
      </div>
    </div>
    <!-- Основной блок, когда настройки загружены -->
    <div v-else>
      <!-- Горизонтальный layout для широких экранов (xl и выше) -->
      <div class="hidden xl:flex items-center justify-between gap-4 p-4">
        <!-- Левая часть: селекторы -->
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <select v-model="localSelectedGitlabUrl" class="p-2 border rounded w-64 dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option value="" disabled>{{ $t('toolbar.selectGitlabUrl') }}</option>
            <option v-for="url in sortedGitlabUrls" :key="url.url" :value="url.url">
              {{ url.url }}
            </option>
          </select>

          <select v-model="localSelectedProjectId" class="p-2 border rounded w-64 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            :disabled="!localSelectedGitlabUrl">
            <option value="" disabled>{{ $t('toolbar.selectProject') }}</option>
            <option v-for="project in sortedSelectedGitlabUrlProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>

          <div class="flex items-center gap-2">
            <select v-model="localSourceBranch" class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              :disabled="!localSelectedProjectId">
              <option value="" disabled>{{ $t('toolbar.source') }}</option>
              <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
            <span class="text-gray-600 dark:text-gray-400">→</span>
            <select v-model="localTargetBranch" class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              :disabled="!localSelectedProjectId">
              <option value="" disabled>{{ $t('toolbar.target') }}</option>
              <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>
        </div>

        <!-- Правая часть: Options, Refresh, Theme, User Menu -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Options Dropdown -->
          <OptionsMenu
            :is-open="showOptionsMenu"
            :selection-mode="localSelectionMode"
            :patch-number="localPatchNumber"
            :mr-count="localMrCount"
            :force-refresh="localForceRefresh"
            :patches="patches"
            :patches-loading="patchesLoading"
            :selected-project-id="localSelectedProjectId"
            size="xl"
            @toggle-menu="showOptionsMenu = !showOptionsMenu"
            @update:selection-mode="$emit('update:selection-mode', $event)"
            @update:patch-number="$emit('update:patchNumber', $event)"
            @update:mr-count="$emit('update:mr-count', $event)"
            @update:force-refresh="$emit('update:forceRefresh', $event)"
          />

          <!-- Refresh Button -->
          <button 
            @click="$emit('refresh-table')"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isRefreshDisabled"
            :title="localForceRefresh ? $t('toolbar.forceRefresh') : $t('toolbar.refreshTable')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span class="text-sm font-medium">{{ $t('toolbar.refresh') }}</span>
          </button>

          <!-- Theme Toggle Button -->
          <button
            @click="$emit('update:is-dark-mode', !isDarkMode)"
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            :title="$t('toolbar.darkTheme')"
          >
            <svg v-if="!isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>

          <!-- User Menu -->
          <UserMenu
            :is-open="showUserMenu"
            :auth-store="authStore"
            size="xl"
            @toggle-menu="$emit('update:show-user-menu', !showUserMenu)"
            @go-to-settings="$emit('go-to-settings')"
            @handle-logout="$emit('handle-logout')"
          />
        </div>
        </div>

      <!-- Двухстрочный layout для средних экранов (lg до xl) -->
      <div class="hidden lg:flex xl:hidden flex-col gap-3 p-3">
        <!-- Первая строка: GitLab URL, Project, Source → Target -->
        <div class="flex items-center gap-2 justify-between">
          <select v-model="localSelectedGitlabUrl" class="p-2 border rounded flex-1 min-w-0 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm">
            <option value="" disabled>{{ $t('toolbar.selectGitlabUrl') }}</option>
            <option v-for="url in sortedGitlabUrls" :key="url.url" :value="url.url">
              {{ url.url }}
            </option>
          </select>

          <select v-model="localSelectedProjectId" class="p-2 border rounded flex-1 min-w-0 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
            :disabled="!localSelectedGitlabUrl">
            <option value="" disabled>{{ $t('toolbar.selectProject') }}</option>
            <option v-for="project in sortedSelectedGitlabUrlProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>

          <div class="flex items-center gap-1 flex-shrink-0">
            <select v-model="localSourceBranch" class="p-2 border rounded w-24 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
              :disabled="!localSelectedProjectId">
              <option value="" disabled>{{ $t('toolbar.source') }}</option>
              <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
            <span class="text-gray-600 dark:text-gray-400 text-sm">→</span>
            <select v-model="localTargetBranch" class="p-2 border rounded w-24 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
              :disabled="!localSelectedProjectId">
              <option value="" disabled>{{ $t('toolbar.target') }}</option>
              <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>
        </div>

        <!-- Вторая строка: Options, Refresh, Theme, User Menu -->
        <div class="flex items-center gap-2 justify-end">
          <!-- Options Dropdown -->
          <OptionsMenu
            :is-open="showOptionsMenu"
            :selection-mode="localSelectionMode"
            :patch-number="localPatchNumber"
            :mr-count="localMrCount"
            :force-refresh="localForceRefresh"
            :patches="patches"
            :patches-loading="patchesLoading"
            :selected-project-id="localSelectedProjectId"
            size="lg"
            @toggle-menu="showOptionsMenu = !showOptionsMenu"
            @update:selection-mode="$emit('update:selection-mode', $event)"
            @update:patch-number="$emit('update:patchNumber', $event)"
            @update:mr-count="$emit('update:mr-count', $event)"
            @update:force-refresh="$emit('update:forceRefresh', $event)"
          />

          <!-- Refresh Button -->
          <button 
            @click="$emit('refresh-table')"
            class="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            :disabled="isRefreshDisabled"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span class="text-xs font-medium">Refresh</span>
          </button>

          <!-- Theme Toggle Button -->
          <button
            @click="$emit('update:is-dark-mode', !isDarkMode)"
            class="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            :title="$t('toolbar.darkTheme')"
          >
            <svg v-if="!isDarkMode" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>

          <!-- User Menu -->
          <UserMenu
            :is-open="showUserMenu"
            :auth-store="authStore"
            size="lg"
            @toggle-menu="$emit('update:show-user-menu', !showUserMenu)"
            @go-to-settings="$emit('go-to-settings')"
            @handle-logout="$emit('handle-logout')"
          />
        </div>
      </div>

      <!-- Вертикальный layout для узких экранов -->
      <div class="lg:hidden flex flex-col gap-3 p-4">
        <!-- Строка 1: GitLab URL и Project -->
        <div class="flex flex-col sm:flex-row gap-3">
          <select v-model="localSelectedGitlabUrl" class="p-2 border rounded flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option value="" disabled>{{ $t('toolbar.selectGitlabUrl') }}</option>
            <option v-for="url in sortedGitlabUrls" :key="url.url" :value="url.url">
              {{ url.url }}
            </option>
          </select>
          <select v-model="localSelectedProjectId" class="p-2 border rounded flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            :disabled="!localSelectedGitlabUrl">
            <option value="" disabled>{{ $t('toolbar.selectProject') }}</option>
            <option v-for="project in sortedSelectedGitlabUrlProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>

        <!-- Строка 2: Ветки -->
        <div class="flex items-center gap-2">
          <select v-model="localSourceBranch" class="p-2 border rounded flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            :disabled="!localSelectedProjectId">
            <option value="" disabled>{{ $t('toolbar.source') }}</option>
            <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
              {{ branch }}
            </option>
          </select>
          <span class="text-gray-600 dark:text-gray-400">→</span>
          <select v-model="localTargetBranch" class="p-2 border rounded flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            :disabled="!localSelectedProjectId">
            <option value="" disabled>{{ $t('toolbar.target') }}</option>
            <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
              {{ branch }}
            </option>
          </select>
        </div>

        <!-- Строка 3: Options, Refresh, Theme, User Menu -->
        <div class="flex items-center gap-2">
          <!-- Options Dropdown -->
          <div class="relative flex-1">
            <OptionsMenu
              :is-open="showOptionsMenu"
              :selection-mode="localSelectionMode"
              :patch-number="localPatchNumber"
              :mr-count="localMrCount"
              :force-refresh="localForceRefresh"
              :patches="patches"
              :patches-loading="patchesLoading"
              :selected-project-id="localSelectedProjectId"
              size="mobile"
              @toggle-menu="showOptionsMenu = !showOptionsMenu"
              @update:selection-mode="$emit('update:selection-mode', $event)"
              @update:patch-number="$emit('update:patchNumber', $event)"
              @update:mr-count="$emit('update:mr-count', $event)"
              @update:force-refresh="$emit('update:forceRefresh', $event)"
            />
          </div>

          <!-- Refresh Button -->
          <button 
            @click="$emit('refresh-table')"
            class="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            :disabled="isRefreshDisabled"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>

          <!-- Theme Toggle Button -->
          <button
            @click="$emit('update:is-dark-mode', !isDarkMode)"
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            :title="$t('toolbar.darkTheme')"
          >
            <svg v-if="!isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>

          <!-- User Menu -->
          <UserMenu
            :is-open="showUserMenu"
            :auth-store="authStore"
            size="mobile"
            @toggle-menu="$emit('update:show-user-menu', !showUserMenu)"
            @go-to-settings="$emit('go-to-settings')"
            @handle-logout="$emit('handle-logout')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import OptionsMenu from './OptionsMenu.vue';
import UserMenu from './UserMenu.vue';

export default {
  name: 'AppToolbar',
  components: {
    OptionsMenu,
    UserMenu
  },
  data() {
    return {
      showOptionsMenu: false
    };
  },
  methods: {
    handleClickOutside(event) {
      // Закрываем меню Options при клике вне компонента
      if (this.showOptionsMenu && !this.$el.contains(event.target)) {
        this.showOptionsMenu = false;
      }
    }
  },
  mounted() {
    // Закрываем меню при клике вне его
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
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
    },
    isDarkMode: {
      type: Boolean,
      default: false
    },
    showUserMenu: {
      type: Boolean,
      default: false
    },
    authStore: {
      type: Object,
      default: null
    },
    selectionMode: {
      type: String,
      default: 'patch'
    },
    mrCount: {
      type: Number,
      default: 10
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
    localSelectionMode: {
      get() {
        return this.selectionMode;
      },
      set(val) {
        this.$emit('update:selection-mode', val);
      }
    },
    localMrCount: {
      get() {
        return this.mrCount;
      },
      set(val) {
        this.$emit('update:mr-count', val);
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
