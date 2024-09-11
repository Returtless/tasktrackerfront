<template>
  <b-container fluid>
    <!-- Theme switcher in top-right corner -->
    <b-form-checkbox 
      v-model="isDarkMode" 
      switch
      class="theme-switcher"
    >
    </b-form-checkbox>

    <b-row class="justify-content-center mt-4">
      <b-col md="8">
        <b-card>
          <b-card-header>
            <h1 class="text-center mb-0">Commits Page</h1>
          </b-card-header>

          <b-card-body>
            <!-- Loading spinner -->
            <div class="text-center mb-3">
              <b-spinner v-if="loading" type="grow" variant="primary"></b-spinner>
            </div>

            <!-- Error message -->
            <b-alert v-if="error" variant="danger" dismissible class="text-center">
              {{ error }}
            </b-alert>

            <!-- Table with dynamic dark/light mode -->
            <b-table 
              v-if="!loading && !error" 
              :items="masterTasks" 
              :fields="fields" 
              hover 
              responsive 
            >
              <template #cell(issues)="data">
                <b-button variant="link" :href="`https://job-jira.otr.ru/browse/${data.item.key}`" target="_blank">
                  {{ data.item.key }}
                </b-button>
              </template>
              <template #cell(masterCommits)="data">
                <b-table :items="data.item.commits" :fields="commitFields" small responsive>
                  <template #cell(commit)="data">
                    <b-button variant="outline-primary" :href="`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${data.item.mrNumber}`" target="_blank">
                      MR #{{ data.item.mrNumber }}
                    </b-button>
                  </template>
                </b-table>
              </template>
              <template #cell(releaseCommits)="data">
                <b-table :items="data.item.releaseCommits" :fields="commitFields" small responsive>
                  <template #cell(commit)="data">
                    <b-button variant="outline-success" :href="`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${data.item.mrNumber}`" target="_blank">
                      MR #{{ data.item.mrNumber }}
                    </b-button>
                  </template>
                </b-table>
              </template>
            </b-table>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      masterTasks: [],
      releaseTasks: [],
      loading: true,
      error: null,
      isDarkMode: true, // Темная тема включена по умолчанию
      fields: [
        { key: 'issues', label: 'Issue Key' },
        { key: 'masterCommits', label: 'Master Commits' },
        { key: 'releaseCommits', label: 'Release Commits' }
      ],
      commitFields: [
        { key: 'commit', label: 'Commit' }
      ]
    };
  },
  watch: {
    isDarkMode(newVal) {
      document.body.setAttribute('data-theme', newVal ? 'dark' : 'light');
    }
  },
  methods: {
    async fetchCommits() {
      try {
        const response = await axios.get('http://localhost:8080/api/commits', {
          params: {
            since: '01.09.2024',
            key: 'SUF-5045'
          }
        });
        const { masterTasks, releaseTasks } = response.data;

        const releaseTasksMap = new Map();
        releaseTasks.forEach(task => releaseTasksMap.set(task.key, task.commits));

        this.masterTasks = masterTasks.map(task => ({
          ...task,
          releaseCommits: releaseTasksMap.get(task.key) || []
        }));
      } catch (error) {
        this.error = 'Error fetching commits: ' + error.message;
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    document.body.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
    this.fetchCommits();
  }
};
</script>

<style scoped>
.theme-switcher {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 20px;
  z-index: 1000;
}

.b-card, .table {
  transition: background-color 0.3s, color 0.3s;
}
</style>
