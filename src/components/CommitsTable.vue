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
            <div
                class="sticky top-[75px] z-20 bg-blue-500 dark:bg-gray-700 text-white p-2 sm:p-4 rounded-t-lg relative min-h-[150px]">
                <!-- Заголовок -->
                <h1 class="text-center text-lg sm:text-xl font-bold">{{ $t('pages.commitsPage') }}</h1>

                <!-- Верхняя панель с фильтрами и кнопками -->
                <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-4 mt-2">
                    <!-- Левая группа: multiselect и кнопка сортировки -->
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <Multiselect v-model="localSelectedAuthors" :options="authorOptions" :multiple="true"
                            :show-labels="false" :placeholder="$t('commitsTable.filterByAuthor')" class="w-full sm:w-48 lg:w-64" />
                        <button @click="$emit('toggle-mr-number-sort')"
                            class="sort-mr-number bg-gray-300 p-2 rounded hover:bg-gray-400 whitespace-nowrap text-center text-sm">
                            {{ $t('commitsTable.sortByMR') }}{{ currentSortDirection ? ` (${currentSortDirection})` : ` (${$t('commitsTable.sortOff')})` }}
                        </button>
                    </div>

                    <!-- Средняя группа: кнопки All / Not Cherry-picked -->
                    <div
                        class="inline-flex w-full sm:w-auto sm:min-w-[200px] lg:w-[300px] border border-gray-400 dark:border-gray-600 rounded-lg overflow-hidden shadow-md">
                        <button @click="hideWithTargetCommits = false"
                            class="flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center transition-all duration-300 whitespace-nowrap"
                            :class="hideWithTargetCommits
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'
                                : 'bg-blue-600 text-white hover:bg-blue-700'">
                            {{ $t('commitsTable.all') }}
                        </button>
                        <button @click="hideWithTargetCommits = true"
                            class="flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center transition-all duration-300 whitespace-nowrap"
                            :class="hideWithTargetCommits
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'">
                            {{ $t('commitsTable.notCherryPicked') }}
                        </button>
                    </div>

                    <!-- Правая группа: Cherry-pick Selected -->
                    <button :disabled="isCherryPickDisabled" :class="[
                        'cherry-pick flex items-center justify-center px-2 sm:px-4 py-2 rounded focus:outline-none focus:ring-2 text-xs sm:text-sm whitespace-nowrap',
                        isCherryPickDisabled
                            ? 'bg-green-500 opacity-50 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                    ]" @click="$emit('cherry-pick-list')">
                        <span v-if="tasksStore.loadingListButton">{{ $t('common.processing') }}</span>
                        <span v-else>{{ $t('commitsTable.cherryPickSelected') }}</span>
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

            <!-- Карточный вид для мобильных устройств (< 640px) -->
            <div class="sm:hidden space-y-3 p-3">
                <!-- Режим сортировки по MR number: плоский список -->
                <template v-if="isMrNumberSortActive">
                    <div v-for="item in flattenedMrList" :key="`card-${item.task.key}-${item.commit.mrNumber}`" 
                        class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <!-- Заголовок: Issue Key + Improvement Status + Checkbox -->
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <input v-if="!item.commit.transferred" type="checkbox"
                                    :checked="tasksStore.selectedCommits?.has(item.commit?.mrNumber)"
                                    @change="item.commit?.mrNumber && $emit('toggle-commit-selection', item.commit.mrNumber)"
                                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                <button @click="openLink(`https://job-jira.otr.ru/browse/${item.task.key}`)"
                                    class="bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 text-xs font-medium">
                                    {{ item.task.key }}
                                </button>
                            </div>
                            <span v-if="getStatusIcon(item.task.status)" class="text-xl" :title="(item.task.status || '') + (item.task.improvementName ? ' - ' + item.task.improvementName : '')">
                                {{ getStatusIcon(item.task.status) }}
                            </span>
                        </div>
                        <!-- Source Commits -->
                        <div class="mb-3">
                            <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{{ $t('commitsTable.sourceCommits') }}</div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button v-if="item.commit?.mrNumber" @click="openLink(item.commit.url)" 
                                    :class="item.commit.transferred
                                        ? 'bg-green-500 text-white px-2 py-1 rounded text-xs font-medium'
                                        : 'bg-red-500 text-white px-2 py-1 rounded text-xs font-medium'">
                                    MR {{ item.commit?.mrNumber }}
                                </button>
                                <button v-if="item.commit?.commit?.webUrl" @click="openLink(item.commit.commit.webUrl)"
                                    class="bg-purple-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-purple-600">
                                    🔗
                                </button>
                                <button v-if="!item.commit.transferred"
                                    :disabled="tasksStore.loadingButtons.has(item.commit.mrNumber)"
                                    @click="$emit('cherry-pick-request', item.commit.mrNumber, item.task.key)"
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
                        <div class="mb-3" v-if="item.task.releaseCommits && Object.values(item.task.releaseCommits).some(rc => rc?.mrNumber === item.commit.mrNumber)">
                            <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{{ $t('commitsTable.targetCommits') }}</div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <template v-for="releaseCommit in Object.values(item.task.releaseCommits)" :key="releaseCommit?.mrNumber">
                                    <button v-if="releaseCommit?.mrNumber === item.commit.mrNumber" @click="openLink(releaseCommit.url)"
                                        class="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-600">
                                        MR {{ releaseCommit?.mrNumber }}
                                    </button>
                                </template>
                            </div>
                        </div>
                        <!-- Author + Date -->
                        <div class="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span class="text-gray-600 dark:text-gray-400">
                                👤 {{ item.commit?.commit?.authorEmail?.split('@')[0] || $t('common.unknown') }}
                            </span>
                            <span class="text-gray-500 dark:text-gray-400">
                                📅 {{ getDisplayDateForTask(item.task) ? formatDateCompact(getDisplayDateForTask(item.task)) : $t('common.notAvailable') }}
                            </span>
                        </div>
                    </div>
                </template>
                <!-- Обычный режим: группировка по задачам -->
                <template v-else>
                    <div v-for="task in localFilteredTasks" :key="`card-${task.key}`" 
                        class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <!-- Заголовок: Issue Key + Improvement Status + Checkbox -->
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <input v-if="task.commits && filteredCommits(task.commits).some(c => !c.transferred)" 
                                    type="checkbox"
                                    :checked="task.commits && filteredCommits(task.commits).every(c => c.transferred || tasksStore.selectedCommits?.has(c?.mrNumber))"
                                    @change="task.commits && $emit('toggle-task-selection', filteredCommits(task.commits).filter(c => !c.transferred).map(c => c.mrNumber))"
                                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                <button @click="openLink(`https://job-jira.otr.ru/browse/${task.key}`)"
                                    class="bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 text-xs font-medium">
                                    {{ task.key }}
                                </button>
                            </div>
                            <span v-if="getStatusIcon(task.status)" class="text-xl" :title="(task.status || '') + (task.improvementName ? ' - ' + task.improvementName : '')">
                                {{ getStatusIcon(task.status) }}
                            </span>
                        </div>
                        <!-- Source Commits -->
                        <div class="mb-3" v-if="task.commits && filteredCommits(task.commits).length > 0">
                            <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{{ $t('commitsTable.sourceCommits') }}</div>
                            <div class="space-y-2">
                                <template v-for="(commit, idx) in filteredCommits(task.commits)" :key="commit?.mrNumber || idx">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <input v-if="!commit.transferred" type="checkbox"
                                            :checked="tasksStore.selectedCommits?.has(commit?.mrNumber)"
                                            @change="commit?.mrNumber && $emit('toggle-commit-selection', commit.mrNumber)"
                                            class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                        <button v-if="commit?.mrNumber" @click="openLink(commit.url)" 
                                            :class="commit.transferred
                                                ? 'bg-green-500 text-white px-2 py-1 rounded text-xs font-medium'
                                                : 'bg-red-500 text-white px-2 py-1 rounded text-xs font-medium'">
                                            MR {{ commit?.mrNumber }}
                                        </button>
                                        <button v-if="commit?.commit?.webUrl" @click="openLink(commit.commit.webUrl)"
                                            class="bg-purple-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-purple-600">
                                            🔗
                                        </button>
                                        <button v-if="!commit.transferred"
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
                        <div class="mb-3" v-if="task.releaseCommits && Object.values(task.releaseCommits).length > 0">
                            <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{{ $t('commitsTable.targetCommits') }}</div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <template v-for="(commit, idx) in Object.values(task.releaseCommits)" :key="commit?.mrNumber || idx">
                                    <button v-if="commit?.mrNumber" @click="openLink(commit.url)"
                                        class="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-600">
                                        MR {{ commit?.mrNumber }}
                                    </button>
                                    <button v-if="commit?.commit?.webUrl" @click="openLink(commit.commit.webUrl)"
                                        class="bg-purple-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-purple-600">
                                        🔗
                                    </button>
                                </template>
                            </div>
                        </div>
                        <!-- Author + Date -->
                        <div class="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-600" v-if="task.commits && filteredCommits(task.commits).length > 0">
                            <span class="text-gray-600 dark:text-gray-400">
                                👤 {{ filteredCommits(task.commits)[0]?.commit?.authorEmail?.split('@')[0] || 'Неизвестно' }}
                            </span>
                            <span class="text-gray-500 dark:text-gray-400">
                                📅 {{ getDisplayDateForTask(task) ? formatDateCompact(getDisplayDateForTask(task)) : 'Н/Д' }}
                            </span>
                        </div>
                    </div>
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
                        <tr v-for="item in flattenedMrList" :key="`${item.task.key}-${item.commit.mrNumber}`" class="border-b">
                            <!-- Select -->
                            <td class="p-1 sm:p-1.5 lg:p-3 text-center">
                                <input v-if="!item.commit.transferred" type="checkbox"
                                    :checked="tasksStore.selectedCommits?.has(item.commit?.mrNumber)"
                                    @change="item.commit?.mrNumber && $emit('toggle-commit-selection', item.commit.mrNumber)" />
                            </td>
                            <!-- Issue Key -->
                            <td class="p-1 sm:p-1.5 lg:p-3 text-center">
                                <button @click="openLink(`https://job-jira.otr.ru/browse/${item.task.key}`)"
                                    class="bg-orange-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 whitespace-nowrap truncate text-xs sm:text-sm">
                                    {{ item.task.key }}
                                </button>
                            </td>
                            <!-- Improvement Status -->
                            <td class="p-1 sm:p-1.5 lg:p-3 text-center align-middle" :title="(item.task.status || '') + (item.task.improvementName ? ' - ' + item.task.improvementName : '')">
                                <span v-if="getStatusIcon(item.task.status)" class="text-base sm:text-lg lg:text-xl inline-block">{{ getStatusIcon(item.task.status) }}</span>
                            </td>
                            <!-- Date -->
                            <td class="p-1 sm:p-1.5 lg:p-3 text-center whitespace-nowrap text-xs sm:text-sm lg:text-base">
                                <template v-if="getDisplayDateForTask(item.task)">
                                    <span class="lg:hidden">{{ formatDateCompact(getDisplayDateForTask(item.task)) }}</span>
                                    <span class="hidden lg:inline">{{ formatDateFull(getDisplayDateForTask(item.task)) }}</span>
                                </template>
                                <span v-else>{{ $t('common.notAvailable') }}</span>
                            </td>
                            <!-- Source Commits -->
                            <td class="p-1 sm:p-1.5 lg:p-3 text-center">
                                <div class="flex items-center justify-center gap-0.5 sm:gap-1">
                                    <button v-if="item.commit?.mrNumber" @click="openLink(item.commit.url)" :class="item.commit.transferred
                                        ? 'bg-green-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-green-600 text-xs sm:text-sm'
                                        : 'bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-red-600 text-xs sm:text-sm'">
                                        {{ item.commit?.mrNumber }}
                                    </button>
                                    <button v-if="item.commit?.commit?.webUrl" @click="openLink(item.commit.commit.webUrl)"
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
                                <!-- В плоском списке показываем release commits для этого конкретного MR -->
                                <div v-if="item.task.releaseCommits" class="flex items-center justify-center gap-0.5 sm:gap-1">
                                    <template v-for="releaseCommit in Object.values(item.task.releaseCommits)" :key="releaseCommit?.mrNumber">
                                        <button v-if="releaseCommit?.mrNumber === item.commit.mrNumber" @click="openLink(releaseCommit.url)"
                                            class="bg-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm">
                                            {{ releaseCommit?.mrNumber }}
                                        </button>
                                    </template>
                                </div>
                            </td>
                            <!-- Cherry-pick -->
                            <td class="p-1 sm:p-1.5 lg:p-3 text-center">
                                <button v-if="!item.commit.transferred"
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
                    </template>
                    <!-- Обычный режим: группировка по задачам -->
                    <template v-else>
                        <tr v-for="task in localFilteredTasks" :key="task.key" class="border-b">
                        <!-- Select -->
                        <td class="p-1 sm:p-1.5 lg:p-3 text-center">
                            <ul class="list-none space-y-1 sm:space-y-1.5">
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
                        <td class="p-1 sm:p-1.5 lg:p-3 text-center">
                            <button @click="openLink(`https://job-jira.otr.ru/browse/${task.key}`)"
                                class="bg-orange-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 whitespace-nowrap truncate text-xs sm:text-sm">
                                {{ task.key }}
                            </button>
                        </td>
                        <!-- Improvement Status -->
                        <td class="p-1 sm:p-1.5 lg:p-3 text-center align-middle" :title="(task.status || '') + (task.improvementName ? ' - ' + task.improvementName : '')">
                            <span v-if="getStatusIcon(task.status)" class="text-base sm:text-lg lg:text-xl inline-block">{{ getStatusIcon(task.status) }}</span>
                        </td>
                        <!-- Date -->
                        <td class="p-1 sm:p-1.5 lg:p-3 text-center whitespace-nowrap text-xs sm:text-sm lg:text-base">
                            <template v-if="getDisplayDateForTask(task)">
                                <span class="lg:hidden">{{ formatDateCompact(getDisplayDateForTask(task)) }}</span>
                                <span class="hidden lg:inline">{{ formatDateFull(getDisplayDateForTask(task)) }}</span>
                            </template>
                            <span v-else>N/A</span>
                        </td>
                        <!-- Source Commits -->
                        <td class="p-1 sm:p-1.5 lg:p-3 text-center">
                            <ul class="list-none space-y-1 sm:space-y-1.5">
                                <li v-for="(commit, idx) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || idx" class="flex items-center justify-center gap-0.5 sm:gap-1">
                                    <button v-if="commit?.mrNumber" @click="openLink(commit.url)" :class="commit.transferred
                                        ? 'bg-green-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-green-600 text-xs sm:text-sm'
                                        : 'bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-red-600 text-xs sm:text-sm'">
                                        {{ commit?.mrNumber }}
                                    </button>
                                    <button v-if="commit?.commit?.webUrl" @click="openLink(commit.commit.webUrl)"
                                        class="bg-purple-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center">
                                        🔗
                                    </button>
                                </li>
                            </ul>
                        </td>
                        <!-- Author -->
                        <td class="p-1 sm:p-1.5 lg:p-3 text-center align-middle text-xs sm:text-sm lg:text-base hidden lg:table-cell">
                            <ul class="list-none space-y-1 sm:space-y-1.5">
                                <li v-for="(commit, idx) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || idx" class="whitespace-nowrap">
                                    {{ commit?.commit?.authorEmail?.split('@')[0] || 'Неизвестно' }}
                                </li>
                            </ul>
                        </td>
                        <!-- Target Commits -->
                        <td class="p-1 sm:p-1.5 lg:p-3 text-center">
                            <ul class="list-none space-y-1 sm:space-y-1.5">
                                <li v-for="(commit, idx) in (task.releaseCommits ? Object.values(task.releaseCommits) : [])"
                                    :key="commit?.mrNumber || idx" class="flex items-center justify-center gap-0.5 sm:gap-1">
                                    <button v-if="commit?.mrNumber" @click="openLink(commit.url)"
                                        class="bg-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm">
                                        {{ commit?.mrNumber }}
                                    </button>
                                    <button v-if="commit?.commit?.webUrl" @click="openLink(commit.commit.webUrl)"
                                        class="bg-purple-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 flex items-center justify-center"
                                        title="Open commit web URL">
                                        🔗
                                    </button>
                                </li>
                            </ul>
                        </td>
                        <!-- Cherry-pick -->
                        <td class="p-1 sm:p-1.5 lg:p-3 text-center">
                            <ul class="list-none space-y-1 sm:space-y-1.5">
                                <li v-for="(commit, idx) in (task.commits ? filteredCommits(task.commits) : [])"
                                    :key="commit?.mrNumber || idx" class="relative">
                                    <button v-if="!commit.transferred"
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
                </tbody>
            </table>
        </div>
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
        currentSortDirection() {
            // Computed property для отслеживания изменений sortDirection.mrNumber
            return this.sortDirection?.mrNumber || null;
        },
        isMrNumberSortActive() {
            // Проверяем, включена ли сортировка по MR number
            return this.currentSortDirection !== null;
        },
        flattenedMrList() {
            // Создаем плоский список всех MR из всех задач
            const mrList = [];
            
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

            // Разворачиваем все задачи в плоский список MR
            tasksToProcess.forEach(task => {
                if (!task.commits) return;
                
                // Преобразуем commits в массив, если это Map/Object
                const commitsArray = this.filteredCommits(task.commits);
                commitsArray.forEach(commit => {
                    // Проверяем наличие mrNumber (может быть строкой или числом)
                    const mrNum = commit?.mrNumber;
                    if (mrNum !== null && mrNum !== undefined && mrNum !== '') {
                        const mrNumberInt = typeof mrNum === 'number' ? mrNum : parseInt(mrNum);
                        if (!isNaN(mrNumberInt) && mrNumberInt > 0) {
                            mrList.push({
                                commit: commit,
                                task: task,
                                mrNumber: mrNumberInt
                            });
                        }
                    }
                });
            });

            // Сортируем по номеру MR (flattenedMrList используется только когда сортировка включена)
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
            // Display task.date if available
            return task.date && !isNaN(new Date(task.date).getTime()) ? new Date(task.date) : null;
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
        formatDateCompact(dateStr) {
            if (!dateStr) return 'Н/Д';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Н/Д';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${day}.${month}`;
        },
        formatDateFull(dateStr) {
            if (!dateStr) return 'Н/Д';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Н/Д';
            return date.toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }).replace(',', '');
        },
        getStatusIcon(status) {
            // Если статус пуст, не показываем иконку
            if (!status || status.trim() === '') {
                return '';
            }
            const statusLower = status.toLowerCase().trim();
            
            // Закрыто
            if (statusLower === 'закрыто' || statusLower.includes('закрыт')) {
                return '🔒';
            }
            // Исправление
            if (statusLower === 'исправление' || statusLower.includes('исправлен')) {
                return '🔧';
            }
            // Тестирование
            if (statusLower === 'тестирование' || statusLower.includes('тестирован')) {
                return '🧪';
            }
            // В разработке
            if (statusLower === 'в разработке' || statusLower.includes('разработк')) {
                return '💻';
            }
            
            // Для статуса не из списка - показываем вопросительный знак
            return '❓';
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

/* Компактные строки таблицы */
tbody tr {
    min-height: auto;
}

td, th {
    vertical-align: middle;
}
</style>