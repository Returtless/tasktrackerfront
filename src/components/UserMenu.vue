<template>
  <div class="relative" v-if="authStore && authStore.user">
    <button
      @click.stop="$emit('toggle-menu')"
      :class="buttonClasses"
    >
      <div :class="avatarClasses">
        {{ authStore.user.username.charAt(0).toUpperCase() }}
      </div>
      <svg :class="[iconClasses, { 'rotate-180': isOpen }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        @click.stop
        class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
      >
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ authStore.user.username }}</p>
          <p v-if="authStore.user.email" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ authStore.user.email }}</p>
        </div>
        <button
          @click="$emit('go-to-settings')"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          {{ $t('toolbar.settings') }}
        </button>
        <button
          @click="$emit('handle-logout')"
          class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          {{ $t('toolbar.logout') }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'UserMenu',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    authStore: {
      type: Object,
      default: null
    },
    size: {
      type: String,
      default: 'xl', // 'xl', 'lg', 'mobile'
      validator: (value) => ['xl', 'lg', 'mobile'].includes(value)
    }
  },
  emits: ['toggle-menu', 'go-to-settings', 'handle-logout'],
  computed: {
    buttonClasses() {
      const base = 'flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';
      if (this.size === 'xl') {
        return `${base} px-3 py-2`;
      } else if (this.size === 'lg') {
        return `${base} px-2 py-2`;
      } else {
        return `${base} px-2 py-2 flex-shrink-0`;
      }
    },
    avatarClasses() {
      const base = 'rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold';
      if (this.size === 'xl') {
        return `${base} w-8 h-8 text-sm`;
      } else if (this.size === 'lg') {
        return `${base} w-7 h-7 text-xs`;
      } else {
        return `${base} w-7 h-7 text-xs`;
      }
    },
    iconClasses() {
      if (this.size === 'xl') {
        return 'w-4 h-4 transition-transform';
      } else if (this.size === 'lg') {
        return 'w-3 h-3 transition-transform';
      } else {
        return 'w-3 h-3 transition-transform';
      }
    }
  }
};
</script>

