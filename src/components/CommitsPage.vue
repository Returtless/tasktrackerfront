<template>
  <b-container>
    <b-row>
      <b-col>
        <b-card>
          <b-card-title>
            <h1>Commits Page</h1>
          </b-card-title>
          <b-card-sub-title>
            <!-- Loading spinner -->
            <b-spinner v-if="loading" type="border" variant="primary"></b-spinner>

            <!-- Error message -->
            <b-alert v-if="error" variant="danger" dismissible>
              {{ error }}
            </b-alert>
          </b-card-sub-title>
          <b-card-body>
            <b-table v-if="!loading && !error" :items="masterTasks" :fields="fields">
              <template #cell(issues)="data">
                <b-button :href="`https://job-jira.otr.ru/browse/${data.item.key}`" target="_blank">
                  {{ data.item.key }}
                </b-button>
              </template>
              <template #cell(masterCommits)="data">
                <b-table :items="data.item.commits" :fields="commitFields">
                  <template #cell(commit)="data">
                    <b-button :href="`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${data.item.mrNumber}`" target="_blank">
                      {{ data.item.mrNumber }}
                    </b-button>
                  </template>
                </b-table>
              </template>
              <template #cell(releaseCommits)="data">
                <b-table :items="data.item.releaseCommits" :fields="commitFields">
                  <template #cell(commit)="data">
                    <b-button :href="`https://otr-dp-suf-prod-gl-suf01.otr.ru/suf/suf/-/merge_requests/${data.item.mrNumber}`" target="_blank">
                      {{ data.item.mrNumber }}
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

        // Map release tasks by key for easier lookup
        const releaseTasksMap = new Map();
        releaseTasks.forEach(task => releaseTasksMap.set(task.key, task.commits));

        // Add release commits to master tasks based on key
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
    this.fetchCommits();
  }
};
</script>
