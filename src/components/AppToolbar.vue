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
            <option value="" disabled>Select GitLab URL</option>
            <option v-for="url in sortedGitlabUrls" :key="url.url" :value="url.url">
              {{ url.url }}
            </option>
          </select>

          <select v-model="localSelectedProjectId" class="p-2 border rounded w-64 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            :disabled="!localSelectedGitlabUrl">
            <option value="" disabled>Select Project</option>
            <option v-for="project in sortedSelectedGitlabUrlProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>

          <div class="flex items-center gap-2">
            <select v-model="localSourceBranch" class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              :disabled="!localSelectedProjectId">
              <option value="" disabled>Source</option>
              <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
            <span class="text-gray-600 dark:text-gray-400">→</span>
            <select v-model="localTargetBranch" class="p-2 border rounded w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              :disabled="!localSelectedProjectId">
              <option value="" disabled>Target</option>
              <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>
        </div>

        <!-- Правая часть: Options, Refresh, Theme, User Menu -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Options Dropdown -->
          <div class="relative">
            <button
              @click.stop="showOptionsMenu = !showOptionsMenu"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span class="text-sm font-medium">Options</span>
              <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showOptionsMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <!-- Options Dropdown Menu -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showOptionsMenu"
                @click.stop
                class="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                <!-- Selection Mode -->
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Selection Mode</label>
                  <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" :value="'patch'" v-model="localSelectionMode" @change="$emit('update:selection-mode', 'patch')" class="w-4 h-4 text-blue-600" />
                      <span class="text-sm text-gray-700 dark:text-gray-300">Patch</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" :value="'recentMR'" v-model="localSelectionMode" @change="$emit('update:selection-mode', 'recentMR')" class="w-4 h-4 text-blue-600" />
                      <span class="text-sm text-gray-700 dark:text-gray-300">MR</span>
                    </label>
                  </div>
                </div>

                <!-- Patch Selector -->
                <div v-if="localSelectionMode === 'patch'" class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Patch</label>
                  <div class="relative">
                    <select v-model="localPatchNumber" 
                      class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :disabled="patchesLoading || !localSelectedProjectId">
                      <option value="" disabled>
                        {{ patchesLoading ? 'Загрузка...' : 'Выберите патч' }}
                      </option>
                      <option v-for="patch in patches" :key="patch.key || patch.id" :value="patch.key || patch.id">
                        {{ patch.summary || patch.name || patch.key || patch.id }}
                      </option>
                    </select>
                    <div v-if="patchesLoading" 
                      class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- MR Count Selector -->
                <div v-if="localSelectionMode === 'recentMR'" class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">MR Count</label>
                  <select v-model="localMrCount" 
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    :disabled="!localSelectedProjectId"
                    @change="$emit('update:mr-count', parseInt($event.target.value))">
                    <option value="10">10 MR</option>
                    <option value="25">25 MR</option>
                    <option value="50">50 MR</option>
                  </select>
                </div>

                <!-- Force Refresh -->
                <div class="px-4 py-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="localForceRefresh" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Force Refresh</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 ml-auto" :title="localForceRefresh ? 'Принудительное обновление (игнорирует кеш БД)' : 'Обычное обновление (использует кеш БД)'">
                      ({{ localForceRefresh ? 'ignores cache' : 'uses cache' }})
                    </span>
                  </label>
                </div>
              </div>
            </transition>
          </div>

          <!-- Refresh Button -->
          <button 
            @click="$emit('refresh-table')"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isRefreshDisabled"
            :title="localForceRefresh ? 'Force Refresh' : 'Refresh Table'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span class="text-sm font-medium">Refresh</span>
          </button>

          <!-- Theme Toggle Button -->
          <button
            @click="$emit('update:is-dark-mode', !isDarkMode)"
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Toggle dark mode"
          >
            <svg v-if="!isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>

          <!-- User Menu -->
          <div class="relative" v-if="authStore && authStore.user">
            <button
              @click="$emit('update:show-user-menu', !showUserMenu)"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {{ authStore.user.username.charAt(0).toUpperCase() }}
              </div>
              <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showUserMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showUserMenu"
                  @click.stop
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
                >
                  <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ authStore.user.username }}</p>
                    <p v-if="authStore.user.email" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ authStore.user.email }}</p>
                  </div>
                  <button
                    @click="$emit('go-to-settings')"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Настройки
                  </button>
                  <button
                    @click="$emit('handle-logout')"
                    class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Выйти
                  </button>
                </div>
              </transition>
            </div>
          </div>
        </div>

      <!-- Двухстрочный layout для средних экранов (lg до xl) -->
      <div class="hidden lg:flex xl:hidden flex-col gap-3 p-3">
        <!-- Первая строка: GitLab URL, Project, Source → Target -->
        <div class="flex items-center gap-2 justify-between">
          <select v-model="localSelectedGitlabUrl" class="p-2 border rounded flex-1 min-w-0 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm">
            <option value="" disabled>Select GitLab URL</option>
            <option v-for="url in sortedGitlabUrls" :key="url.url" :value="url.url">
              {{ url.url }}
            </option>
          </select>

          <select v-model="localSelectedProjectId" class="p-2 border rounded flex-1 min-w-0 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
            :disabled="!localSelectedGitlabUrl">
            <option value="" disabled>Select Project</option>
            <option v-for="project in sortedSelectedGitlabUrlProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>

          <div class="flex items-center gap-1 flex-shrink-0">
            <select v-model="localSourceBranch" class="p-2 border rounded w-24 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
              :disabled="!localSelectedProjectId">
              <option value="" disabled>Source</option>
              <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
            <span class="text-gray-600 dark:text-gray-400 text-sm">→</span>
            <select v-model="localTargetBranch" class="p-2 border rounded w-24 dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
              :disabled="!localSelectedProjectId">
              <option value="" disabled>Target</option>
              <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>
        </div>

        <!-- Вторая строка: Options, Refresh, Theme, User Menu -->
        <div class="flex items-center gap-2 justify-end">
          <!-- Options Dropdown -->
          <div class="relative">
            <button
              @click.stop="showOptionsMenu = !showOptionsMenu"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span class="text-xs font-medium">Options</span>
            </button>

            <!-- Options Dropdown Menu -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showOptionsMenu"
                @click.stop
                class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                <!-- Selection Mode -->
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Selection Mode</label>
                  <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" :value="'patch'" v-model="localSelectionMode" @change="$emit('update:selection-mode', 'patch')" class="w-3 h-3 text-blue-600" />
                      <span class="text-xs text-gray-700 dark:text-gray-300">Patch</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" :value="'recentMR'" v-model="localSelectionMode" @change="$emit('update:selection-mode', 'recentMR')" class="w-3 h-3 text-blue-600" />
                      <span class="text-xs text-gray-700 dark:text-gray-300">MR</span>
                    </label>
                  </div>
                </div>

                <!-- Patch Selector -->
                <div v-if="localSelectionMode === 'patch'" class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Patch</label>
                  <div class="relative">
                    <select v-model="localPatchNumber" 
                      class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :disabled="patchesLoading || !localSelectedProjectId">
                      <option value="" disabled>
                        {{ patchesLoading ? 'Загрузка...' : 'Выберите патч' }}
                      </option>
                      <option v-for="patch in patches" :key="patch.key || patch.id" :value="patch.key || patch.id">
                        {{ patch.summary || patch.name || patch.key || patch.id }}
                      </option>
                    </select>
                    <div v-if="patchesLoading" 
                      class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- MR Count Selector -->
                <div v-if="localSelectionMode === 'recentMR'" class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">MR Count</label>
                  <select v-model="localMrCount" 
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    :disabled="!localSelectedProjectId"
                    @change="$emit('update:mr-count', parseInt($event.target.value))">
                    <option value="10">10 MR</option>
                    <option value="25">25 MR</option>
                    <option value="50">50 MR</option>
                  </select>
                </div>

                <!-- Force Refresh -->
                <div class="px-4 py-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="localForceRefresh" class="w-3 h-3 text-blue-600 rounded focus:ring-blue-500" />
                    <span class="text-xs text-gray-700 dark:text-gray-300">Force Refresh</span>
                  </label>
                </div>
              </div>
            </transition>
          </div>

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
            title="Toggle dark mode"
          >
            <svg v-if="!isDarkMode" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>

          <!-- User Menu -->
          <div class="relative" v-if="authStore && authStore.user">
            <button
              @click="$emit('update:show-user-menu', !showUserMenu)"
              class="flex items-center gap-1 px-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                {{ authStore.user.username.charAt(0).toUpperCase() }}
              </div>
              <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showUserMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showUserMenu"
                  @click.stop
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
                >
                  <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ authStore.user.username }}</p>
                    <p v-if="authStore.user.email" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ authStore.user.email }}</p>
                  </div>
                  <button
                    @click="$emit('go-to-settings')"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Настройки
                  </button>
                  <button
                    @click="$emit('handle-logout')"
                    class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Выйти
                  </button>
                </div>
              </transition>
          </div>
        </div>
      </div>

      <!-- Вертикальный layout для узких экранов -->
      <div class="lg:hidden flex flex-col gap-3 p-4">
        <!-- Строка 1: GitLab URL и Project -->
        <div class="flex flex-col sm:flex-row gap-3">
          <select v-model="localSelectedGitlabUrl" class="p-2 border rounded flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option value="" disabled>Select GitLab URL</option>
            <option v-for="url in sortedGitlabUrls" :key="url.url" :value="url.url">
              {{ url.url }}
            </option>
          </select>
          <select v-model="localSelectedProjectId" class="p-2 border rounded flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            :disabled="!localSelectedGitlabUrl">
            <option value="" disabled>Select Project</option>
            <option v-for="project in sortedSelectedGitlabUrlProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>

        <!-- Строка 2: Ветки -->
        <div class="flex items-center gap-2">
          <select v-model="localSourceBranch" class="p-2 border rounded flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            :disabled="!localSelectedProjectId">
            <option value="" disabled>Source Branch</option>
            <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
              {{ branch }}
            </option>
          </select>
          <span class="text-gray-600 dark:text-gray-400">→</span>
          <select v-model="localTargetBranch" class="p-2 border rounded flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            :disabled="!localSelectedProjectId">
            <option value="" disabled>Target Branch</option>
            <option v-for="branch in sortedSelectedProjectBranches" :key="branch" :value="branch">
              {{ branch }}
            </option>
          </select>
        </div>

        <!-- Строка 3: Options, Refresh, Theme, User Menu -->
        <div class="flex items-center gap-2">
          <!-- Options Dropdown -->
          <div class="relative flex-1">
            <button
              @click.stop="showOptionsMenu = !showOptionsMenu"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 w-full justify-between"
            >
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span class="text-sm font-medium">Options</span>
              </div>
              <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showOptionsMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <!-- Options Dropdown Menu -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showOptionsMenu"
                @click.stop
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                <!-- Selection Mode -->
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Selection Mode</label>
                  <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" :value="'patch'" v-model="localSelectionMode" @change="$emit('update:selection-mode', 'patch')" class="w-3 h-3 text-blue-600" />
                      <span class="text-sm text-gray-700 dark:text-gray-300">Patch</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" :value="'recentMR'" v-model="localSelectionMode" @change="$emit('update:selection-mode', 'recentMR')" class="w-3 h-3 text-blue-600" />
                      <span class="text-sm text-gray-700 dark:text-gray-300">MR</span>
                    </label>
                  </div>
                </div>

                <!-- Patch Selector -->
                <div v-if="localSelectionMode === 'patch'" class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Patch</label>
                  <div class="relative">
                    <select v-model="localPatchNumber" 
                      class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :disabled="patchesLoading || !localSelectedProjectId">
                      <option value="" disabled>
                        {{ patchesLoading ? 'Загрузка...' : 'Выберите патч' }}
                      </option>
                      <option v-for="patch in patches" :key="patch.key || patch.id" :value="patch.key || patch.id">
                        {{ patch.summary || patch.name || patch.key || patch.id }}
                      </option>
                    </select>
                    <div v-if="patchesLoading" 
                      class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- MR Count Selector -->
                <div v-if="localSelectionMode === 'recentMR'" class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">MR Count</label>
                  <select v-model="localMrCount" 
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    :disabled="!localSelectedProjectId"
                    @change="$emit('update:mr-count', parseInt($event.target.value))">
                    <option value="10">10 MR</option>
                    <option value="25">25 MR</option>
                    <option value="50">50 MR</option>
                  </select>
                </div>

                <!-- Force Refresh -->
                <div class="px-4 py-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="localForceRefresh" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Force Refresh</span>
                  </label>
                </div>
              </div>
            </transition>
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
            title="Toggle dark mode"
          >
            <svg v-if="!isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>

          <!-- User Menu -->
          <div class="relative flex-shrink-0" v-if="authStore && authStore.user">
            <button
              @click="$emit('update:show-user-menu', !showUserMenu)"
              class="flex items-center gap-1 px-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                {{ authStore.user.username.charAt(0).toUpperCase() }}
              </div>
              <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': showUserMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showUserMenu"
                  @click.stop
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
                >
                  <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ authStore.user.username }}</p>
                    <p v-if="authStore.user.email" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ authStore.user.email }}</p>
                  </div>
                  <button
                    @click="$emit('go-to-settings')"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Настройки
                  </button>
                  <button
                    @click="$emit('handle-logout')"
                    class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Выйти
                  </button>
                </div>
              </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppToolbar',
  data() {
    return {
      showOptionsMenu: false
    };
  },
  mounted() {
    // Закрываем меню при клике вне его
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    handleClickOutside(event) {
      // Закрываем меню Options при клике вне компонента
      if (this.showOptionsMenu && !this.$el.contains(event.target)) {
        this.showOptionsMenu = false;
      }
    }
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
