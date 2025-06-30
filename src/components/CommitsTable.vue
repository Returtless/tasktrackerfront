<template>
    <!-- Контейнер для таблицы, центрируем с container mx-auto -->
    <div class="commits-table container mx-auto py-8 px-4">

        <!-- Состояния загрузки/ошибки/пустых данных те же -->
        <div v-if="tasksStore.loading"
            class="mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg w-[1200px] p-4 text-center">
            <svg class="animate-spin h-6 w-6 text-blue-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
        </div>
        <div v-else-if="tasksStore.error"
            class="mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg w-[1200px] p-4 text-center text-red-500">
            {{ tasksStore.error }}
        </div>
        <div v-else-if="localFilteredTasks.length === 0"
            class="mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg w-[1200px] p-4 text-center">
            <p class="text-gray-600">Нет данных для отображения</p>
        </div>

        <!-- Сама таблица, если есть данные -->
        <div v-else class="mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg w-[1200px]">

            <!-- Шапка таблицы (заголовок Commits Page, фильтры, Cherry-pick Selected) -->
            <div
                class="sticky top-[75px] z-20 bg-blue-500 dark:bg-gray-700 text-white p-4 rounded-t-lg relative min-h-[150px]">
                <!-- Заголовок -->
                <h1 class="text-center text-xl font-bold">Commits Page</h1>

                <!-- Верхняя панель с фильтрами и кнопками -->
                <div class="flex items-center justify-between mt-2">
                    <!-- Левая группа: multiselect и кнопка сортировки -->
                    <div class="flex items-center space-x-4">
                        <Multiselect v-model="localSelectedAuthors" :options="authorOptions" :multiple="true"
                            :show-labels="false" placeholder="Filter by Author" class="w-64" />
                        <button @click="$emit('toggle-date-sort')"
                            class="sort-date bg-gray-300 p-2 rounded hover:bg-gray-400 whitespace-nowrap text-center">
                            Sort by Date ({{ sortDirection.date }})
                        </button>
                    </div>

                    <!-- Средняя группа: кнопки All / Not Cherry-picked -->
                    <div
                        class="inline-flex w-[300px] border border-gray-400 dark:border-gray-600 rounded-lg overflow-hidden shadow-md">
                        <button @click="hideWithTargetCommits = false"
                            class="flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center transition-all duration-300 whitespace-nowrap"
                            :class="hideWithTargetCommits
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'
                                : 'bg-blue-600 text-white hover:bg-blue-700'">
                            All
                        </button>
                        <button @click="hideWithTargetCommits = true"
                            class="flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center transition-all duration-300 whitespace-nowrap"
                            :class="hideWithTargetCommits
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'">
                            Not cherry-picked
                        </button>
                    </div>

                    <!-- Правая группа: Cherry-pick Selected -->
                    <button :disabled="isCherryPickDisabled" :class="[
                        'cherry-pick flex items-center justify-center px-4 py-2 rounded focus:outline-none focus:ring-2',
                        isCherryPickDisabled
                            ? 'bg-green-500 opacity-50 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                    ]" @click="$emit('cherry-pick-list')">
                        <span v-if="tasksStore.loadingListButton">Processing...</span>
                        <span v-else>Cherry-pick Selected</span>
                    </button>
                </div>

                <!-- Строка состояния (полоса) -->
                <transition name="slide-fade">
                    <div v-if="tasksStore.loadingButtons.size > 0"
                        class="my-2 relative w-full h-4 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                        <!-- «Бегущий» градиент -->
                        <div class="absolute inset-0 bg-blue-500 dark:bg-blue-400 animate-loading"></div>

                        <!-- Текст статуса поверх полосы -->
                        <div class="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm">
                            <span>{{ statusesLine }}</span>
                        </div>
                    </div>
                </transition>
            </div>

            <!-- Таблица с зафиксированным thead -->
            <table class="table-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 w-full">
                <thead class="sticky top-[225px] z-30 bg-white dark:bg-gray-700">
                    <tr>
                        <th class="border-b p-4 text-center w-1/20">Select</th>
                        <th class="border-b p-4 text-center w-3/20">Issue Key</th>
                        <th class="border-b p-4 text-center w-3/20">Improvement Status</th>
                        <th class="border-b p-4 text-center w-1/10">Date</th>
                        <th class="border-b p-4 text-center w-3/20">Source Commits</th>
                        <th class="border-b p-4 text-center w-1/10">Author</th>
                        <th class="border-b p-4 text-center w-3/20">Target Commits</th>
                        <th class="border-b p-4 text-center w-3/20">Cherry-pick</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="task in localFilteredTasks" :key="task.key" class="border-b">
                        <!-- Select -->
                        <td class="p-4 text-center">
                            <ul class="list-none space-y-2">
                                <li v-for="(commit, index) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || index">
                                    <!-- Чекбокс отображаем ТОЛЬКО если transferred === false -->
                                    <input v-if="!commit.transferred" type="checkbox"
                                        :checked="tasksStore.selectedCommits?.has(commit?.mrNumber)"
                                        @change="commit?.mrNumber && $emit('toggle-commit-selection', commit.mrNumber)" />
                                </li>
                            </ul>
                        </td>
                        <!-- Issue Key -->
                        <td class="p-4 text-center">
                            <button @click="openLink(`https://job-jira.otr.ru/browse/${task.key}`)"
                                class="bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 whitespace-nowrap truncate">
                                {{ task.key }}
                            </button>
                        </td>
                        <!-- Improvement Status -->
                        <td class="p-4 text-center align-middle" :title="task.improvementName">
                            {{ task.status }}
                        </td>
                        <!-- Date -->
                        <td class="p-4 text-center whitespace-nowrap">
                            {{ getDisplayDateForTask(task) ? formatDate(getDisplayDateForTask(task)) : 'N/A' }}
                        </td>
                        <!-- Source Commits -->
                        <td class="p-4 text-center">
                            <ul class="list-none space-y-2">
                                <li v-for="(commit, idx) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || idx" class="flex items-center justify-center space-x-1">
                                    <button v-if="commit?.mrNumber" @click="openLink(commit.url)" :class="commit.transferred
                                        ? 'bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600'
                                        : 'bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600'">
                                        MR #{{ commit?.mrNumber }}
                                    </button>
                                    <button v-if="commit?.commit?.webUrl" @click="openLink(commit.commit.webUrl)"
                                        class="bg-purple-500 text-white w-6 h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center">
                                        🔗
                                    </button>
                                </li>
                            </ul>
                        </td>
                        <!-- Author -->
                        <td class="p-4 text-center align-middle">
                            <ul class="list-none space-y-2">
                                <li v-for="(commit, idx) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || idx" class="whitespace-nowrap">
                                    {{ commit?.commit?.authorEmail?.split('@')[0] || 'Unknown' }}
                                </li>
                            </ul>
                        </td>
                        <!-- Target Commits -->
                        <td class="p-4 text-center">
                            <ul class="list-none space-y-2">
                                <li v-for="(commit, idx) in (task.releaseCommits ? Object.values(task.releaseCommits) : [])"
                                    :key="commit?.mrNumber || idx" class="flex items-center justify-center space-x-1">
                                    <button v-if="commit?.mrNumber" @click="openLink(commit.url)"
                                        class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        MR #{{ commit?.mrNumber }}
                                    </button>
                                    <button v-if="commit?.commit?.webUrl" @click="openLink(commit.commit.webUrl)"
                                        class="bg-purple-500 text-white w-6 h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center"
                                        title="Open commit web URL">
                                        🔗
                                    </button>
                                </li>
                            </ul>
                        </td>
                        <!-- Cherry-pick -->
                        <td class="p-4 text-center">
                            <ul class="list-none space-y-2">
                                <li v-for="(commit, idx) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || idx" class="relative">
                                    <button v-if="!commit.transferred"
                                        :disabled="tasksStore.loadingButtons.has(commit.mrNumber)"
                                        @click="$emit('cherry-pick-request', commit.mrNumber, task.key)"
                                        class="relative flex justify-center items-center w-32 h-10 px-4 py-2 rounded text-white transition-all duration-300 ease-in-out"
                                        :class="[
                                            tasksStore.loadingButtons.has(commit.mrNumber) ? 'bg-red-500' : 'bg-green-500 hover:bg-green-600'
                                        ]">
                                        <span class="flex items-center justify-center w-full h-full">
                                            {{ tasksStore.loadingButtons.has(commit.mrNumber) ? 'Processing' :
                                            'Cherry-pick' }}
                                        </span>
                                    </button>
                                </li>
                            </ul>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
