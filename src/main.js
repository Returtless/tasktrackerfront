import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import './assets/style.css'; 
import Notifications from '@kyvg/vue3-notification';
import { initNotificationService } from './services/notificationService';
import i18n, { initI18n } from './i18n';

// Инициализируем i18n
initI18n();

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.use(Notifications);

// Добавляем i18n как глобальное свойство
app.config.globalProperties.$t = i18n.t;

initNotificationService();

// Mount app - router guard will handle authentication check
app.mount('#app');
