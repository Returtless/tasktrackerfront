<template>
  <!-- Режим сортировки по MR number -->
  <div
    v-if="sortMode === 'mr'"
    :key="`card-${item.mrNumber}`"
    class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
    <!-- Заголовок: Issue Key + Improvement Status + Checkbox -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 flex-wrap">
        <input
          v-if="!item.commit.transferred"
          type="checkbox"
          :checked="tasksStore.selectedCommits?.has(item.commit?.mrNumber)"
          @change="item.commit?.mrNumber && $emit('toggle-commit-selection', item.commit.mrNumber)"
          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <button
          v-for="task in item.tasks"
          :key="task.key"
          @click="openLink(`${jiraBrowseUrl}${task.key}`)"
          class="bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 text-xs font-medium">
          {{ task.key }}
        </button>
      </div>
      <div class="flex items-center gap-1 flex-wrap">
        <template v-for="task in item.tasks" :key="task.key">
          <span
            v-if="getStatusIcon(task.status)"
            class="text-xl"
            :title="(task.status || '') + (task.improvementName ? ' - ' + task.improvementName : '')">
            {{ getStatusIcon(task.status) }}
          </span>
        </template>
      </div>
    </div>
    <!-- Source Commits -->
    <div class="mb-3">
      <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{{ $t('commitsTable.sourceCommits') }}</div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          v-if="item.commit?.mrNumber"
          @click="openLink(item.commit.url)"
          :class="item.commit.transferred
            ? 'bg-green-500 text-white px-2 py-1 rounded text-xs font-medium'
            : 'bg-red-500 text-white px-2 py-1 rounded text-xs font-medium'">
          MR {{ item.commit?.mrNumber }}
        </button>
        <button
          v-if="item.commit?.commit?.webUrl"
          @click="openLink(item.commit.commit.webUrl)"
          class="bg-purple-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-purple-600">
          🔗
        </button>
        <button
          v-if="!item.commit.transferred"
          :disabled="tasksStore.loadingButtons.has(item.commit.mrNumber)"
          @click="$emit('cherry-pick-request', item.commit.mrNumber, item.tasks[0]?.key)"
          :title="tasksStore.loadingButtons.has(item.commit.mrNumber) ? $t('common.processing') : $t('commitsTable.cherryPick')"
          class="w-8 h-8 rounded text-white flex items-center justify-center flex-shrink-0"
          :class="[
            tasksStore.loadingButtons.has(item.commit.mrNumber) ? 'bg-red-500' : 'bg-green-500 hover:bg-green-600'
          ]">
          <span class="text-lg">{{ tasksStore.loadingButtons.has(item.commit.mrNumber) ? '⏳' : '→' }}</span>
        </button>
      </div>
    </div>
    <!-- Target Commits -->
    <div
      v-if="targetCommit"
      class="mb-3">
      <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{{ $t('commitsTable.targetCommits') }}</div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          @click="openLink(targetCommit.url)"
          class="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-600">
          MR {{ targetCommit?.mrNumber }}
        </button>
        <button
          v-if="targetCommit?.commit?.webUrl"
          @click="openLink(targetCommit.commit.webUrl)"
          class="bg-purple-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-purple-600">
          🔗
        </button>
      </div>
    </div>
    <!-- Author + Date -->
    <div class="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-600">
      <span class="text-gray-600 dark:text-gray-400">
        👤 {{ item.commit?.commit?.authorEmail?.split('@')[0] || $t('common.unknown') }}
      </span>
      <span class="text-gray-500 dark:text-gray-400">
        📅 {{ item.tasks.length > 0 && getDisplayDateForTask(item.tasks[0]) ? formatDateCompact(getDisplayDateForTask(item.tasks[0]), $t) : $t('common.notAvailable') }}
      </span>
    </div>
  </div>

  <!-- Обычный режим: группировка по задачам -->
  <div
    v-else
    :key="`card-${task.key}`"
    class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
    <!-- Заголовок: Issue Key + Improvement Status + Checkbox -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <input
          v-if="task.commits && filteredCommits(task.commits).some(c => !c.transferred)"
          type="checkbox"
          :checked="task.commits && filteredCommits(task.commits).every(c => c.transferred || tasksStore.selectedCommits?.has(c?.mrNumber))"
          @change="task.commits && $emit('toggle-task-selection', filteredCommits(task.commits).filter(c => !c.transferred).map(c => c.mrNumber))"
          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <button
          @click="openLink(`${jiraBrowseUrl}${task.key}`)"
          class="bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 text-xs font-medium">
          {{ task.key }}
        </button>
      </div>
      <span
        v-if="getStatusIcon(task.status)"
        class="text-xl"
        :title="(task.status || '') + (task.improvementName ? ' - ' + task.improvementName : '')">
        {{ getStatusIcon(task.status) }}
      </span>
    </div>
    <!-- Source Commits -->
    <div v-if="task.commits && filteredCommits(task.commits).length > 0" class="mb-3">
      <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{{ $t('commitsTable.sourceCommits') }}</div>
      <div class="space-y-2">
        <template v-for="(commit, idx) in filteredCommits(task.commits)" :key="commit?.mrNumber || idx">
          <div class="flex items-center gap-2 flex-wrap">
            <input
              v-if="!commit.transferred"
              type="checkbox"
              :checked="tasksStore.selectedCommits?.has(commit?.mrNumber)"
              @change="commit?.mrNumber && $emit('toggle-commit-selection', commit.mrNumber)"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <button
              v-if="commit?.mrNumber"
              @click="openLink(commit.url)"
              :class="commit.transferred
                ? 'bg-green-500 text-white px-2 py-1 rounded text-xs font-medium'
                : 'bg-red-500 text-white px-2 py-1 rounded text-xs font-medium'">
              MR {{ commit?.mrNumber }}
            </button>
            <button
              v-if="commit?.commit?.webUrl"
              @click="openLink(commit.commit.webUrl)"
              class="bg-purple-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-purple-600">
              🔗
            </button>
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
          </div>
        </template>
      </div>
    </div>
    <!-- Target Commits -->
    <div v-if="task.commits && filteredCommits(task.commits).some(c => c?.matchedReleaseCommit)" class="mb-3">
      <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{{ $t('commitsTable.targetCommits') }}</div>
      <div class="flex items-center gap-2 flex-wrap">
        <template v-for="(commit, idx) in filteredCommits(task.commits)" :key="commit?.mrNumber || idx">
          <template v-if="commit?.matchedReleaseCommit">
            <button
              @click="openLink(commit.matchedReleaseCommit.url)"
              class="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-600">
              MR {{ commit.matchedReleaseCommit?.mrNumber }}
            </button>
            <button
              v-if="commit.matchedReleaseCommit?.commit?.webUrl"
              @click="openLink(commit.matchedReleaseCommit.commit.webUrl)"
              class="bg-purple-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-purple-600">
              🔗
            </button>
          </template>
        </template>
      </div>
    </div>
    <!-- Author + Date -->
    <div
      v-if="task.commits && filteredCommits(task.commits).length > 0"
      class="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-600">
      <span class="text-gray-600 dark:text-gray-400">
        👤 {{ filteredCommits(task.commits)[0]?.commit?.authorEmail?.split('@')[0] || $t('common.unknown') }}
      </span>
      <span class="text-gray-500 dark:text-gray-400">
        📅 {{ getDisplayDateForTask(task) ? formatDateCompact(getDisplayDateForTask(task), $t) : $t('common.notAvailable') }}
      </span>
    </div>
  </div>
