<template>
  <!-- Режим сортировки по MR number -->
  <tr v-if="sortMode === 'mr'" :key="`${item.task.key}-${item.commit.mrNumber}`" class="border-b">
    <!-- Select -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <input
        v-if="!item.commit.transferred"
        type="checkbox"
        :checked="tasksStore.selectedCommits?.has(item.commit?.mrNumber)"
        @change="item.commit?.mrNumber && $emit('toggle-commit-selection', item.commit.mrNumber)"
      />
    </td>
    <!-- Issue Key -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <button
        @click="openLink(`${jiraBrowseUrl}${item.task.key}`)"
        class="bg-orange-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 whitespace-nowrap truncate text-xs sm:text-sm">
        {{ item.task.key }}
      </button>
    </td>
    <!-- Improvement Status -->
    <td
      class="p-1 sm:p-1.5 lg:p-3 text-center align-middle"
      :title="(item.task.status || '') + (item.task.improvementName ? ' - ' + item.task.improvementName : '')">
      <span v-if="getStatusIcon(item.task.status)" class="text-base sm:text-lg lg:text-xl inline-block">
        {{ getStatusIcon(item.task.status) }}
      </span>
    </td>
    <!-- Date -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center whitespace-nowrap text-xs sm:text-sm lg:text-base">
      <template v-if="getDisplayDateForTask(item.task)">
        <span class="lg:hidden">{{ formatDateCompact(getDisplayDateForTask(item.task), $t) }}</span>
        <span class="hidden lg:inline">{{ formatDateFull(getDisplayDateForTask(item.task), $t) }}</span>
      </template>
      <span v-else>{{ $t('common.notAvailable') }}</span>
    </td>
    <!-- Source Commits -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <div class="flex items-center justify-center gap-0.5 sm:gap-1">
        <button
          v-if="item.commit?.mrNumber"
          @click="openLink(item.commit.url)"
          :class="item.commit.transferred
            ? 'bg-green-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-green-600 text-xs sm:text-sm'
            : 'bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-red-600 text-xs sm:text-sm'">
          {{ item.commit?.mrNumber }}
        </button>
        <button
          v-if="item.commit?.commit?.webUrl"
          @click="openLink(item.commit.commit.webUrl)"
          class="bg-purple-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center">
          🔗
        </button>
      </div>
    </td>
    <!-- Author -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center align-middle whitespace-nowrap text-xs sm:text-sm lg:text-base hidden lg:table-cell">
      {{ item.commit?.commit?.authorEmail?.split('@')[0] || $t('common.unknown') }}
    </td>
    <!-- Target Commits -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <div v-if="item.task.releaseCommits" class="flex items-center justify-center gap-0.5 sm:gap-1">
        <template v-for="releaseCommit in Object.values(item.task.releaseCommits)" :key="releaseCommit?.mrNumber">
          <button
            v-if="releaseCommit?.mrNumber === item.commit.mrNumber"
            @click="openLink(releaseCommit.url)"
            class="bg-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm">
            {{ releaseCommit?.mrNumber }}
          </button>
        </template>
      </div>
    </td>
    <!-- Cherry-pick -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <button
        v-if="!item.commit.transferred"
        :disabled="tasksStore.loadingButtons.has(item.commit.mrNumber)"
        @click="$emit('cherry-pick-request', item.commit.mrNumber, item.task.key)"
        :title="tasksStore.loadingButtons.has(item.commit.mrNumber) ? $t('common.processing') : $t('commitsTable.cherryPick')"
        class="relative flex justify-center items-center w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded text-white transition-all duration-300 ease-in-out"
        :class="[
          tasksStore.loadingButtons.has(item.commit.mrNumber) ? 'bg-red-500' : 'bg-green-500 hover:bg-green-600'
        ]">
        <span class="text-base sm:text-lg lg:text-xl">
          {{ tasksStore.loadingButtons.has(item.commit.mrNumber) ? '⏳' : '→' }}
        </span>
      </button>
    </td>
  </tr>

  <!-- Обычный режим: группировка по задачам -->
  <tr v-else :key="task.key" class="border-b">
    <!-- Select -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <ul class="list-none space-y-1 sm:space-y-1.5">
        <li
          v-for="(commit, index) in (task.commits ? filteredCommits(task.commits) : [])"
          :key="commit?.mrNumber || index">
          <input
            v-if="!commit.transferred"
            type="checkbox"
            :checked="tasksStore.selectedCommits?.has(commit?.mrNumber)"
            @change="commit?.mrNumber && $emit('toggle-commit-selection', commit.mrNumber)"
          />
        </li>
      </ul>
    </td>
    <!-- Issue Key -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <button
        @click="openLink(`${jiraBrowseUrl}${task.key}`)"
        class="bg-orange-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 whitespace-nowrap truncate text-xs sm:text-sm">
        {{ task.key }}
      </button>
    </td>
    <!-- Improvement Status -->
    <td
      class="p-1 sm:p-1.5 lg:p-3 text-center align-middle"
      :title="(task.status || '') + (task.improvementName ? ' - ' + task.improvementName : '')">
      <span v-if="getStatusIcon(task.status)" class="text-base sm:text-lg lg:text-xl inline-block">
        {{ getStatusIcon(task.status) }}
      </span>
    </td>
    <!-- Date -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center whitespace-nowrap text-xs sm:text-sm lg:text-base hidden lg:table-cell">
      <template v-if="getDisplayDateForTask(task)">
        <span>{{ formatDateFull(getDisplayDateForTask(task), $t) }}</span>
      </template>
      <span v-else>{{ $t('common.notAvailable') }}</span>
    </td>
    <!-- Source Commits -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <div class="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
        <template v-for="(commit, index) in (task.commits ? filteredCommits(task.commits) : [])" :key="commit?.mrNumber || index">
          <button
            v-if="commit?.mrNumber"
            @click="openLink(commit.url)"
            :class="commit.transferred
              ? 'bg-green-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-green-600 text-xs sm:text-sm'
              : 'bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-red-600 text-xs sm:text-sm'">
            {{ commit?.mrNumber }}
          </button>
          <button
            v-if="commit?.commit?.webUrl"
            @click="openLink(commit.commit.webUrl)"
            class="bg-purple-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center">
            🔗
          </button>
        </template>
      </div>
    </td>
    <!-- Author -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center align-middle whitespace-nowrap text-xs sm:text-sm lg:text-base hidden lg:table-cell">
      {{ filteredCommits(task.commits)[0]?.commit?.authorEmail?.split('@')[0] || $t('common.unknown') }}
    </td>
    <!-- Target Commits -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <div v-if="task.releaseCommits && Object.values(task.releaseCommits).length > 0" class="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
        <template v-for="releaseCommit in Object.values(task.releaseCommits)" :key="releaseCommit?.mrNumber">
          <button
            v-if="releaseCommit?.mrNumber"
            @click="openLink(releaseCommit.url)"
            class="bg-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm">
            {{ releaseCommit?.mrNumber }}
          </button>
        </template>
      </div>
    </td>
    <!-- Cherry-pick -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <div class="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
        <template v-for="(commit, index) in (task.commits ? filteredCommits(task.commits) : [])" :key="commit?.mrNumber || index">
          <button
            v-if="!commit.transferred"
            :disabled="tasksStore.loadingButtons.has(commit.mrNumber)"
            @click="$emit('cherry-pick-request', commit.mrNumber, task.key)"
            :title="tasksStore.loadingButtons.has(commit.mrNumber) ? $t('common.processing') : $t('commitsTable.cherryPick')"
            class="w-8 h-8 rounded text-white flex items-center justify-center flex-shrink-0"
            :class="[
              tasksStore.loadingButtons.has(commit.mrNumber) ? 'bg-red-500' : 'bg-green-500 hover:bg-green-600'
            ]">
            <span class="text-lg">{{ tasksStore.loadingButtons.has(commit.mrNumber) ? '⏳' : '→' }}</span>
          </button>
        </template>
      </div>
    </td>
  </tr>
</template>

<script>
import { getDisplayDateForTask, formatDateCompact, formatDateFull } from '@/utils/dateUtils';
import { getStatusIcon } from '@/utils/statusUtils';

export default {
  name: 'CommitRow',
  props: {
    item: {
      type: Object,
      default: null
    },
    task: {
      type: Object,
      default: null
    },
    tasksStore: {
      type: Object,
      required: true
    },
    jiraBrowseUrl: {
      type: String,
      required: true
    },
    sortMode: {
      type: String,
      default: 'normal', // 'normal' или 'mr'
      validator: (value) => ['normal', 'mr'].includes(value)
    },
    filteredCommits: {
      type: Function,
      required: true
    }
  },
  emits: ['toggle-commit-selection', 'cherry-pick-request'],
  methods: {
    getDisplayDateForTask,
    formatDateCompact,
    formatDateFull,
    getStatusIcon,
    openLink(url) {
      window.open(url, '_blank');
    }
  }
};
</script>

