<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <div class="min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-2xl mx-auto">
          <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Settings</h1>

          <!-- GitLab Instances -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">GitLab Instances</h2>
              <div class="flex gap-2">
                <button
                  @click="syncGitlabProjects"
                  :disabled="settingsStore.isSyncing || settingsStore.isLoading"
                  class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sync projects from GitLab"
                >
                  {{ settingsStore.isSyncing ? 'Syncing...' : '🔄 Sync Projects' }}
                </button>
                <button
                  @click="showAddGitlabForm = true"
                  class="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  + Add GitLab Instance
                </button>
              </div>
            </div>

            <!-- Список GitLab инстансов -->
            <div v-if="settingsStore.gitlabInstances.length === 0" class="text-gray-500 dark:text-gray-400 text-sm py-4">
              No GitLab instances configured. Click "Add GitLab Instance" to add one.
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="instance in settingsStore.gitlabInstances"
                :key="instance.instanceId"
                class="border border-gray-300 dark:border-gray-600 rounded-lg p-4"
              >
                <div v-if="editingInstanceId !== instance.instanceId" class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="font-semibold text-gray-900 dark:text-white mb-2">{{ instance.gitlabUrl }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      Token: {{ instance.token }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Created: {{ formatDate(instance.createdAt) }}
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      @click="startEditInstance(instance)"
                      :disabled="settingsStore.isSyncing"
                      class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteInstance(instance.instanceId)"
                      :disabled="settingsStore.isSyncing"
                      class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <!-- Форма редактирования -->
                <div v-else class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      GitLab URL
                    </label>
                    <input
                      v-model="editInstanceForm.gitlabUrl"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="https://gitlab.example.com"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Token
                    </label>
                    <input
                      v-model="editInstanceForm.token"
                      type="password"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Enter new token or leave empty to keep current"
                    />
                  </div>
                  <div class="flex gap-2">
                    <button
                      @click="saveEditInstance(instance.instanceId)"
                      :disabled="settingsStore.isSyncing"
                      class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                    <button
                      @click="cancelEditInstance"
                      :disabled="settingsStore.isSyncing"
                      class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Форма добавления нового инстанса -->
            <div v-if="showAddGitlabForm" class="mt-4 border-t border-gray-300 dark:border-gray-600 pt-4">
              <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Add New GitLab Instance</h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GitLab URL
                  </label>
                  <input
                    v-model="newInstanceForm.gitlabUrl"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://gitlab.example.com"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Token
                  </label>
                  <input
                    v-model="newInstanceForm.token"
                    type="password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="glpat-..."
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Create a personal access token in GitLab with "api" scope
                  </p>
                </div>
                <div class="flex gap-2">
                <button
                  @click="addNewInstance"
                  :disabled="!newInstanceForm.gitlabUrl || !newInstanceForm.token || settingsStore.isSyncing"
                  class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Instance
                </button>
                <button
                  @click="cancelAddInstance"
                  :disabled="settingsStore.isSyncing"
                  class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                </div>
              </div>
            </div>
          </div>

          <!-- App Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Application Settings</h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jira URL
                </label>
                <input
                  v-model="appSettingsForm.jiraUrl"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://job-jira.otr.ru/rest/api/2"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jira Auth Token
                  <span v-if="hasJiraToken" class="ml-2 text-xs text-green-600 dark:text-green-400">
                    (Token is saved)
                  </span>
                </label>
                <input
                  v-model="appSettingsForm.jiraAuth"
                  type="password"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :placeholder="hasJiraToken ? 'Enter new token to update (leave empty to keep current)' : 'Bearer YOUR_TOKEN'"
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Format: Bearer YOUR_TOKEN or just YOUR_TOKEN. Leave empty to keep current token.
                </p>
              </div>
            </div>

            <button
              @click="saveAppSettings"
              :disabled="settingsStore.isLoading || settingsStore.isSyncing"
              class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ settingsStore.isLoading ? 'Saving...' : 'Save Application Settings' }}
            </button>
          </div>

          <!-- User Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">User Settings</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Select the GitLab projects and branches you want to see in the toolbar. Only selected items will be displayed.
            </p>
            
            <div v-if="projectsBranchesLoading" class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading projects and branches...</p>
            </div>
            
            <div v-else-if="allProjectsData.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-4">
              No projects available. Please sync GitLab instances first.
            </div>
            
            <div v-else class="space-y-4">
              <!-- Search -->
              <div class="mb-4">
                <input
                  v-model="projectsSearchQuery"
                  type="text"
                  placeholder="Search projects or branches..."
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <!-- Tree View -->
              <div class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div v-for="gitlabUrl in filteredGitlabUrls" :key="gitlabUrl.url" class="mb-4 last:mb-0">
                  <!-- GitLab URL Level -->
                  <div class="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      :checked="isGitlabUrlSelected(gitlabUrl.url)"
                      :indeterminate="isGitlabUrlIndeterminate(gitlabUrl.url)"
                      @change="toggleGitlabUrl(gitlabUrl.url)"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <button
                      @click="toggleGitlabUrlExpanded(gitlabUrl.url)"
                      class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <svg
                        class="w-4 h-4 transition-transform"
                        :class="{ 'rotate-90': isGitlabUrlExpanded(gitlabUrl.url) }"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      {{ gitlabUrl.url }}
                    </button>
                  </div>
                  
                  <!-- Projects Level -->
                  <div v-if="isGitlabUrlExpanded(gitlabUrl.url)" class="ml-6 space-y-2">
                    <div v-for="project in getFilteredProjects(gitlabUrl)" :key="project.id" class="mb-2">
                      <div class="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          :checked="isProjectSelected(gitlabUrl.url, project.id)"
                          :indeterminate="isProjectIndeterminate(gitlabUrl.url, project.id)"
                          @change="toggleProject(gitlabUrl.url, project.id)"
                          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <button
                          @click="toggleProjectExpanded(gitlabUrl.url, project.id)"
                          class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <svg
                            class="w-3 h-3 transition-transform"
                            :class="{ 'rotate-90': isProjectExpanded(gitlabUrl.url, project.id) }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                          {{ project.name }}
                        </button>
                      </div>
                      
                      <!-- Branches Level -->
                      <div v-if="isProjectExpanded(gitlabUrl.url, project.id)" class="ml-6 space-y-1">
                        <label
                          v-for="branch in getFilteredBranches(gitlabUrl.url, project)"
                          :key="branch"
                          class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            :checked="isBranchSelected(gitlabUrl.url, project.id, branch)"
                            @change="toggleBranch(gitlabUrl.url, project.id, branch)"
                            class="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span>{{ branch }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-2 mt-4">
                <button
                  @click="selectAllProjectsBranches"
                  class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Select All
                </button>
                <button
                  @click="deselectAllProjectsBranches"
                  class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Deselect All
                </button>
                <button
                  @click="saveProjectsBranchesSelection"
                  :disabled="settingsStore.isLoading"
                  class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  {{ settingsStore.isLoading ? 'Saving...' : 'Save Selection' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Back Button -->
          <div class="mt-6">
            <button
              @click="goBack"
              :disabled="settingsStore.isSyncing"
              class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back to Main Page
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTasksStore } from '@/stores/commitsStore';
import { showNotification } from '@/services/notificationService';

export default {
  name: 'SettingsPage',
  setup() {
    const router = useRouter();
    const settingsStore = useSettingsStore();
    const tasksStore = useTasksStore();
    const isDarkMode = ref(false);
    
    // Projects and branches selection state
    const allProjectsData = ref([]);
    const projectsBranchesLoading = ref(false);
    const projectsSearchQuery = ref('');
    const expandedGitlabUrls = ref(new Set());
    const expandedProjects = ref(new Set()); // Set<"gitlabUrl-projectId">
    const selectedProjectsBranches = ref({}); // { gitlabUrl: { projectId: [branch1, branch2] } }

    const appSettingsForm = ref({
      jiraUrl: '',
      jiraAuth: '',
    });

    const showAddGitlabForm = ref(false);
    const editingInstanceId = ref(null);
    const newInstanceForm = ref({
      gitlabUrl: '',
      token: '',
    });
    const editInstanceForm = ref({
      gitlabUrl: '',
      token: '',
    });

    const hasJiraToken = computed(() => {
      const auth = settingsStore.appSettings['jira.auth'];
      return auth && auth.length > 0 && !auth.endsWith('***');
    });

    const loadSettings = async () => {
      await settingsStore.loadAppSettings();
      await settingsStore.loadGitlabInstances();
      appSettingsForm.value.jiraUrl = settingsStore.appSettings['jira.url'] || '';
      // Токен маскируется на бэкенде, поэтому показываем пустое поле
      // Пользователь должен ввести новый токен, если хочет его изменить
      // Если поле пустое при сохранении, токен не будет обновлен
      appSettingsForm.value.jiraAuth = '';
      await loadProjectsAndBranches();
    };
    
    const loadProjectsAndBranches = async () => {
      projectsBranchesLoading.value = true;
      try {
        // Загружаем все доступные проекты и ветки
        const settings = await tasksStore.fetchSettings();
        allProjectsData.value = settings.gitlabUrls || [];
        
        // Загружаем сохраненные настройки пользователя
        const savedSelection = await settingsStore.loadSelectedProjectsAndBranches();
        if (savedSelection) {
          selectedProjectsBranches.value = savedSelection;
        } else {
          // Если настроек нет, инициализируем пустым объектом
          selectedProjectsBranches.value = {};
        }
      } catch (error) {
        console.error('Error loading projects and branches:', error);
        allProjectsData.value = [];
      } finally {
        projectsBranchesLoading.value = false;
      }
    };

    const saveAppSettings = async () => {
      const settings = {
        'jira.url': appSettingsForm.value.jiraUrl,
      };
      // Сохраняем токен только если он был введен (не пустой)
      if (appSettingsForm.value.jiraAuth && appSettingsForm.value.jiraAuth.trim()) {
        // Если токен не начинается с "Bearer ", добавляем его
        let token = appSettingsForm.value.jiraAuth.trim();
        if (!token.startsWith('Bearer ')) {
          token = 'Bearer ' + token;
        }
        settings['jira.auth'] = token;
      }
      // Если токен не введен, не обновляем его (сохраняем существующий)
      
      const success = await settingsStore.updateAppSettings(settings);
      if (success) {
        await loadSettings();
      }
    };

    const addNewInstance = async () => {
      if (!newInstanceForm.value.gitlabUrl || !newInstanceForm.value.token) {
        return;
      }
      await settingsStore.createGitlabInstance(newInstanceForm.value);
      newInstanceForm.value = { gitlabUrl: '', token: '' };
      showAddGitlabForm.value = false;
    };

    const cancelAddInstance = () => {
      newInstanceForm.value = { gitlabUrl: '', token: '' };
      showAddGitlabForm.value = false;
    };

    const startEditInstance = (instance) => {
      editingInstanceId.value = instance.instanceId;
      editInstanceForm.value = {
        gitlabUrl: instance.gitlabUrl,
        token: '', // Оставляем пустым, чтобы пользователь мог ввести новый или оставить старый
      };
    };

    const saveEditInstance = async (id) => {
      await settingsStore.updateGitlabInstance(id, editInstanceForm.value);
      editingInstanceId.value = null;
      editInstanceForm.value = { gitlabUrl: '', token: '' };
    };

    const cancelEditInstance = () => {
      editingInstanceId.value = null;
      editInstanceForm.value = { gitlabUrl: '', token: '' };
    };

    const deleteInstance = async (id) => {
      if (confirm('Are you sure you want to delete this GitLab instance?')) {
        await settingsStore.deleteGitlabInstance(id);
      }
    };

    const syncGitlabProjects = async () => {
      if (settingsStore.isSyncing) {
        return; // Уже идет синхронизация
      }
      const success = await settingsStore.syncGitlabInstances();
      if (success) {
        // Ждем завершения синхронизации и обновляем данные
        // Проверяем несколько раз, так как синхронизация может занять время
        const checkSyncComplete = async () => {
          try {
            await settingsStore.loadGitlabInstances();
            showNotification({
              title: 'Success',
              text: 'Synchronization completed. Projects should now be available.',
              type: 'success',
            });
          } catch (error) {
            console.error('Error loading GitLab instances after sync:', error);
          }
        };
        
        setTimeout(checkSyncComplete, 3000);
        setTimeout(checkSyncComplete, 6000);
        setTimeout(checkSyncComplete, 10000);
      }
    };

    const goBack = () => {
      if (settingsStore.isSyncing) {
        if (!confirm('Synchronization is in progress. Are you sure you want to leave?')) {
          return;
        }
      }
      router.push('/');
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleString();
      } catch {
        return dateString;
      }
    };
    
    // Tree View methods
    const filteredGitlabUrls = computed(() => {
      if (!projectsSearchQuery.value) {
        return allProjectsData.value;
      }
      const query = projectsSearchQuery.value.toLowerCase();
      return allProjectsData.value.filter(gitlabUrl => {
        const urlMatches = gitlabUrl.url.toLowerCase().includes(query);
        const projects = gitlabUrl.projects || [];
        const hasMatchingProjects = projects.some(project => {
          const projectMatches = project.name.toLowerCase().includes(query);
          const branches = project.branches || [];
          const hasMatchingBranches = branches.some(branch => branch.toLowerCase().includes(query));
          return projectMatches || hasMatchingBranches;
        });
        return urlMatches || hasMatchingProjects;
      });
    });
    
    const getFilteredProjects = (gitlabUrl) => {
      const projects = gitlabUrl.projects || [];
      if (!projectsSearchQuery.value) {
        return projects;
      }
      const query = projectsSearchQuery.value.toLowerCase();
      return projects.filter(project => {
        const projectMatches = project.name.toLowerCase().includes(query);
        const branches = project.branches || [];
        const hasMatchingBranches = branches.some(branch => branch.toLowerCase().includes(query));
        return projectMatches || hasMatchingBranches;
      });
    };
    
    const getFilteredBranches = (gitlabUrl, project) => {
      const branches = project.branches || [];
      if (!projectsSearchQuery.value) {
        return branches;
      }
      const query = projectsSearchQuery.value.toLowerCase();
      return branches.filter(branch => branch.toLowerCase().includes(query));
    };
    
    const isGitlabUrlExpanded = (url) => {
      return expandedGitlabUrls.value.has(url);
    };
    
    const toggleGitlabUrlExpanded = (url) => {
      if (expandedGitlabUrls.value.has(url)) {
        expandedGitlabUrls.value.delete(url);
      } else {
        expandedGitlabUrls.value.add(url);
      }
    };
    
    const isProjectExpanded = (gitlabUrl, projectId) => {
      const key = `${gitlabUrl}-${projectId}`;
      return expandedProjects.value.has(key);
    };
    
    const toggleProjectExpanded = (gitlabUrl, projectId) => {
      const key = `${gitlabUrl}-${projectId}`;
      if (expandedProjects.value.has(key)) {
        expandedProjects.value.delete(key);
      } else {
        expandedProjects.value.add(key);
      }
    };
    
    const isBranchSelected = (gitlabUrl, projectId, branch) => {
      const urlData = selectedProjectsBranches.value[gitlabUrl];
      if (!urlData) return false;
      const branches = urlData[String(projectId)];
      if (!branches) return false;
      return branches.includes(branch);
    };
    
    const isProjectSelected = (gitlabUrl, projectId) => {
      const urlData = selectedProjectsBranches.value[gitlabUrl];
      if (!urlData) return false;
      const branches = urlData[String(projectId)];
      if (!branches || branches.length === 0) return false;
      
      // Проверяем, все ли ветки проекта выбраны
      const gitlabUrlData = allProjectsData.value.find(g => g.url === gitlabUrl);
      if (!gitlabUrlData) return false;
      const project = gitlabUrlData.projects.find(p => String(p.id) === String(projectId));
      if (!project || !project.branches) return false;
      
      return project.branches.every(branch => branches.includes(branch));
    };
    
    const isProjectIndeterminate = (gitlabUrl, projectId) => {
      const urlData = selectedProjectsBranches.value[gitlabUrl];
      if (!urlData) return false;
      const branches = urlData[String(projectId)];
      if (!branches || branches.length === 0) return false;
      
      // Проверяем, выбраны ли некоторые, но не все ветки
      const gitlabUrlData = allProjectsData.value.find(g => g.url === gitlabUrl);
      if (!gitlabUrlData) return false;
      const project = gitlabUrlData.projects.find(p => String(p.id) === String(projectId));
      if (!project || !project.branches) return false;
      
      const selectedCount = project.branches.filter(b => branches.includes(b)).length;
      return selectedCount > 0 && selectedCount < project.branches.length;
    };
    
    const isGitlabUrlSelected = (gitlabUrl) => {
      const urlData = selectedProjectsBranches.value[gitlabUrl];
      if (!urlData) return false;
      
      const gitlabUrlData = allProjectsData.value.find(g => g.url === gitlabUrl);
      if (!gitlabUrlData || !gitlabUrlData.projects) return false;
      
      // Проверяем, все ли проекты и их ветки выбраны
      return gitlabUrlData.projects.every(project => {
        const branches = urlData[String(project.id)];
        if (!branches || branches.length === 0) return false;
        return project.branches.every(branch => branches.includes(branch));
      });
    };
    
    const isGitlabUrlIndeterminate = (gitlabUrl) => {
      const urlData = selectedProjectsBranches.value[gitlabUrl];
      if (!urlData) return false;
      
      const gitlabUrlData = allProjectsData.value.find(g => g.url === gitlabUrl);
      if (!gitlabUrlData || !gitlabUrlData.projects) return false;
      
      let hasSelected = false;
      let hasUnselected = false;
      
      gitlabUrlData.projects.forEach(project => {
        const branches = urlData[String(project.id)];
        if (branches && branches.length > 0) {
          const selectedCount = project.branches.filter(b => branches.includes(b)).length;
          if (selectedCount > 0) hasSelected = true;
          if (selectedCount < project.branches.length) hasUnselected = true;
        } else {
          hasUnselected = true;
        }
      });
      
      return hasSelected && hasUnselected;
    };
    
    const toggleBranch = (gitlabUrl, projectId, branch) => {
      if (!selectedProjectsBranches.value[gitlabUrl]) {
        selectedProjectsBranches.value[gitlabUrl] = {};
      }
      if (!selectedProjectsBranches.value[gitlabUrl][String(projectId)]) {
        selectedProjectsBranches.value[gitlabUrl][String(projectId)] = [];
      }
      
      const branches = selectedProjectsBranches.value[gitlabUrl][String(projectId)];
      const index = branches.indexOf(branch);
      if (index > -1) {
        branches.splice(index, 1);
      } else {
        branches.push(branch);
      }
      
      // Удаляем пустые массивы и объекты
      if (branches.length === 0) {
        delete selectedProjectsBranches.value[gitlabUrl][String(projectId)];
      }
      if (Object.keys(selectedProjectsBranches.value[gitlabUrl]).length === 0) {
        delete selectedProjectsBranches.value[gitlabUrl];
      }
    };
    
    const toggleProject = (gitlabUrl, projectId) => {
      const gitlabUrlData = allProjectsData.value.find(g => g.url === gitlabUrl);
      if (!gitlabUrlData) return;
      const project = gitlabUrlData.projects.find(p => String(p.id) === String(projectId));
      if (!project || !project.branches) return;
      
      const isSelected = isProjectSelected(gitlabUrl, projectId);
      
      if (!selectedProjectsBranches.value[gitlabUrl]) {
        selectedProjectsBranches.value[gitlabUrl] = {};
      }
      
      if (isSelected) {
        // Снимаем выбор со всех веток
        delete selectedProjectsBranches.value[gitlabUrl][String(projectId)];
      } else {
        // Выбираем все ветки
        selectedProjectsBranches.value[gitlabUrl][String(projectId)] = [...project.branches];
      }
      
      // Удаляем пустые объекты
      if (Object.keys(selectedProjectsBranches.value[gitlabUrl]).length === 0) {
        delete selectedProjectsBranches.value[gitlabUrl];
      }
    };
    
    const toggleGitlabUrl = (gitlabUrl) => {
      const gitlabUrlData = allProjectsData.value.find(g => g.url === gitlabUrl);
      if (!gitlabUrlData || !gitlabUrlData.projects) return;
      
      const isSelected = isGitlabUrlSelected(gitlabUrl);
      
      if (isSelected) {
        // Снимаем выбор со всех проектов и веток
        delete selectedProjectsBranches.value[gitlabUrl];
      } else {
        // Выбираем все проекты и ветки
        selectedProjectsBranches.value[gitlabUrl] = {};
        gitlabUrlData.projects.forEach(project => {
          if (project.branches && project.branches.length > 0) {
            selectedProjectsBranches.value[gitlabUrl][String(project.id)] = [...project.branches];
          }
        });
      }
    };
    
    const selectAllProjectsBranches = () => {
      selectedProjectsBranches.value = {};
      allProjectsData.value.forEach(gitlabUrl => {
        selectedProjectsBranches.value[gitlabUrl.url] = {};
        gitlabUrl.projects.forEach(project => {
          if (project.branches && project.branches.length > 0) {
            selectedProjectsBranches.value[gitlabUrl.url][String(project.id)] = [...project.branches];
          }
        });
      });
    };
    
    const deselectAllProjectsBranches = () => {
      selectedProjectsBranches.value = {};
    };
    
    const saveProjectsBranchesSelection = async () => {
      const success = await settingsStore.saveSelectedProjectsAndBranches(selectedProjectsBranches.value);
      if (success) {
        showNotification({
          title: 'Success',
          text: 'Your selection has been saved. Please refresh the main page to see the changes.',
          type: 'success',
        });
      }
    };

    onMounted(() => {
      loadSettings();
    });

    return {
      settingsStore,
      isDarkMode,
      appSettingsForm,
      saveAppSettings,
      showAddGitlabForm,
      editingInstanceId,
      newInstanceForm,
      editInstanceForm,
      addNewInstance,
      cancelAddInstance,
      startEditInstance,
      saveEditInstance,
      cancelEditInstance,
      deleteInstance,
      syncGitlabProjects,
      goBack,
      formatDate,
      hasJiraToken,
      // Projects and branches selection
      allProjectsData,
      projectsBranchesLoading,
      projectsSearchQuery,
      filteredGitlabUrls,
      isGitlabUrlExpanded,
      toggleGitlabUrlExpanded,
      isProjectExpanded,
      toggleProjectExpanded,
      getFilteredProjects,
      getFilteredBranches,
      isBranchSelected,
      isProjectSelected,
      isProjectIndeterminate,
      isGitlabUrlSelected,
      isGitlabUrlIndeterminate,
      toggleBranch,
      toggleProject,
      toggleGitlabUrl,
      selectAllProjectsBranches,
      deselectAllProjectsBranches,
      saveProjectsBranchesSelection,
    };
  },
};
</script>

