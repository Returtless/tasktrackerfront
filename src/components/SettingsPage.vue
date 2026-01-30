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
              User-specific settings will be available here in the future.
            </p>
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
import { showNotification } from '@/services/notificationService';

export default {
  name: 'SettingsPage',
  setup() {
    const router = useRouter();
    const settingsStore = useSettingsStore();
    const isDarkMode = ref(false);

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
    };
  },
};
</script>

