<template>
    <!-- Контейнер для таблицы -->
    <div class="commits-table w-full max-w-[1200px] mx-auto py-8 px-4">

        <!-- Состояния загрузки/ошибки/пустых данных те же -->
        <div v-if="tasksStore.loading"
            class="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 text-center">
            <svg class="animate-spin h-6 w-6 text-blue-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
        </div>
        <div v-else-if="tasksStore.error"
            class="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 text-center text-red-500">
            {{ tasksStore.error }}
        </div>
        <div v-else-if="(isMrNumberSortActive && flattenedMrList.length === 0) || (!isMrNumberSortActive && localFilteredTasks.length === 0)"
            class="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 text-center">
            <p class="text-gray-600">{{ $t('commitsTable.noData') }}</p>
        </div>

        <!-- Сама таблица, если есть данные -->
        <div v-else-if="(isMrNumberSortActive && flattenedMrList.length > 0) || (!isMrNumberSortActive && localFilteredTasks.length > 0)" class="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg">

            <!-- Шапка таблицы (заголовок Commits Page, фильтры, Cherry-pick Selected) -->
            <CommitsTableHeader
                v-model:selectedAuthors="localSelectedAuthors"
                :author-options="authorOptions"
                :current-sort-direction="currentSortDirection"
                v-model:hideWithTargetCommits="hideWithTargetCommits"
                :is-cherry-pick-disabled="isCherryPickDisabled"
                :loading-list-button="tasksStore.loadingListButton"
                :loading-buttons-size="tasksStore.loadingButtons.size"
                :statuses-line="statusesLine"
                @toggle-mr-number-sort="$emit('toggle-mr-number-sort')"
                @cherry-pick-list="$emit('cherry-pick-list')"
            />

            <!-- Карточный вид для мобильных устройств (< 640px) -->
            <div class="sm:hidden space-y-3 p-3">
                <!-- Режим сортировки по MR number: плоский список -->
                <template v-if="isMrNumberSortActive">
                    <CommitCard
                        v-for="item in flattenedMrList"
                        :key="`card-mr-${item.mrNumber}`"
                        :item="item"
                        :tasks-store="tasksStore"
                        :jira-browse-url="jiraBrowseUrl"
                        sort-mode="mr"
                        :filtered-commits="filteredCommits"
                        @toggle-commit-selection="$emit('toggle-commit-selection', $event)"
                        @cherry-pick-request="handleCherryPickRequest"
                    />
                </template>
                <!-- Обычный режим: группировка по задачам -->
                <template v-else>
                    <CommitCard
                        v-for="task in localFilteredTasks"
                        :key="`card-${task.key}`"
                        :task="task"
                        :tasks-store="tasksStore"
                        :jira-browse-url="jiraBrowseUrl"
                        sort-mode="normal"
                        :filtered-commits="filteredCommits"
                        @toggle-commit-selection="$emit('toggle-commit-selection', $event)"
                        @toggle-task-selection="$emit('toggle-task-selection', $event)"
                        @cherry-pick-request="handleCherryPickRequest"
                    />
                </template>
            </div>

            <!-- Таблица с зафиксированным thead (скрыта на мобильных) -->
            <div class="hidden sm:block overflow-x-auto">
            <table class="table-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 w-full">
                <thead class="bg-white dark:bg-gray-700">
                    <tr>
                        <th class="border-b p-1 sm:p-1.5 lg:p-3 text-center w-1/20 text-xs sm:text-sm lg:text-base"></th>
                        <th class="border-b p-1 sm:p-1.5 lg:p-3 text-center w-3/20 text-xs sm:text-sm lg:text-base">{{ $t('commitsTable.taskJira') }}</th>
                        <th class="border-b p-1 sm:p-1.5 lg:p-3 text-center w-3/20 text-xs sm:text-sm lg:text-base">{{ $t('commitsTable.improvementStatus') }}</th>
                        <th class="border-b p-1 sm:p-1.5 lg:p-3 text-center w-1/10 text-xs sm:text-sm lg:text-base hidden lg:table-cell">{{ $t('commitsTable.date') }}</th>
                        <th class="border-b p-1 sm:p-1.5 lg:p-3 text-center w-3/20 text-xs sm:text-sm lg:text-base">{{ $t('commitsTable.sourceMR') }}</th>
                        <th class="border-b p-1 sm:p-1.5 lg:p-3 text-center w-1/10 text-xs sm:text-sm lg:text-base hidden lg:table-cell">{{ $t('commitsTable.author') }}</th>
                        <th class="border-b p-1 sm:p-1.5 lg:p-3 text-center w-3/20 text-xs sm:text-sm lg:text-base">{{ $t('commitsTable.targetMR') }}</th>
                        <th class="border-b p-1 sm:p-1.5 lg:p-3 text-center w-3/20 text-xs sm:text-sm lg:text-base"></th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Режим сортировки по MR number: плоский список -->
                    <template v-if="isMrNumberSortActive">
                        <CommitRow
                            v-for="item in flattenedMrList"
                            :key="`mr-${item.mrNumber}`"
                            :item="item"
                            :tasks-store="tasksStore"
                            :jira-browse-url="jiraBrowseUrl"
                            sort-mode="mr"
                            :filtered-commits="filteredCommits"
                            @toggle-commit-selection="$emit('toggle-commit-selection', $event)"
                            @cherry-pick-request="handleCherryPickRequest"
                        />
                    </template>
                    <!-- Обычный режим: группировка по задачам -->
                    <template v-else>
                        <CommitRow
                            v-for="task in localFilteredTasks"
                            :key="task.key"
                            :task="task"
                            :tasks-store="tasksStore"
                            :jira-browse-url="jiraBrowseUrl"
                            sort-mode="normal"
                            :filtered-commits="filteredCommits"
                            @toggle-commit-selection="$emit('toggle-commit-selection', $event)"
                            @cherry-pick-request="handleCherryPickRequest"
                        />
                    </template>
                </tbody>
            </table>
        </div>
        </div>
    </div>
