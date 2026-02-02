/**
 * Утилиты для форматирования дат
 */

/**
 * Получает дату для задачи, если она валидна
 * @param {Object} task - Объект задачи
 * @returns {Date|null} Дата задачи или null, если дата невалидна
 */
export function getDisplayDateForTask(task) {
  return task.date && !isNaN(new Date(task.date).getTime()) ? new Date(task.date) : null;
}

/**
 * Форматирует дату в полном формате с временем
 * @param {string|Date} dateStr - Дата в виде строки или объекта Date
 * @returns {string} Отформатированная дата
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', '');
}

/**
 * Форматирует дату в компактном формате (день.месяц)
 * @param {string|Date} dateStr - Дата в виде строки или объекта Date
 * @param {Function} t - Функция i18n для перевода (опционально)
 * @returns {string} Отформатированная дата в формате "дд.мм"
 */
export function formatDateCompact(dateStr, t = null) {
  if (!dateStr) return t ? t('common.notAvailable') : 'Н/Д';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return t ? t('common.notAvailable') : 'Н/Д';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

/**
 * Форматирует дату в полном формате с временем
 * @param {string|Date} dateStr - Дата в виде строки или объекта Date
 * @param {Function} t - Функция i18n для перевода (опционально)
 * @returns {string} Отформатированная дата с временем
 */
export function formatDateFull(dateStr, t = null) {
  if (!dateStr) return t ? t('common.notAvailable') : 'Н/Д';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return t ? t('common.notAvailable') : 'Н/Д';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', '');
}

