import { DEFAULT_PROJECT_KEY } from './constants';

/**
 * Извлекает ключ проекта из имени проекта
 * @param {string} projectName - Имя проекта из GitLab
 * @returns {string} Ключ проекта для использования в Jira
 */
export function extractProjectKey(projectName) {
  if (!projectName) return DEFAULT_PROJECT_KEY;
  
  // Если имя содержит дефис, берем часть до дефиса
  let projectKey = projectName.includes('-') 
    ? projectName.split('-')[0] 
    : projectName;
  
  // Костыль: в GitLab проект называется SPS, а в Jira - SPPDEV
  // Поэтому нужно преобразовать SPS -> SPPDEV для запросов к Jira
  if (projectKey === 'SPS') {
    return DEFAULT_PROJECT_KEY;
  }
  
  return projectKey;
}

