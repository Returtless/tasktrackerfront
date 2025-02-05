<!-- src/components/CommitsTable.vue -->
<template>
    <div class="commits-table container mx-auto py-8 px-4">
        <!-- Если данные загружаются -->
        <div v-if="tasksStore.loading"
            class="mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg w-[1000px] p-4 text-center">
            <svg class="animate-spin h-6 w-6 text-blue-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
        </div>
        <!-- Если произошла ошибка -->
        <div v-else-if="tasksStore.error"
            class="mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg w-[1000px] p-4 text-center text-red-500">
            {{ tasksStore.error }}
        </div>
        <!-- Если нет данных для отображения -->
        <div v-else-if="filteredTasksWithoutTargetCommits.length === 0"
            class="mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg w-[1000px] p-4 text-center">
            <p class="text-gray-600">Нет данных для отображения</p>
        </div>
        <!-- Отображение таблицы, если есть данные -->
        <div v-else class="mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg w-[1000px]">
            <!-- Заголовок и фильтры -->
            <div class="bg-blue-500 dark:bg-gray-700 text-white p-4 rounded-t-lg relative min-h-[150px]">
                <h1 class="text-center text-xl font-bold">Commits Page</h1>
                <!-- Новый блок управления в одной строке -->
                <div class="flex items-center justify-between mt-2">
                    <!-- Левая группа: multiselect и кнопка сортировки -->
                    <div class="flex items-center space-x-4">
                        <multiselect v-model="localSelectedAuthors" :options="authorOptions" :multiple="true"
                            :show-labels="false" placeholder="Filter by Author" class="w-64" />
                        <button @click="$emit('toggle-date-sort')"
                            class="sort-date bg-gray-300 p-2 rounded hover:bg-gray-400 whitespace-nowrap text-center">
                            Sort by Date ({{ sortDirection.date }})
                        </button>
                    </div>
                    <!-- Средняя группа: фильтрация All / Not cherry-picked -->
                    <div
                        class="inline-flex w-[300px] border border-gray-400 dark:border-gray-600 rounded-lg overflow-hidden shadow-md">
                        <!-- Кнопка "Show All" -->
                        <button @click="hideWithTargetCommits = false"
                            class="flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center transition-all duration-300 whitespace-nowrap"
                            :class="hideWithTargetCommits
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'
                                : 'bg-blue-600 text-white hover:bg-blue-700'">
                            All
                        </button>

                        <!-- Кнопка "Hide Target Commits" -->
                        <button @click="hideWithTargetCommits = true"
                            class="flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center transition-all duration-300 whitespace-nowrap"
                            :class="hideWithTargetCommits
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'">
                            Not cherry-picked
                        </button>
                    </div>
                    <!-- Правая группа: кнопка Cherry-pick Selected -->
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
                <!-- Строка состояния: показываем, только если статус обрабатывается -->
                <transition name="slide-fade">
                    <div v-if="tasksStore.loadingButtons.size > 0"
                        class="my-2 relative w-full h-4 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                        <!-- «Бегущий» градиент -->
                        <div class="absolute inset-0 bg-blue-500 dark:bg-blue-400 animate-loading"></div>

                        <!-- Текст статуса поверх полосы -->
                        <div class="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm">
                            <!-- Выводим statusesLine, формируемый в computed -->
                            <span>{{ statusesLine }}</span>
                        </div>
                    </div>
                </transition>
            </div>
            <!-- Таблица -->
            <table class="table-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 w-full">
                <thead>
                    <tr>
                        <th class="border-b p-4 text-center w-1/12">Select</th>
                        <th class="border-b p-4 text-center w-2/12">Issue Key</th>
                        <th class="border-b p-4 text-center w-2/12">Date</th>
                        <th class="border-b p-4 text-center w-3/12">Source Commits</th>
                        <th class="border-b p-4 text-center w-2/12">Author</th>
                        <th class="border-b p-4 text-center w-3/12">Target Commits</th>
                        <th class="border-b p-4 text-center w-2/12">Cherry-pick</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="task in localFilteredTasks" :key="task.key" class="border-b">
                        <!-- Select -->
                        <td class="p-4 text-center">
                            <ul class="list-none space-y-2">
                                <li v-for="(commit, index) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || index">
                                    <input type="checkbox" :checked="tasksStore.selectedCommits?.has(commit?.mrNumber)"
                                        @change="commit?.mrNumber && $emit('toggle-commit-selection', commit.mrNumber)" />
                                </li>
                            </ul>
                        </td>
                        <!-- Issue Key -->
                        <td class="p-4 text-center">
                            <button @click="openLink(`https://job-jira.otr.ru/browse/${task.key}`)"
                                class="bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 whitespace-nowrap truncate"
                                title="Перейти к задаче">
                                {{ task.key }}
                            </button>
                        </td>
                        <!-- Date -->
                        <td class="p-4 text-center whitespace-nowrap">
                            {{ formatDate(task.date) }}
                        </td>
                        <!-- Source Commits -->
                        <td class="p-4 text-center">
                            <ul class="list-none space-y-2">
                                <li v-for="(commit, index) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || index" class="relative flex items-center space-x-1">
                                    <button v-if="commit?.mrNumber" @click="openLink(commit.url)"
                                        class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap truncate"
                                        title="Открыть MR">
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
                        <!-- Author -->
                        <td class="p-4 text-center align-middle">
                            <ul class="list-none space-y-2">
                                <li v-for="(commit, index) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || index" class="whitespace-nowrap">
                                    {{ commit?.commit?.authorEmail?.split('@')[0] || 'Unknown' }}
                                </li>
                            </ul>
                        </td>
                        <!-- Target Commits -->
                        <td class="p-4 text-center">
                            <ul class="list-none space-y-2">
                                <li v-for="(commit, index) in (task.releaseCommits ? Object.values(task.releaseCommits) : [])"
                                    :key="commit?.mrNumber || index" class="relative flex items-center space-x-1">
                                    <button v-if="commit?.mrNumber" @click="openLink(commit.url)"
                                        class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap truncate"
                                        title="Открыть MR">
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
                                <li v-for="(commit, index) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || index" class="relative">
                                    <button :disabled="tasksStore.loadingButtons.has(commit.mrNumber)"
                                        @click="$emit('cherry-pick-request', commit.mrNumber, task.key)"
                                        class="relative flex justify-center items-center w-32 h-10 px-4 py-2 rounded text-white transition-all duration-300 ease-in-out"
                                        :class="[tasksStore.loadingButtons.has(commit.mrNumber) ? 'bg-red-500' : 'bg-green-500 hover:bg-green-600']"
                                        :title="tasksStore.loadingButtons.has(commit.mrNumber) ? tasksStore.getTaskStatus(task.key) : 'Cherry-pick'">
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
        // Локальное вычисляемое свойство для двусторонней привязки selectedAuthors
        localSelectedAuthors: {
            get() {
                return this.selectedAuthors;
            },
            set(val) {
                this.$emit('update:selectedAuthors', val);
            }
        },
        authorOptions() {
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
        // Применяем локальную фильтрацию, если hideWithTargetCommits true
        localFilteredTasks() {
            if (this.hideWithTargetCommits) {
                return this.filteredTasksWithoutTargetCommits.filter(task => {
                    return !task.releaseCommits || task.releaseCommits.length === 0;
                });
            }
            return this.filteredTasksWithoutTargetCommits;
        },
        isCherryPickDisabled() {
            return (
                this.tasksStore.isCherryPickListButtonDisabled ||
                this.tasksStore.loadingListButton ||
                !(this.tasksStore.selectedCommits && this.tasksStore.selectedCommits.size > 0)
            );
        },
        statusesLine() {
            const results = [];
            // Проходим по всем masterTasks
            for (const task of this.tasksStore.masterTasks) {
                // Проверяем, есть ли commits и хотя бы один mrNumber из loadingButtons
                if (task.commits) {
                    for (const commit of Object.values(task.commits)) {
                        if (commit.mrNumber && this.tasksStore.loadingButtons.has(commit.mrNumber)) {
                            // Добавляем "KEY -> <status из getTaskStatus>"
                            const statusText = this.tasksStore.getTaskStatus(task.key);
                            // Пример: "PRJ-123 → Processing..."
                            results.push(`${task.key} → ${statusText}`);
                            // Можно прервать, если хотите только один commit на задачу
                            break;
                        }
                    }
                }
            }
            // Если ничего не нашли, вернём "Processing..." (или пустую строку)
            if (results.length === 0) {
                return 'Processing cherry-pick...';
            }
            // Иначе объединим статусы через "; "
            return results.join('; ');
        }
    },
    methods: {
        openLink(url) {
            window.open(url, '_blank');
        },
        formatDate(dateStr) {
            return new Date(dateStr).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Анимация «бегущего» градиента */
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

/* Анимация slide-fade для плавного появления/исчезновения */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.5s ease;
}

.slide-fade-enter,
.slide-fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
}
</style>