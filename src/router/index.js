import { createRouter, createWebHistory } from 'vue-router';
import CommitsPage from '../components/CommitsPage.vue';
import LoginPage from '../components/LoginPage.vue';
import SettingsPage from '../components/SettingsPage.vue';
import { useAuthStore } from '@/stores/authStore';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    name: 'CommitsPage',
    component: CommitsPage,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Если идем на страницу логина, не проверяем аутентификацию
  if (to.path === '/login') {
    // Но если уже авторизован, редиректим на главную
    if (authStore.isAuthenticated) {
      next('/');
      return;
    }
    next();
    return;
  }

  // Проверяем аутентификацию только если еще не проверяли
  if (!authStore.isAuthenticated && authStore.user === null && !authStore.isLoading) {
    await authStore.checkAuth();
  }

  // Если маршрут требует аутентификации
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      next('/login');
      return;
    }
  }

  next();
});

export default router;