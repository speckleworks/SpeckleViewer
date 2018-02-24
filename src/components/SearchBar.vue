<template>
  <md-autocomplete v-if='objects.length>0'
    class="search"
    v-model="selection"
    v-on:input='select(selection)'
    :md-options="objects"
    md-layout="box">
    <label>Search...</label>
  </md-autocomplete>
</template>

<script>
export default {
  name: 'SearchBar',
  props:{
    objects: { type: Array}
  },
  data() {
    return {
      selection: null,
      searchVisible: false
    }
  },
  methods: {
    toggleSearchBar() {
      this.searchVisible = ! this.searchVisible
    },
    select(selection) {
      bus.$emit('select-bus', selection)
    }
  },
}
</script>

<style scoped>
.search {
}
</style>
