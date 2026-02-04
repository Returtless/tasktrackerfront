<template>
  <div class="relative">
    <button
      @click.stop="$emit('toggle-menu')"
      :class="buttonClasses"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
      <span :class="textClasses">{{ buttonText }}</span>
      <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Options Dropdown Menu -->
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
        :class="menuClasses"
      >
        <!-- Selection Mode -->
        <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{{ $t('toolbar.selectionMode') }}</label>
          <div class="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-1">
            <button
              @click="updateSelectionMode('patch')"
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                selectionMode === 'patch'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              ]"
            >
              {{ $t('toolbar.patch') }}
            </button>
            <button
              @click="updateSelectionMode('recentMR')"
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                selectionMode === 'recentMR'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              ]"
            >
              MR
            </button>
          </div>
        </div>

        <!-- Patch Selector -->
        <div v-if="selectionMode === 'patch'" class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{{ $t('toolbar.patch') }}</label>
          <div class="relative">
            <select :value="patchNumber" @change="$emit('update:patch-number', $event.target.value)"
              :class="selectClasses"
              :disabled="patchesLoading || !selectedProjectId">
              <option value="" disabled>
                {{ patchesLoading ? $t('common.loading') : $t('toolbar.selectPatch') }}
              </option>
              <option v-for="patch in patches" :key="patch.key || patch.id" :value="patch.key || patch.id">
                {{ patch.summary || patch.name || patch.key || patch.id }}
              </option>
            </select>
            <div v-if="patchesLoading" 
              class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- MR Count Selector -->
        <div v-if="selectionMode === 'recentMR'" class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{{ $t('toolbar.mrCount') }}</label>
          <select :value="mrCount" @change="$emit('update:mr-count', parseInt($event.target.value))"
            :class="selectClasses"
            :disabled="!selectedProjectId">
            <option value="10">10 MR</option>
            <option value="25">25 MR</option>
            <option value="50">50 MR</option>
          </select>
        </div>

        <!-- Force Refresh -->
        <div class="px-4 py-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" :checked="forceRefresh" @change="$emit('update:force-refresh', $event.target.checked)" :class="checkboxClasses" />
            <span :class="labelClasses">{{ $t('toolbar.forceRefresh') }}</span>
            <span v-if="showCacheHint" :class="hintClasses" :title="forceRefresh ? $t('toolbar.forceRefresh') + ' (' + $t('toolbar.ignoresCache') + ')' : $t('toolbar.refresh') + ' (' + $t('toolbar.usesCache') + ')'">
              ({{ forceRefresh ? $t('toolbar.ignoresCache') : $t('toolbar.usesCache') }})
            </span>
          </label>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'OptionsMenu',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    selectionMode: {
      type: String,
      required: true
    },
    patchNumber: {
      type: String,
      required: true
    },
    mrCount: {
      type: Number,
      required: true
    },
    forceRefresh: {
      type: Boolean,
      required: true
    },
    patches: {
      type: Array,
      default: () => []
    },
    patchesLoading: {
      type: Boolean,
      default: false
    },
    selectedProjectId: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'xl', // 'xl', 'lg', 'mobile'
      validator: (value) => ['xl', 'lg', 'mobile'].includes(value)
    }
  },
  emits: ['toggle-menu', 'update:selection-mode', 'update:patch-number', 'update:mr-count', 'update:force-refresh'],
  computed: {
    buttonClasses() {
      const base = 'flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';
      if (this.size === 'xl') {
        return `${base} px-4 py-2`;
      } else if (this.size === 'lg') {
        return `${base} px-3 py-2 text-sm`;
      } else {
        return `${base} px-3 py-2 w-full justify-between`;
      }
    },
    textClasses() {
      if (this.size === 'xl') {
        return 'text-sm font-medium';
      } else if (this.size === 'lg') {
        return 'text-xs font-medium';
      } else {
        return 'text-sm font-medium';
      }
    },
    buttonText() {
      if (this.size === 'mobile') {
        return this.$t('toolbar.options');
      }
      return this.size === 'lg' ? 'Options' : this.$t('toolbar.options');
    },
    menuClasses() {
      const base = 'absolute mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50';
      if (this.size === 'xl') {
        return `${base} right-0 w-72`;
      } else if (this.size === 'lg') {
        return `${base} right-0 w-64`;
      } else {
        return `${base} left-0 right-0`;
      }
    },
    labelClasses() {
      return this.size === 'lg' ? 'text-xs text-gray-700 dark:text-gray-300' : 'text-sm text-gray-700 dark:text-gray-300';
    },
    selectClasses() {
      const base = 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
      return this.size === 'lg' ? `${base} text-xs` : `${base} text-sm`;
    },
    checkboxClasses() {
      return this.size === 'lg' ? 'w-3 h-3 text-blue-600 rounded focus:ring-blue-500' : 'w-4 h-4 text-blue-600 rounded focus:ring-blue-500';
    },
    hintClasses() {
      return 'text-xs text-gray-500 dark:text-gray-400 ml-auto';
    },
    showCacheHint() {
      return this.size === 'xl';
    }
  },
  methods: {
    updateSelectionMode(mode) {
      if (this.selectionMode !== mode) {
        this.$emit('update:selection-mode', mode);
      }
    }
  }
};
</script>

