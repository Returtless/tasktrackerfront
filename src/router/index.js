import { createRouter, createWebHistory } from 'vue-router';
import CommitsPage from '../components/CommitsPage.vue'; // Обновляем имя компонента

const routes = [
  {
    path: '/',
    name: 'CommitsPage',
    component: CommitsPage, // Обновляем имя компонента
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;