<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <div class="min-h-screen w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div class="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          {{ isFirstUser ? 'Create Admin Account' : 'Login' }}
        </h1>

        <!-- Login Form -->
        <form v-if="!isFirstUser" @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              v-model="loginForm.username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              v-model="loginForm.password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ authStore.isLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <!-- Register Form (First User) -->
        <form v-else @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              v-model="registerForm.username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email (optional)
            </label>
            <input
              v-model="registerForm.email"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              v-model="registerForm.password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Confirm password"
            />
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading || !passwordsMatch"
            class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ authStore.isLoading ? 'Creating account...' : 'Create Admin Account' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';

export default {
  name: 'LoginPage',
  setup() {
    const authStore = useAuthStore();
    const isDarkMode = ref(false);
    const isFirstUser = ref(false);

    const loginForm = ref({
      username: '',
      password: '',
    });

    const registerForm = ref({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    const passwordsMatch = computed(() => {
      return registerForm.value.password === registerForm.value.confirmPassword &&
             registerForm.value.password.length > 0;
    });

    const handleLogin = async () => {
      await authStore.login(loginForm.value.username, loginForm.value.password);
    };

    const handleRegister = async () => {
      if (!passwordsMatch.value) {
        return;
      }
      await authStore.register(
        registerForm.value.username,
        registerForm.value.email,
        registerForm.value.password
      );
    };

    onMounted(async () => {
      isFirstUser.value = await authStore.checkFirstUser();
    });

    return {
      authStore,
      isDarkMode,
      isFirstUser,
      loginForm,
      registerForm,
      passwordsMatch,
      handleLogin,
      handleRegister,
    };
  },
};
</script>

