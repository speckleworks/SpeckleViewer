<template>
  <div id='search-bar'>
        <md-autocomplete
                     class="search"
                     v-model="selection"
                     v-on:input='select(selection)'
                     :md-options="objects"
                     md-layout="box">
          <label>Search...</label>
        </md-autocomplete>
  </div>
</template>

<script>
export default {
  name: 'SearchBar',
  props:{
    objects: { type: Array}
  },
  computed: {
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
  created(){
  }
}
</script>

<style scoped>
.search {
      min-width: 300px;
        
}
</style>
