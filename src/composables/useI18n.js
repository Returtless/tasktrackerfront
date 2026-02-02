import { computed } from 'vue';
import i18n, { setLanguage, getLanguage } from '@/i18n';

// Composable для использования i18n в компонентах
export function useI18n() {
  const t = (key, params) => i18n.t(key, params);
  const currentLang = computed(() => getLanguage());
  
  const changeLanguage = (lang) => {
    const success = setLanguage(lang);
    if (success) {
      // Перезагружаем страницу для применения изменений
      window.location.reload();
    }
    return success;
  };
  
  return {
    t,
    currentLang,
    changeLanguage,
  };
}

