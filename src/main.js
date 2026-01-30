import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import './assets/style.css'; 
import Notifications from '@kyvg/vue3-notification';
import { initNotificationService } from './services/notificationService';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.use(Notifications);

initNotificationService();

// Mount app - router guard will handle authentication check
app.mount('#app');
