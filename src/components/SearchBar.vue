<template>
  <span id='search-bar'>
  <!-- <div id='search-bar'> -->
    <!-- <md-button class="md-icon-button md-raised" @click="toggleSearchBar"> -->
    <!--   <md-icon>search</md-icon> -->
    <!--   <md-tooltip>Search</md-tooltip> -->
    <!-- </md-button> -->
    <!-- <md-toolbar class="md-dense"> -->
    <!--   <div class="md-toolbar-row "> -->
        <!-- <div class="md-toolbar-section-start"> -->
        <!--   <md-button class="md-icon-button"> -->
        <!--     <md-icon>search</md-icon> -->
        <!--   </md-button> -->
        <!-- </div> -->
        <md-autocomplete
                     class="search"
                     v-model="selection"
                     :md-options="objects"
                     md-layout="box">
          <label>Search...</label>
        </md-autocomplete>
      <!-- </div> -->
    <!-- </md-toolbar> -->
  </span>
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
    }
  },
  created(){
    console.log(this.objects)
  }
}
</script>

<style scoped>
</style>