</template>

<script>
import { getDisplayDateForTask, formatDateCompact } from '@/utils/dateUtils';
import { getStatusIcon } from '@/utils/statusUtils';

export default {
  name: 'CommitCard',
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
  emits: ['toggle-commit-selection', 'toggle-task-selection', 'cherry-pick-request'],
  computed: {
    targetCommit() {
      if (this.sortMode === 'mr' && this.item) {
        console.log('=== COMPUTED targetCommit (Card) called ===');
        const result = this.getTargetCommitForMr(this.item);
        console.log('=== COMPUTED targetCommit (Card) result:', result);
        return result;
      }
      return null;
    }
  },
  methods: {
    getDisplayDateForTask,
    formatDateCompact,
    getStatusIcon,
    openLink(url) {
      window.open(url, '_blank');
    },
    normalizeMrNumber(mrNumber) {
      if (mrNumber === null || mrNumber === undefined || mrNumber === '') {
        return '';
      }
      // Приводим к строке, обрезаем пробелы, затем к числу и обратно к строке для единообразия
      const str = String(mrNumber).trim();
      const num = parseInt(str, 10);
      return isNaN(num) ? str : String(num);
    },
    getTargetCommitForMr(item) {
      // Используем matchedReleaseCommit из item.commit (привязка с бэкенда)
      if (item.commit?.matchedReleaseCommit) {
        return item.commit.matchedReleaseCommit;
      }
      return null;
    }
  }
};
</script>

