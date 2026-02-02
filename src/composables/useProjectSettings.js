import { computed } from 'vue';
import { DEFAULT_PROJECT_KEY, DEFAULT_SOURCE_BRANCH, DEFAULT_TARGET_BRANCH } from '@/utils/constants';
import { extractProjectKey } from '@/utils/projectUtils';

/**
 * Composable для работы с настройками проекта
 * @param {Object} settings - Объект настроек с gitlabUrls
 * @param {string} selectedGitlabUrl - Выбранный URL GitLab
 * @param {string} selectedProjectId - Выбранный ID проекта
 * @returns {Object} Объект с computed свойствами и методами для работы с настройками
 */
export function useProjectSettings(settings, selectedGitlabUrl, selectedProjectId) {
  /**
   * Отсортированный список GitLab URLs
   */
  const sortedGitlabUrls = computed(() => {
    if (!settings.value?.gitlabUrls) return [];
    return [...settings.value.gitlabUrls].sort((a, b) => a.url.localeCompare(b.url));
  });

  /**
   * Отсортированный список проектов для выбранного GitLab URL
   */
  const sortedSelectedGitlabUrlProjects = computed(() => {
    if (!selectedGitlabUrl.value || !settings.value?.gitlabUrls) return [];
    
    const urlData = settings.value.gitlabUrls.find(
      url => url.url === selectedGitlabUrl.value
    );
    if (!urlData || !urlData.projects) return [];
    
    return [...urlData.projects].sort((a, b) => a.name.localeCompare(b.name));
  });

  /**
   * Отсортированный список веток для выбранного проекта
   */
  const sortedSelectedProjectBranches = computed(() => {
    if (!selectedProjectId.value || !settings.value?.gitlabUrls) return [];
    
    const urlData = settings.value.gitlabUrls.find(
      url => url.url === selectedGitlabUrl.value
    );
    if (!urlData || !urlData.projects) return [];
    
    const project = urlData.projects.find(
      proj => proj.id === selectedProjectId.value
    );
    if (!project || !project.branches) return [];
    
    return [...project.branches].sort((a, b) => a.localeCompare(b));
  });

  /**
   * Ключ проекта из выбранного проекта
   */
  const selectedProjectKey = computed(() => {
    if (!selectedProjectId.value || !settings.value?.gitlabUrls) return DEFAULT_PROJECT_KEY;
    
    const urlData = settings.value.gitlabUrls.find(
      url => url.url === selectedGitlabUrl.value
    );
    if (!urlData || !urlData.projects) return DEFAULT_PROJECT_KEY;
    
    const project = urlData.projects.find(
      proj => proj.id === selectedProjectId.value
    );
    if (!project || !project.name) return DEFAULT_PROJECT_KEY;
    
    return extractProjectKey(project.name);
  });

  /**
   * Список доступных веток для выбранного проекта
   */
  const availableBranches = computed(() => {
    if (!selectedProjectId.value || !settings.value?.gitlabUrls) return [];
    
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

  /**
   * Проверяет, валидны ли выбранные настройки для обновления таблицы
   */
  const isSettingsValid = computed(() => {
    return (
      selectedGitlabUrl.value &&
      selectedProjectId.value &&
      settings.value?.gitlabUrls
    );
  });

  /**
   * Получает проект по ID
   */
  const getProjectById = (projectId) => {
    if (!projectId || !settings.value?.gitlabUrls) return null;
    
    const urlData = settings.value.gitlabUrls.find(
      url => url.url === selectedGitlabUrl.value
    );
    if (!urlData || !urlData.projects) return null;
    
    return urlData.projects.find(proj => proj.id === projectId) || null;
  };

  return {
    sortedGitlabUrls,
    sortedSelectedGitlabUrlProjects,
    sortedSelectedProjectBranches,
    selectedProjectKey,
    availableBranches,
    isSettingsValid,
    getProjectById,
  };
}

