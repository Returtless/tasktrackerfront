
// src/services/notificationService.js
import { useNotification } from '@kyvg/vue3-notification';

let notify;

export function initNotificationService() {
  const { notify: notifyInstance } = useNotification();
  notify = notifyInstance;
}

export function showNotification({ title, text, type }) {
  if (notify) {
    console.log('Showing notification:', { title, text, type });
    notify({ title, text, type });
  } else {
    console.error('Notification service is not initialized');
  }
}
