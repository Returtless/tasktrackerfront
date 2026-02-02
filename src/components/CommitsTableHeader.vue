<template>
  <div
    class="sticky top-[75px] z-20 bg-blue-500 dark:bg-gray-700 text-white p-2 sm:p-4 rounded-t-lg relative min-h-[150px]">
    <!-- Заголовок -->
    <h1 class="text-center text-lg sm:text-xl font-bold">{{ $t('pages.commitsPage') }}</h1>

    <!-- Верхняя панель с фильтрами и кнопками -->
    <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-4 mt-2">
      <!-- Левая группа: multiselect и кнопка сортировки -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <Multiselect
          :model-value="selectedAuthors"
          @update:model-value="$emit('update:selectedAuthors', $event)"
          :options="authorOptions"
          :multiple="true"
          :show-labels="false"
          :placeholder="$t('commitsTable.filterByAuthor')"
          class="w-full sm:w-48 lg:w-64"
        />
        <button
          @click="$emit('toggle-mr-number-sort')"
          class="sort-mr-number bg-gray-300 p-2 rounded hover:bg-gray-400 whitespace-nowrap text-center text-sm">
          {{ $t('commitsTable.sortByMR') }}{{ currentSortDirection ? ` (${currentSortDirection})` : ` (${$t('commitsTable.sortOff')})` }}
        </button>
      </div>

      <!-- Средняя группа: кнопки All / Not Cherry-picked -->
      <div
        class="inline-flex w-full sm:w-auto sm:min-w-[200px] lg:w-[300px] border border-gray-400 dark:border-gray-600 rounded-lg overflow-hidden shadow-md">
        <button
          @click="$emit('update:hideWithTargetCommits', false)"
          class="flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center transition-all duration-300 whitespace-nowrap"
          :class="hideWithTargetCommits
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'
            : 'bg-blue-600 text-white hover:bg-blue-700'">
          {{ $t('commitsTable.all') }}
        </button>
        <button
          @click="$emit('update:hideWithTargetCommits', true)"
          class="flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center transition-all duration-300 whitespace-nowrap"
          :class="hideWithTargetCommits
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'">
          {{ $t('commitsTable.notCherryPicked') }}
        </button>
      </div>

      <!-- Правая группа: Cherry-pick Selected -->
      <button
        :disabled="isCherryPickDisabled"
        :class="[
          'cherry-pick flex items-center justify-center px-2 sm:px-4 py-2 rounded focus:outline-none focus:ring-2 text-xs sm:text-sm whitespace-nowrap',
          isCherryPickDisabled
            ? 'bg-green-500 opacity-50 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 text-white'
        ]"
        @click="$emit('cherry-pick-list')">
        <span v-if="loadingListButton">{{ $t('common.processing') }}</span>
        <span v-else>{{ $t('commitsTable.cherryPickSelected') }}</span>
      </button>
    </div>

    <!-- Строка состояния (полоса) -->
    <transition name="slide-fade">
      <div
        v-if="loadingButtonsSize > 0"
        class="my-2 relative w-full h-4 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
        <!-- «Бегущий» градиент -->
        <div class="absolute inset-0 bg-blue-500 dark:bg-blue-400 animate-loading"></div>

        <!-- Текст статуса поверх полосы -->
        <div class="absolute inset-0 flex items-center justify-center z-10">
          <span class="bg-black bg-opacity-50 dark:bg-opacity-70 text-white font-bold text-sm px-3 py-0.5 rounded text-shadow-md">{{ statusesLine }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect';

export default {
  name: 'CommitsTableHeader',
  components: { Multiselect },
  props: {
    selectedAuthors: {
      type: Array,
      required: true
    },
    authorOptions: {
      type: Array,
      required: true
    },
    currentSortDirection: {
      type: String,
      default: null
    },
    hideWithTargetCommits: {
      type: Boolean,
      default: false
    },
    isCherryPickDisabled: {
      type: Boolean,
      default: false
    },
    loadingListButton: {
      type: Boolean,
      default: false
    },
    loadingButtonsSize: {
      type: Number,
      default: 0
    },
    statusesLine: {
      type: String,
      default: ''
    }
  },
  emits: [
    'update:selectedAuthors',
    'update:hideWithTargetCommits',
    'toggle-mr-number-sort',
    'cherry-pick-list'
  ]
};
</script>

<style scoped>
.sort-mr-number {
  min-width: 120px;
}

.cherry-pick {
  min-width: 150px;
  height: 40px;
  line-height: 40px;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.animate-loading {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.text-shadow-md {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 2px rgba(0, 0, 0, 0.5);
}
</style>

