// Система интернационализации
const translations = {
  ru: {
    // Общие
    common: {
      select: 'Выбрать',
      save: 'Сохранить',
      cancel: 'Отмена',
      edit: 'Редактировать',
      delete: 'Удалить',
      refresh: 'Обновить',
      loading: 'Загрузка...',
      processing: 'Обработка...',
      success: 'Успешно',
      error: 'Ошибка',
      warning: 'Предупреждение',
      unknown: 'Неизвестно',
      notAvailable: 'Н/Д',
    },
    // Страницы
    pages: {
      commitsPage: 'Перенос коммитов между ветками',
      settings: 'Настройки',
      login: 'Вход',
      signUp: 'Регистрация',
      createAdminAccount: 'Создать учетную запись администратора',
      mainPage: 'Главная страница',
    },
    // Таблица коммитов
    commitsTable: {
      select: '',
      taskJira: 'Задача Jira',
      improvementStatus: 'Статус доработки',
      date: 'Дата',
      sourceMR: 'Исходные MR',
      author: 'Автор',
      targetMR: 'Готовые MR',
      cherryPick: '',
      filterByAuthor: 'Фильтр по автору',
      sortByMR: 'Сортировать по MR',
      sortOff: 'выкл',
      all: 'Все',
      notCherryPicked: 'Не перенесены',
      cherryPickSelected: 'Перенести выбранные',
      sourceCommits: 'Исходные MR:',
      targetCommits: 'Готовые MR:',
      noData: 'Нет данных для отображения',
      processingCherryPick: 'Обработка переноса...',
    },
    // Панель инструментов
    toolbar: {
      selectGitlabUrl: 'Выберите URL GitLab',
      selectProject: 'Выберите проект',
      source: 'Откуда',
      target: 'Куда',
      options: 'Настройки',
      selectionMode: 'Режим выбора',
      patch: 'Патч',
      mr: 'MR',
      mrCount: 'Количество MR',
      forceRefresh: 'Принудительное обновление',
      ignoresCache: 'игнорирует кеш',
      usesCache: 'использует кеш',
      refresh: 'Обновить',
      refreshTable: 'Обновить таблицу',
      darkTheme: 'Темная тема',
      selectPatch: 'Выберите патч',
      settings: 'Настройки',
      logout: 'Выйти',
    },
    // Настройки
    settings: {
      gitlabInstances: 'Экземпляры GitLab',
      syncProjects: 'Синхронизировать проекты',
      syncing: 'Синхронизация...',
      addGitlabInstance: 'Добавить экземпляр GitLab',
      noInstances: 'Нет настроенных экземпляров GitLab. Нажмите "Добавить экземпляр GitLab" для добавления.',
      token: 'Токен',
      created: 'Создано',
      gitlabUrl: 'URL GitLab',
      enterNewToken: 'Введите новый токен или оставьте пустым для сохранения текущего',
      addNewInstance: 'Добавить новый экземпляр GitLab',
      createTokenHint: 'Создайте персональный токен доступа в GitLab с областью "api"',
      addInstance: 'Добавить экземпляр',
      applicationSettings: 'Настройки приложения',
      jiraUrl: 'URL Jira',
      jiraAuthToken: 'Токен аутентификации Jira',
      tokenSaved: '(Токен сохранен)',
      enterNewTokenToUpdate: 'Введите новый токен для обновления (оставьте пустым для сохранения текущего)',
      tokenFormat: 'Формат: Bearer YOUR_TOKEN или просто YOUR_TOKEN. Оставьте пустым для сохранения текущего токена.',
      saving: 'Сохранение...',
      saveApplicationSettings: 'Сохранить настройки приложения',
      userSettings: 'Пользовательские настройки',
      selectProjectsBranches: 'Выберите проекты GitLab и ветки, которые вы хотите видеть в панели инструментов. Будут отображаться только выбранные элементы.',
      loadingProjectsBranches: 'Загрузка проектов и веток...',
      noProjectsAvailable: 'Нет доступных проектов. Сначала синхронизируйте экземпляры GitLab.',
      searchProjectsBranches: 'Поиск проектов или веток...',
      selectAll: 'Выбрать все',
      deselectAll: 'Снять выбор',
      saveSelection: 'Сохранить выбор',
      backToMainPage: 'Главная страница',
    },
    // Вход/Регистрация
    auth: {
      username: 'Имя пользователя',
      password: 'Пароль',
      email: 'Email',
      emailOptional: 'Email (необязательно)',
      confirmPassword: 'Подтвердите пароль',
      enterUsername: 'Введите имя пользователя',
      enterPassword: 'Введите пароль',
      enterEmail: 'Введите email',
      confirmPasswordPlaceholder: 'Подтвердите пароль',
      loggingIn: 'Вход...',
      login: 'Войти',
      creatingAccount: 'Создание учетной записи...',
      createAdminAccount: 'Создать учетную запись администратора',
      signUp: 'Зарегистрироваться',
      alreadyHaveAccount: 'Уже есть учетная запись?',
      noAccount: 'Нет учетной записи?',
      signUpLink: 'Зарегистрироваться',
    },
    // Уведомления
    notifications: {
      // Общие
      success: 'Успешно',
      error: 'Ошибка',
      warning: 'Предупреждение',
      // Настройки
      settingsSaved: 'Настройки успешно сохранены',
      failedToSaveSettings: 'Не удалось сохранить настройки',
      waitForSync: 'Пожалуйста, дождитесь завершения синхронизации',
      gitlabInstanceCreated: 'Экземпляр GitLab успешно создан',
      failedToCreateInstance: 'Не удалось создать экземпляр GitLab',
      gitlabInstanceUpdated: 'Экземпляр GitLab успешно обновлен',
      failedToUpdateInstance: 'Не удалось обновить экземпляр GitLab',
      gitlabInstanceDeleted: 'Экземпляр GitLab успешно удален',
      failedToDeleteInstance: 'Не удалось удалить экземпляр GitLab',
      syncStarted: 'Синхронизация проектов GitLab запущена. Пожалуйста, подождите...',
      failedToSync: 'Не удалось синхронизировать экземпляры GitLab',
      selectionSaved: 'Выбор проектов и веток успешно сохранен',
      failedToSaveSelection: 'Не удалось сохранить выбор',
      syncCompleted: 'Синхронизация завершена. Проекты теперь должны быть доступны.',
      selectionSavedRefresh: 'Ваш выбор сохранен. Пожалуйста, обновите главную страницу, чтобы увидеть изменения.',
      // Коммиты
      noPatchesFound: 'Патчи для проекта {projectKey} не найдены',
      errorFetchingRecentMRs: 'Ошибка получения последних MR: {error}',
      errorFetchingCommits: 'Ошибка получения коммитов: {error}',
      unknownError: 'Произошла неизвестная ошибка.',
      cherryPickCompleted: 'Запрос на перенос выполнен для MR #{mrNumber}.',
      errorSendingCherryPick: 'Ошибка отправки запроса на перенос: {error}',
      noCommitsSelected: 'Коммиты не выбраны.',
      cherryPickListSent: 'Запрос на перенос успешно отправлен для {count} задач.',
      errorSendingCherryPickList: 'Ошибка отправки запроса на перенос списка: {error}',
      // Авторизация
      loginSuccessful: 'Вход выполнен успешно',
      loginFailed: 'Ошибка входа',
      registrationSuccessful: 'Регистрация выполнена успешно',
      registrationFailed: 'Ошибка регистрации',
      logoutSuccessful: 'Выход выполнен успешно',
    },
  },
  en: {
    // Общие
    common: {
      select: 'Select',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      refresh: 'Refresh',
      loading: 'Loading...',
      processing: 'Processing...',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      unknown: 'Unknown',
      notAvailable: 'N/A',
    },
    // Страницы
    pages: {
      commitsPage: 'Commits Page',
      settings: 'Settings',
      login: 'Login',
      signUp: 'Sign Up',
      createAdminAccount: 'Create Admin Account',
      mainPage: 'Main Page',
    },
    // Таблица коммитов
    commitsTable: {
      select: '',
      taskJira: 'Jira Task',
      improvementStatus: 'Improvement Status',
      date: 'Date',
      sourceMR: 'Source MR',
      author: 'Author',
      targetMR: 'Target MR',
      cherryPick: '',
      filterByAuthor: 'Filter by Author',
      sortByMR: 'Sort by MR',
      sortOff: 'off',
      all: 'All',
      notCherryPicked: 'Not cherry-picked',
      cherryPickSelected: 'Cherry-pick Selected',
      sourceCommits: 'Source Commits:',
      targetCommits: 'Target Commits:',
      noData: 'No data to display',
      processingCherryPick: 'Processing cherry-pick...',
    },
    // Панель инструментов
    toolbar: {
      selectGitlabUrl: 'Select GitLab URL',
      selectProject: 'Select Project',
      source: 'Source',
      target: 'Target',
      options: 'Options',
      selectionMode: 'Selection Mode',
      patch: 'Patch',
      mr: 'MR',
      mrCount: 'MR Count',
      forceRefresh: 'Force Refresh',
      ignoresCache: 'ignores cache',
      usesCache: 'uses cache',
      refresh: 'Refresh',
      refreshTable: 'Refresh Table',
      darkTheme: 'Toggle dark mode',
      selectPatch: 'Select Patch',
      settings: 'Settings',
      logout: 'Logout',
    },
    // Настройки
    settings: {
      gitlabInstances: 'GitLab Instances',
      syncProjects: 'Sync Projects',
      syncing: 'Syncing...',
      addGitlabInstance: 'Add GitLab Instance',
      noInstances: 'No GitLab instances configured. Click "Add GitLab Instance" to add one.',
      token: 'Token',
      created: 'Created',
      gitlabUrl: 'GitLab URL',
      enterNewToken: 'Enter new token or leave empty to keep current',
      addNewInstance: 'Add New GitLab Instance',
      createTokenHint: 'Create a personal access token in GitLab with "api" scope',
      addInstance: 'Add Instance',
      applicationSettings: 'Application Settings',
      jiraUrl: 'Jira URL',
      jiraAuthToken: 'Jira Auth Token',
      tokenSaved: '(Token is saved)',
      enterNewTokenToUpdate: 'Enter new token to update (leave empty to keep current)',
      tokenFormat: 'Format: Bearer YOUR_TOKEN or just YOUR_TOKEN. Leave empty to keep current token.',
      saving: 'Saving...',
      saveApplicationSettings: 'Save Application Settings',
      userSettings: 'User Settings',
      selectProjectsBranches: 'Select the GitLab projects and branches you want to see in the toolbar. Only selected items will be displayed.',
      loadingProjectsBranches: 'Loading projects and branches...',
      noProjectsAvailable: 'No projects available. Please sync GitLab instances first.',
      searchProjectsBranches: 'Search projects or branches...',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      saveSelection: 'Save Selection',
      backToMainPage: 'Back to Main Page',
    },
    // Вход/Регистрация
    auth: {
      username: 'Username',
      password: 'Password',
      email: 'Email',
      emailOptional: 'Email (optional)',
      confirmPassword: 'Confirm Password',
      enterUsername: 'Enter username',
      enterPassword: 'Enter password',
      enterEmail: 'Enter email',
      confirmPasswordPlaceholder: 'Confirm password',
      loggingIn: 'Logging in...',
      login: 'Login',
      creatingAccount: 'Creating account...',
      createAdminAccount: 'Create Admin Account',
      signUp: 'Sign Up',
      alreadyHaveAccount: 'Already have an account?',
      noAccount: "Don't have an account?",
      signUpLink: 'Sign up',
    },
    // Уведомления
    notifications: {
      // Общие
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      // Настройки
      settingsSaved: 'Settings saved successfully',
      failedToSaveSettings: 'Failed to save settings',
      waitForSync: 'Please wait for synchronization to complete',
      gitlabInstanceCreated: 'GitLab instance created successfully',
      failedToCreateInstance: 'Failed to create GitLab instance',
      gitlabInstanceUpdated: 'GitLab instance updated successfully',
      failedToUpdateInstance: 'Failed to update GitLab instance',
      gitlabInstanceDeleted: 'GitLab instance deleted successfully',
      failedToDeleteInstance: 'Failed to delete GitLab instance',
      syncStarted: 'GitLab projects synchronization started. Please wait...',
      failedToSync: 'Failed to sync GitLab instances',
      selectionSaved: 'Projects and branches selection saved successfully',
      failedToSaveSelection: 'Failed to save selection',
      syncCompleted: 'Synchronization completed. Projects should now be available.',
      selectionSavedRefresh: 'Your selection has been saved. Please refresh the main page to see the changes.',
      // Коммиты
      noPatchesFound: 'No patches found for project {projectKey}',
      errorFetchingRecentMRs: 'Error fetching recent MRs: {error}',
      errorFetchingCommits: 'Error fetching commits: {error}',
      unknownError: 'An unknown error occurred.',
      cherryPickCompleted: 'Cherry-pick request completed for MR #{mrNumber}.',
      errorSendingCherryPick: 'Error sending cherry-pick request: {error}',
      noCommitsSelected: 'No commits selected.',
      cherryPickListSent: 'Cherry-pick request sent successfully for {count} tasks.',
      errorSendingCherryPickList: 'Error sending cherry-pick list request: {error}',
      // Авторизация
      loginSuccessful: 'Login successful',
      loginFailed: 'Login failed',
      registrationSuccessful: 'Registration successful',
      registrationFailed: 'Registration failed',
      logoutSuccessful: 'Logged out successfully',
    },
  },
};

// Текущий язык (по умолчанию русский)
let currentLanguage = 'ru';

// Функция для получения перевода
export function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Если перевод не найден, возвращаем ключ
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
  }
  
  // Заменяем параметры в строке
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }
  
  return value || key;
}

// Функция для установки языка
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    // Сохраняем в localStorage
    localStorage.setItem('appLanguage', lang);
    return true;
  }
  return false;
}

// Функция для получения текущего языка
export function getLanguage() {
  return currentLanguage;
}

// Инициализация: загружаем язык из localStorage
export function initI18n() {
  const savedLang = localStorage.getItem('appLanguage');
  if (savedLang && translations[savedLang]) {
    currentLanguage = savedLang;
  }
}

// Инициализируем при импорте
initI18n();

// Экспортируем объект для использования в компонентах
export default {
  t,
  setLanguage,
  getLanguage,
  initI18n,
};

