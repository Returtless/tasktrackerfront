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
    <template v-else>
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

        <!-- Правая часть: Patch, Force Toggle, Refresh, Theme, User Menu -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <div class="relative w-64">
            <select v-model="localPatchNumber" 
              class="p-2 border rounded w-full dark:bg-gray-700 dark:text-white dark:border-gray-600 pr-8"
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
              <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label class="relative flex flex-col items-center cursor-pointer gap-1">
              <input type="checkbox" v-model="localForceRefresh" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap" :title="localForceRefresh ? 'Принудительное обновление (игнорирует кеш БД)' : 'Обычное обновление (использует кеш БД)'">
                {{ localForceRefresh ? '🔥 Force' : '💾 Cache' }}
              </span>
            </label>
          </div>
          
          <button @click="$emit('refresh-table')"
            class="px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors whitespace-nowrap"
            :class="localForceRefresh ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-blue-500 text-white hover:bg-blue-600'"
            :disabled="isRefreshDisabled">
            {{ localForceRefresh ? 'Force Refresh' : 'Refresh Table' }}
          </button>

          <!-- Переключатель темы и ЛК -->
          <div class="flex items-center gap-2">
            <div class="relative">
              <label class="switch" title="Toggle dark mode">
                <input type="checkbox" :checked="isDarkMode" @change="$emit('update:is-dark-mode', $event.target.checked)" />
                <span class="slider"></span>
              </label>
            </div>

            <div class="relative" v-if="authStore && authStore.user">
              <button
                @click="$emit('update:show-user-menu', !showUserMenu)"
                class="flex items-center gap-1 px-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                  {{ authStore.user.username.charAt(0).toUpperCase() }}
                </div>
                <svg class="w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform" :class="{ 'rotate-180': showUserMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <!-- Вторая строка: Patch, Force Toggle, Refresh, Theme, User Menu -->
        <div class="flex items-center gap-2 justify-between">
          <div class="relative flex-1 min-w-0">
            <select v-model="localPatchNumber" 
              class="p-2 border rounded w-full dark:bg-gray-700 dark:text-white dark:border-gray-600 pr-8 text-sm"
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
              <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            </div>
          </div>

          <div class="flex items-center gap-1 flex-shrink-0">
            <label class="relative flex flex-col items-center cursor-pointer gap-1">
              <input type="checkbox" v-model="localForceRefresh" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap" :title="localForceRefresh ? 'Принудительное обновление (игнорирует кеш БД)' : 'Обычное обновление (использует кеш БД)'">
                {{ localForceRefresh ? '🔥 Force' : '💾 Cache' }}
              </span>
            </label>
          </div>
          
          <button @click="$emit('refresh-table')"
            class="px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors whitespace-nowrap text-sm flex-shrink-0"
            :class="localForceRefresh ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-blue-500 text-white hover:bg-blue-600'"
            :disabled="isRefreshDisabled">
            {{ localForceRefresh ? 'Force' : 'Refresh' }}
          </button>

          <!-- Переключатель темы и ЛК -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <div class="relative">
              <label class="switch" title="Toggle dark mode">
                <input type="checkbox" :checked="isDarkMode" @change="$emit('update:is-dark-mode', $event.target.checked)" />
                <span class="slider"></span>
              </label>
            </div>

            <div class="relative" v-if="authStore && authStore.user">
              <button
                @click="$emit('update:show-user-menu', !showUserMenu)"
                class="flex items-center gap-1 px-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                  {{ authStore.user.username.charAt(0).toUpperCase() }}
                </div>
                <svg class="w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform" :class="{ 'rotate-180': showUserMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <!-- Строка 3: Patch, Theme, User Menu -->
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <select v-model="localPatchNumber" 
              class="p-2 border rounded w-full dark:bg-gray-700 dark:text-white dark:border-gray-600 pr-8"
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
              <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            </div>
          </div>

          <!-- Переключатель темы и ЛК -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <div class="relative">
              <label class="switch" title="Toggle dark mode">
                <input type="checkbox" :checked="isDarkMode" @change="$emit('update:is-dark-mode', $event.target.checked)" />
                <span class="slider"></span>
              </label>
            </div>

            <div class="relative" v-if="authStore && authStore.user">
              <button
                @click="$emit('update:show-user-menu', !showUserMenu)"
                class="flex items-center gap-1 px-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                  {{ authStore.user.username.charAt(0).toUpperCase() }}
                </div>
                <svg class="w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform" :class="{ 'rotate-180': showUserMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <!-- Строка 4: Force Toggle и Refresh -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <label class="relative flex flex-col items-center cursor-pointer gap-1">
              <input type="checkbox" v-model="localForceRefresh" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {{ localForceRefresh ? '🔥 Force' : '💾 Cache' }}
              </span>
            </label>
          </div>
          
          <button @click="$emit('refresh-table')"
            class="flex-1 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
            :class="localForceRefresh ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-blue-500 text-white hover:bg-blue-600'"
            :disabled="isRefreshDisabled">
            {{ localForceRefresh ? 'Force Refresh' : 'Refresh Table' }}
          </button>
        </div>
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

/* Switch toggle styles */
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
</style>
