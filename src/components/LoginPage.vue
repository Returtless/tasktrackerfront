<template>
  <div :class="isDarkMode ? 'dark' : ''">
    <div class="min-h-screen w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div class="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          {{ isFirstUser ? $t('auth.createAdminAccount') : (showRegister ? $t('pages.signUp') : $t('pages.login')) }}
        </h1>

        <!-- Login Form -->
        <form v-if="!isFirstUser && !showRegister" @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('auth.username') }}
            </label>
            <input
              v-model="loginForm.username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              :placeholder="$t('auth.enterUsername')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('auth.password') }}
            </label>
            <input
              v-model="loginForm.password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              :placeholder="$t('auth.enterPassword')"
            />
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ authStore.isLoading ? $t('auth.loggingIn') : $t('auth.login') }}
          </button>
        </form>

        <!-- Register Form (First User or Manual Registration) -->
        <form v-if="isFirstUser || showRegister" @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('auth.username') }}
            </label>
            <input
              v-model="registerForm.username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              :placeholder="$t('auth.enterUsername')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('auth.emailOptional') }}
            </label>
            <input
              v-model="registerForm.email"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              :placeholder="$t('auth.enterEmail')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('auth.password') }}
            </label>
            <input
              v-model="registerForm.password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              :placeholder="$t('auth.enterPassword')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('auth.confirmPassword') }}
            </label>
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              :placeholder="$t('auth.confirmPasswordPlaceholder')"
            />
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading || !passwordsMatch"
            class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ authStore.isLoading ? $t('auth.creatingAccount') : (isFirstUser ? $t('auth.createAdminAccount') : $t('auth.signUp')) }}
          </button>
        </form>

        <!-- Toggle between Login and Register -->
        <div v-if="!isFirstUser" class="mt-6 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ showRegister ? $t('auth.alreadyHaveAccount') : $t('auth.noAccount') }}
            <button
              @click="showRegister = !showRegister"
              class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium ml-1"
            >
              {{ showRegister ? $t('auth.login') : $t('auth.signUpLink') }}
            </button>
          </p>
        </div>
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
    const showRegister = ref(false);

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
      showRegister,
      loginForm,
      registerForm,
      passwordsMatch,
      handleLogin,
      handleRegister,
    };
  },
};
</script>

