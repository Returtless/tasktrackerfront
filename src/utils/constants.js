// Application constants
export const DEFAULT_PROJECT_KEY = 'SPPDEV';
export const DEFAULT_SOURCE_BRANCH = 'master';
export const DEFAULT_TARGET_BRANCH = 'release';
// Fallback Jira URL (used if settings are not available)
export const DEFAULT_JIRA_BROWSE_URL = 'https://job-jira.otr.ru/browse/';

/**
 * Извлекает базовый URL Jira из полного URL настроек
 * @param {string} jiraUrl - Полный URL Jira (например, "https://job-jira.otr.ru/rest/api/2")
 * @returns {string} Базовый URL для browse (например, "https://job-jira.otr.ru/browse/")
 */
export function getJiraBrowseUrl(jiraUrl) {
  if (!jiraUrl) {
    return DEFAULT_JIRA_BROWSE_URL;
  }
  
  try {
    const url = new URL(jiraUrl);
    // Убираем путь и добавляем /browse/
    return `${url.origin}/browse/`;
  } catch (error) {
    // Если URL некорректный, возвращаем дефолтный
    console.warn('Invalid Jira URL:', jiraUrl, error);
    return DEFAULT_JIRA_BROWSE_URL;
  }
}