</template>

<script>
import { getJiraBrowseUrl } from '@/utils/constants';
import { useSettingsStore } from '@/stores/settingsStore';
import { getDisplayDateForTask, formatDate, formatDateCompact, formatDateFull } from '@/utils/dateUtils';
import { getStatusIcon } from '@/utils/statusUtils';
import CommitsTableHeader from './CommitsTableHeader.vue';
import CommitRow from './CommitRow.vue';
import CommitCard from './CommitCard.vue';

export default {
    name: 'CommitsTable',
    components: { CommitsTableHeader, CommitRow, CommitCard },
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
        jiraBrowseUrl() {
            const settingsStore = useSettingsStore();
            const jiraUrl = settingsStore.appSettings['jira.url'];
            return getJiraBrowseUrl(jiraUrl);
        },
        localSelectedAuthors: {
            get() {
                return this.selectedAuthors;
            },
            set(val) {
                this.$emit('update:selectedAuthors', val);
            }
        },
        currentSortDirection() {
            // Computed property для отслеживания изменений sortDirection.mrNumber
            return this.sortDirection?.mrNumber || null;
        },
        isMrNumberSortActive() {
            // Проверяем, включена ли сортировка по MR number
            return this.currentSortDirection !== null;
        },
        flattenedMrList() {
            // Группируем MR по номеру, собирая все связанные задачи
            const mrMap = new Map(); // Map<mrNumber, {mrNumber, commit, tasks: []}>
            
            let tasksToProcess = this.hideWithTargetCommits
                ? this.filteredTasksWithoutTargetCommits.filter(task => {
                    // Фильтруем задачи, у которых есть хотя бы один коммит с transferred === false
                    if (!task.commits) return false;
                    const commitsArray = this.filteredCommits(task.commits);
                    return commitsArray.some(commit => !commit.transferred);
                })
                : [...this.filteredTasksWithoutTargetCommits];

            // Фильтруем задачи по выбранным авторам
            if (this.localSelectedAuthors.length > 0) {
                tasksToProcess = tasksToProcess.filter(task => {
                    if (!task.commits) return false;
                    return Object.values(task.commits).some(commit =>
                        this.localSelectedAuthors.includes(
                            (commit?.commit?.authorEmail?.split('@')[0] || '')
                        )
                    );
                });
            }

            // Группируем по mrNumber
            tasksToProcess.forEach(task => {
                if (!task.commits) return;
                
                // Преобразуем commits в массив, если это Map/Object
                const commitsArray = this.filteredCommits(task.commits);
                commitsArray.forEach(commit => {
                    // Проверяем наличие mrNumber (может быть строкой или числом)
                    const mrNum = commit?.mrNumber;
                    if (mrNum !== null && mrNum !== undefined && mrNum !== '') {
                        // Нормализуем MR number: приводим к строке, затем к числу для сравнения
                        const mrNumberStr = String(mrNum).trim();
                        const mrNumberInt = parseInt(mrNumberStr, 10);
                        if (!isNaN(mrNumberInt) && mrNumberInt > 0) {
                            if (!mrMap.has(mrNumberInt)) {
                                mrMap.set(mrNumberInt, {
                                    mrNumber: mrNumberInt,
                                    commit: commit,
                                    tasks: []
                                });
                            }
                            // Добавляем задачу, если её еще нет в списке
                            const mrData = mrMap.get(mrNumberInt);
                            if (!mrData.tasks.find(t => t.key === task.key)) {
                                mrData.tasks.push(task);
                            }
                        }
                    }
                });
            });

            // Преобразуем в массив и добавляем allTaskKeys
            const mrList = Array.from(mrMap.values()).map(item => {
                console.log('Creating MR item:', item.mrNumber, 'tasks:', item.tasks);
                item.tasks.forEach(task => {
                    console.log('  Task:', task.key, 'releaseCommits:', task.releaseCommits);
                });
                return {
                    ...item,
                    allTaskKeys: item.tasks.map(t => t.key).join(', ')
                };
            });

            // Сортируем по номеру MR
            const sortDirectionValue = this.currentSortDirection || 'asc';
            mrList.sort((a, b) => {
                return sortDirectionValue === 'asc' ? a.mrNumber - b.mrNumber : b.mrNumber - a.mrNumber;
            });

            return mrList;
        },
        localFilteredTasks() {
            // Если включена сортировка по MR number, возвращаем пустой список (будем использовать flattenedMrList)
            if (this.isMrNumberSortActive) {
                return [];
            }
            
            let tasksToFilter = this.hideWithTargetCommits
                ? this.filteredTasksWithoutTargetCommits.filter(task => {
                    // Фильтруем задачи, у которых есть хотя бы один коммит с transferred === false
                    if (!task.commits) return false;
                    const commitsArray = this.filteredCommits(task.commits);
                    return commitsArray.some(commit => !commit.transferred);
                })
                : [...this.filteredTasksWithoutTargetCommits];

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
                return this.$t('commitsTable.processingCherryPick');
            }
            return results.join('; ');
        }
    },
    mounted() {
        // Загружаем настройки приложения, если они еще не загружены
        const settingsStore = useSettingsStore();
        if (!settingsStore.appSettings || Object.keys(settingsStore.appSettings).length === 0) {
            settingsStore.loadAppSettings();
        }
    },
    methods: {
        getTaskMinMrNumber(task) {
            if (!task.commits || Object.keys(task.commits).length === 0) {
                return null; 
            }
            const mrNumbers = Object.values(task.commits)
                .map(c => c.mrNumber ? parseInt(c.mrNumber) : null)
                .filter(num => num !== null && !isNaN(num));

            if (mrNumbers.length === 0) return null; // No valid MR numbers found

            // Return minimum MR number for sorting
            return Math.min.apply(null, mrNumbers);
        },
        getDisplayDateForTask(task) {
            return getDisplayDateForTask(task);
        },
        openLink(url) {
            window.open(url, '_blank');
        },
        formatDate(dateStr) {
            return formatDate(dateStr);
        },
        formatDateCompact(dateStr) {
            return formatDateCompact(dateStr, this.$t);
        },
        formatDateFull(dateStr) {
            return formatDateFull(dateStr, this.$t);
        },
        getStatusIcon(status) {
            return getStatusIcon(status);
        },
        filteredCommits(commits) {
            if (!commits) return [];
            return Object.values(commits).filter(
                commit =>
                    this.localSelectedAuthors.length === 0 ||
                    this.localSelectedAuthors.includes(commit?.commit?.authorEmail?.split('@')[0])
            );
        },
        handleCherryPickRequest(mrNumber, taskKey) {
            this.$emit('cherry-pick-request', mrNumber, taskKey);
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

/* Компактные строки таблицы */
tbody tr {
    min-height: auto;
}

td, th {
    vertical-align: middle;
}
</style>