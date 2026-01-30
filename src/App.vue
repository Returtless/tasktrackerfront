<template>
  <router-view></router-view>
  <notifications position="bottom right" :max="5" :width="320"></notifications>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
/* Global styles for your application */
body {
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
}
</style>
