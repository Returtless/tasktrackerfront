import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import './assets/style.css'; 
import Notifications from '@kyvg/vue3-notification';
import { initNotificationService, showNotification } from './services/notificationService';

const app = createApp(App);

app.use(router);
app.use(createPinia());
app.use(Notifications);

initNotificationService();

// Test notification
showNotification({
  title: 'Test Notification',
  text: 'This is a test notification.',
  type: 'success'
});

app.mount('#app');