import Multiselect from 'vue-multiselect';

export default {
    name: 'CommitsTable',
    components: { Multiselect },
    props: {
        tasksStore: {
            type: Object,
            required: true
        },
        filteredTasksWithoutTargetCommits: {
            type: Array,
            required: true
        },
        selectedAuthors: {
            type: Array,
            required: true
        },
        sortDirection: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            // Локальное состояние для фильтрации "Not cherry-picked"
            hideWithTargetCommits: false,
        };
    },
    computed: {
        localSelectedAuthors: {
            get() {
                return this.selectedAuthors;
            },
            set(val) {
                this.$emit('update:selectedAuthors', val);
            }
        },
        localFilteredTasks() {
    let tasksToFilter = this.hideWithTargetCommits
        ? this.filteredTasksWithoutTargetCommits.filter(task => 
            !task.releaseCommits || task.releaseCommits.length === 0 // Assuming releaseCommits is an array from store
        )
        : [...this.filteredTasksWithoutTargetCommits]; // Create a shallow copy for sorting

    // Дополнительно фильтруем задачи по выбранным авторам
    if (this.localSelectedAuthors.length > 0) {
        tasksToFilter = tasksToFilter.filter(task => {
            if (!task.commits) return false;
            return Object.values(task.commits).some(commit =>
                this.localSelectedAuthors.includes(
                    (commit?.commit?.authorEmail?.split('@')[0] || '')
                )
            );
        });
    }

    // Date sorting
    tasksToFilter.sort((a, b) => {
      const dateA = this.getTaskSortDate(a);
      const dateB = this.getTaskSortDate(b);

      const aHasCommitDate = dateA !== null;
      const bHasCommitDate = dateB !== null;

      // Prioritize tasks with commit dates
      if (aHasCommitDate && !bHasCommitDate) return -1;
      if (!aHasCommitDate && bHasCommitDate) return 1;
      
      if (!aHasCommitDate && !bHasCommitDate) {
        // Both tasks have no commit dates, sort by original task.date (e.g., Jira date)
        const fallbackDateA = a.date ? new Date(a.date) : null;
        const fallbackDateB = b.date ? new Date(b.date) : null;

        if (fallbackDateA instanceof Date && !isNaN(fallbackDateA) && !(fallbackDateB instanceof Date && !isNaN(fallbackDateB))) return -1;
        if (!(fallbackDateA instanceof Date && !isNaN(fallbackDateA)) && fallbackDateB instanceof Date && !isNaN(fallbackDateB)) return 1;
        if (!(fallbackDateA instanceof Date && !isNaN(fallbackDateA)) && !(fallbackDateB instanceof Date && !isNaN(fallbackDateB))) return a.key.localeCompare(b.key);

        if (fallbackDateA.getTime() === fallbackDateB.getTime()) {
            return a.key.localeCompare(b.key); // Secondary sort by key
        }
        return this.sortDirection.date === 'asc' ? fallbackDateA - fallbackDateB : fallbackDateB - fallbackDateA;
      }

      // Both tasks have commit dates
      if (dateA.getTime() === dateB.getTime()) {
          return a.key.localeCompare(b.key); // Secondary sort by key for stable order
      }
      return this.sortDirection.date === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return tasksToFilter;
},
        isCherryPickDisabled() {
            return (
                this.tasksStore.isCherryPickListButtonDisabled ||
                this.tasksStore.loadingListButton ||
                !(this.tasksStore.selectedCommits && this.tasksStore.selectedCommits.size > 0)
            );
        },
        authorOptions() {
            // Как раньше: собираем авторов
            const authors = new Set();
            this.tasksStore.masterTasks.forEach(task => {
                Object.values(task.commits || {}).forEach(commit => {
                    if (commit.commit && commit.commit.authorEmail) {
                        authors.add(commit.commit.authorEmail.split('@')[0]);
                    }
                });
            });
            return Array.from(authors).sort((a, b) => a.localeCompare(b));
        },
        statusesLine() {
            const results = [];
            for (const task of this.tasksStore.masterTasks) {
                if (task.commits) {
                    for (const commit of Object.values(task.commits)) {
                        if (commit.mrNumber && this.tasksStore.loadingButtons.has(commit.mrNumber)) {
                            const statusText = this.tasksStore.getTaskStatus(task.key);
                            results.push(`${task.key} → ${statusText}`);
                            break;
                        }
                    }
                }
            }
            if (results.length === 0) {
                return 'Processing cherry-pick...';
            }
            return results.join('; ');
        }
    },
    methods: {
        getTaskSortDate(task) {
            if (!task.commits || Object.keys(task.commits).length === 0) {
                return null; 
            }
            const commitDates = Object.values(task.commits)
                .map(c => c.commit?.authoredDate ? new Date(c.commit.authoredDate) : null)
                .filter(d => d instanceof Date && !isNaN(d.getTime())); // Ensure 'd' is a valid Date object

            if (commitDates.length === 0) return null; // No valid commit dates found

            if (this.sortDirection.date === 'asc') {
                // Earliest commit date for ascending sort
                return new Date(Math.min.apply(null, commitDates));
            } else {
                // Latest commit date for descending sort
                return new Date(Math.max.apply(null, commitDates));
            }
        },
        getDisplayDateForTask(task) {
            // Display the date used for sorting if available, otherwise fallback to task.date
            const sortDate = this.getTaskSortDate(task);
            return sortDate ? sortDate : (task.date && !isNaN(new Date(task.date).getTime()) ? new Date(task.date) : null);
        },
        openLink(url) {
            window.open(url, '_blank');
        },
        formatDate(dateStr) {
            return new Date(dateStr).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }).replace(',', '');
        },
        filteredCommits(commits) {
            if (!commits) return [];
            return Object.values(commits).filter(
                commit =>
                    this.localSelectedAuthors.length === 0 ||
                    this.localSelectedAuthors.includes(commit?.commit?.authorEmail?.split('@')[0])
            );
        }
    }
};
</script>

<style scoped>
.commits-table {
    margin-top: 20px;
}

.cherry-pick {
    min-width: 150px;
    height: 40px;
    line-height: 40px;
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* "бегущий" градиент */
@keyframes loading {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

.animate-loading {
    background: linear-gradient(90deg,
            rgba(59, 130, 246, 1) 25%,
            rgba(59, 130, 246, 0.5) 50%,
            rgba(59, 130, 246, 1) 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite linear;
}

/* Анимация slide-fade */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.5s ease;
}

.slide-fade-enter,
.slide-fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
}

/* thead "sticky" */
thead.sticky {
    position: sticky;
    z-index: 10;
}
</style>