import { computed } from 'vue';

/**
 * Composable для фильтрации commits
 * @param {Array} tasks - Массив задач
 * @param {Array} selectedAuthors - Массив выбранных авторов
 * @param {boolean} hideWithTargetCommits - Скрывать ли задачи с коммитами в target ветке
 * @returns {Object} Объект с методами и computed свойствами для фильтрации
 */
export function useCommitsFilter(tasks, selectedAuthors, hideWithTargetCommits) {
  /**
   * Фильтрует commits по выбранным авторам
   * @param {Object} commits - Объект или Map с commits
   * @returns {Array} Отфильтрованный массив commits
   */
  const filterCommitsByAuthors = (commits) => {
    if (!commits) return [];
    const commitsArray = Object.values(commits);
    if (selectedAuthors.value.length === 0) return commitsArray;
    
    return commitsArray.filter(commit =>
      selectedAuthors.value.includes(commit?.commit?.authorEmail?.split('@')[0])
    );
  };

  /**
   * Отфильтрованные задачи без target commits (если hideWithTargetCommits = true)
   */
  const filteredTasks = computed(() => {
    if (!hideWithTargetCommits.value) {
      return tasks.value || [];
    }
    
    return (tasks.value || []).filter(task => {
      // Фильтруем задачи, у которых есть хотя бы один коммит с transferred === false
      if (!task.commits) return false;
      const commitsArray = filterCommitsByAuthors(task.commits);
      return commitsArray.some(commit => !commit.transferred);
    });
  });

  /**
   * Список всех уникальных авторов из задач
   */
  const authorOptions = computed(() => {
    const authors = new Set();
    (tasks.value || []).forEach(task => {
      if (!task.commits) return;
      Object.values(task.commits).forEach(commit => {
        const author = commit?.commit?.authorEmail?.split('@')[0];
        if (author) {
          authors.add(author);
        }
      });
    });
    return Array.from(authors).sort();
  });

  /**
   * Создает плоский список всех MR из всех задач для сортировки
   * @param {Function} filterCommitsFn - Функция для фильтрации commits (для совместимости с компонентом)
   * @returns {Array} Плоский список объектов { commit, task, mrNumber }
   */
  const createFlattenedMrList = (filterCommitsFn) => {
    const mrList = [];
    
    let tasksToProcess = hideWithTargetCommits.value
      ? filteredTasks.value.filter(task => {
          // Фильтруем задачи, у которых есть хотя бы один коммит с transferred === false
          if (!task.commits) return false;
          const commitsArray = filterCommitsFn ? filterCommitsFn(task.commits) : filterCommitsByAuthors(task.commits);
          return commitsArray.some(commit => !commit.transferred);
        })
      : [...(tasks.value || [])];

    // Фильтруем задачи по выбранным авторам
    if (selectedAuthors.value.length > 0) {
      tasksToProcess = tasksToProcess.filter(task => {
        if (!task.commits) return false;
        return Object.values(task.commits).some(commit =>
          selectedAuthors.value.includes(
            (commit?.commit?.authorEmail?.split('@')[0] || '')
          )
        );
      });
    }

    // Разворачиваем все задачи в плоский список MR
    tasksToProcess.forEach(task => {
      if (!task.commits) return;
      
      // Преобразуем commits в массив, если это Map/Object
      const commitsArray = filterCommitsFn ? filterCommitsFn(task.commits) : filterCommitsByAuthors(task.commits);
      commitsArray.forEach(commit => {
        // Проверяем наличие mrNumber (может быть строкой или числом)
        const mrNum = commit?.mrNumber;
        if (mrNum !== null && mrNum !== undefined && mrNum !== '') {
          const mrNumberInt = typeof mrNum === 'number' ? mrNum : parseInt(mrNum);
          if (!isNaN(mrNumberInt) && mrNumberInt > 0) {
            mrList.push({
              commit: commit,
              task: task,
              mrNumber: mrNumberInt
            });
          }
        }
      });
    });

    return mrList;
  };

  return {
    filterCommitsByAuthors,
    filteredTasks,
    authorOptions,
    createFlattenedMrList,
  };
}

