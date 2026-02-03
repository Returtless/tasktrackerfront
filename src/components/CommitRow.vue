<template>
  <!-- Режим сортировки по MR number -->
  <tr v-if="sortMode === 'mr'" :key="`${item.mrNumber}`" class="border-b">
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
      <div class="flex items-center justify-center gap-1 flex-wrap">
        <button
          v-for="task in item.tasks"
          :key="task.key"
          @click="openLink(`${jiraBrowseUrl}${task.key}`)"
          class="bg-orange-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 whitespace-nowrap text-xs sm:text-sm">
          {{ task.key }}
        </button>
      </div>
    </td>
    <!-- Improvement Status -->
    <td
      class="p-1 sm:p-1.5 lg:p-3 text-center align-middle"
      :title="item.tasks.map(t => (t.status || '') + (t.improvementName ? ' - ' + t.improvementName : '')).join('; ')">
      <div class="flex items-center justify-center gap-1 flex-wrap">
        <template v-for="task in item.tasks" :key="task.key">
          <span
            v-if="getStatusIcon(task.status)"
            class="text-base sm:text-lg lg:text-xl inline-block"
            :title="(task.status || '') + (task.improvementName ? ' - ' + task.improvementName : '')">
            {{ getStatusIcon(task.status) }}
          </span>
        </template>
      </div>
    </td>
    <!-- Date -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center whitespace-nowrap text-xs sm:text-sm lg:text-base">
      <template v-if="item.tasks.length > 0 && getDisplayDateForTask(item.tasks[0])">
        <span class="lg:hidden">{{ formatDateCompact(getDisplayDateForTask(item.tasks[0]), $t) }}</span>
        <span class="hidden lg:inline">{{ formatDateFull(getDisplayDateForTask(item.tasks[0]), $t) }}</span>
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
      <div class="flex items-center justify-center gap-0.5 sm:gap-1">
        <!-- DEBUG: проверяем данные -->
        <template v-if="false">
          <div style="font-size: 10px; color: red;">
            MR: {{ item.mrNumber }}, Tasks: {{ item.tasks?.length }}, 
            Task0 releaseCommits: {{ item.tasks?.[0]?.releaseCommits?.length }}
          </div>
        </template>
        <template v-if="targetCommit">
          <button
            @click="openLink(targetCommit.url)"
            class="bg-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm">
            {{ targetCommit?.mrNumber }}
          </button>
          <button
            v-if="targetCommit?.commit?.webUrl"
            @click="openLink(targetCommit.commit.webUrl)"
            class="bg-purple-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center">
            🔗
          </button>
        </template>
      </div>
    </td>
    <!-- Cherry-pick -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <button
        v-if="!item.commit.transferred"
        :disabled="tasksStore.loadingButtons.has(item.commit.mrNumber)"
        @click="$emit('cherry-pick-request', item.commit.mrNumber, item.tasks[0]?.key)"
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
          :key="commit?.mrNumber || index"
          class="min-h-[28px] sm:min-h-[32px] flex items-center justify-center">
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
      <ul class="list-none space-y-1 sm:space-y-1.5">
        <li
          v-for="(commit, idx) in (task.commits ? filteredCommits(task.commits) : [])"
          :key="commit?.mrNumber || idx"
          class="min-h-[28px] sm:min-h-[32px] flex items-center justify-center gap-0.5 sm:gap-1">
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
        </li>
      </ul>
    </td>
    <!-- Author -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center align-middle text-xs sm:text-sm lg:text-base hidden lg:table-cell">
      <ul class="list-none space-y-1 sm:space-y-1.5">
        <li
          v-for="(commit, idx) in (task.commits ? filteredCommits(task.commits) : [])"
          :key="commit?.mrNumber || idx"
          class="min-h-[28px] sm:min-h-[32px] flex items-center justify-center whitespace-nowrap">
          {{ commit?.commit?.authorEmail?.split('@')[0] || $t('common.unknown') }}
        </li>
      </ul>
    </td>
    <!-- Target Commits -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <ul class="list-none space-y-1 sm:space-y-1.5">
        <li
          v-for="(commit, idx) in (task.commits ? filteredCommits(task.commits) : [])"
          :key="commit?.mrNumber || idx"
          class="min-h-[28px] sm:min-h-[32px] flex items-center justify-center gap-0.5 sm:gap-1">
          <!-- DEBUG: логируем данные -->
          <template v-if="false">
            <div style="font-size: 8px; color: red;">
              Commit MR: {{ commit?.mrNumber }}, 
              Task releaseCommits: {{ task.releaseCommits?.length }},
              ReleaseCommits: {{ JSON.stringify(task.releaseCommits?.map(rc => rc?.mrNumber)) }}
            </div>
          </template>
          <!-- Показываем matchedReleaseCommit для каждого коммита (привязка с бэкенда) -->
          <template v-if="commit?.matchedReleaseCommit">
            <button
              @click="openLink(commit.matchedReleaseCommit.url)"
              class="bg-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm">
              {{ commit.matchedReleaseCommit?.mrNumber }}
            </button>
            <button
              v-if="commit.matchedReleaseCommit?.commit?.webUrl"
              @click="openLink(commit.matchedReleaseCommit.commit.webUrl)"
              class="bg-purple-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center"
              title="Open commit web URL">
              🔗
            </button>
          </template>
        </li>
      </ul>
    </td>
    <!-- Cherry-pick -->
    <td class="p-1 sm:p-1.5 lg:p-3 text-center">
      <ul class="list-none space-y-1 sm:space-y-1.5">
        <li
          v-for="(commit, index) in (task.commits ? filteredCommits(task.commits) : [])"
          :key="commit?.mrNumber || index"
          class="min-h-[28px] sm:min-h-[32px] flex items-center justify-center">
          <button
            v-if="!commit.transferred"
            :disabled="tasksStore.loadingButtons.has(commit.mrNumber)"
            @click="$emit('cherry-pick-request', commit.mrNumber, task.key)"
            :title="tasksStore.loadingButtons.has(commit.mrNumber) ? $t('common.processing') : $t('commitsTable.cherryPick')"
            class="relative flex justify-center items-center w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded text-white transition-all duration-300 ease-in-out"
            :class="[
              tasksStore.loadingButtons.has(commit.mrNumber) ? 'bg-red-500' : 'bg-green-500 hover:bg-green-600'
            ]">
            <span class="text-base sm:text-lg lg:text-xl">
              {{ tasksStore.loadingButtons.has(commit.mrNumber) ? '⏳' : '→' }}
            </span>
          </button>
        </li>
      </ul>
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
  computed: {
    targetCommit() {
      if (this.sortMode === 'mr' && this.item) {
        console.log('=== COMPUTED targetCommit called ===', this.item);
        const result = this.getTargetCommitForMr(this.item);
        console.log('=== COMPUTED targetCommit result:', result);
        return result;
      }
      return null;
    }
  },
  mounted() {
    console.log('CommitRow mounted, sortMode:', this.sortMode, 'item:', this.item, 'task:', this.task);
    if (this.sortMode === 'mr') {
      console.log('=== MR MODE DETECTED ===');
      console.log('item:', this.item);
      console.log('item.mrNumber:', this.item?.mrNumber);
      console.log('item.tasks:', this.item?.tasks);
      console.log('item.tasks length:', this.item?.tasks?.length);
      if (this.item?.tasks) {
        this.item.tasks.forEach((task, idx) => {
          console.log(`  Task ${idx}:`, task.key, 'releaseCommits:', task.releaseCommits, 'length:', task.releaseCommits?.length);
          if (task.releaseCommits && task.releaseCommits.length > 0) {
            task.releaseCommits.forEach((rc, rcIdx) => {
              console.log(`    ReleaseCommit ${rcIdx}:`, rc?.mrNumber, 'type:', typeof rc?.mrNumber, 'equals item.mrNumber?', rc?.mrNumber == this.item?.mrNumber);
            });
          }
        });
      }
    } else {
      console.log('=== NORMAL MODE ===');
      console.log('task:', this.task);
      console.log('task.key:', this.task?.key);
      console.log('task.releaseCommits:', this.task?.releaseCommits);
      console.log('task.releaseCommits length:', this.task?.releaseCommits?.length);
      if (this.task?.releaseCommits) {
        this.task.releaseCommits.forEach((rc, idx) => {
          console.log(`  ReleaseCommit ${idx}:`, rc?.mrNumber, 'url:', rc?.url);
        });
      }
      if (this.task?.commits) {
        const commitsArray = this.filteredCommits(this.task.commits);
        console.log('task.commits (filtered):', commitsArray);
        console.log('All commits in task (unfiltered):', Object.values(this.task.commits || {}));
        commitsArray.forEach((commit, idx) => {
          console.log(`  Commit ${idx}:`, commit?.mrNumber, 'type:', typeof commit?.mrNumber, 'full commit:', commit);
          if (this.task?.releaseCommits) {
            const matching = this.task.releaseCommits.find(rc => rc?.mrNumber == commit?.mrNumber);
            console.log(`    Matching releaseCommit for commit ${commit?.mrNumber}:`, matching);
            if (!matching) {
              console.log(`    No match found. Available releaseCommits:`, this.task.releaseCommits.map(rc => rc?.mrNumber));
            }
          }
        });
        // Проверяем обратное - для каждого releaseCommit ищем соответствующий commit
        if (this.task?.releaseCommits) {
          this.task.releaseCommits.forEach((rc, idx) => {
            const matchingCommit = commitsArray.find(c => c?.mrNumber == rc?.mrNumber);
            console.log(`  ReleaseCommit ${idx} (${rc?.mrNumber}) matching commit:`, matchingCommit);
          });
        }
      }
    }
  },
  methods: {
    getDisplayDateForTask,
    formatDateCompact,
    formatDateFull,
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

