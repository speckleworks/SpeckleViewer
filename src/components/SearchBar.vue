<template>
  <!-- <div style="margin-left: 20px; padding:2px; background: white">
    <md-chips class='md-primary' v-model="fruits" md-placeholder="Add filter conditions!">
    </md-chips>
  </div> -->
  <md-autocomplete  class="search" v-model="selection" v-on:input='select(selection)' md-layout="box">
    <label>Search...</label>
  </md-autocomplete>

<!--   <md-field md-clearable md-layout="box" style='color: white !important'>
      <label>Cleareable</label>
      <md-input v-model="initial"></md-input>
    </md-field> -->
</template>
<script>
export default {
  name: 'SearchBar',
  data( ) {
    return {
      selection: null,
      searchVisible: false,
      fruits: [ 'area>10' ]
    }
  },
  methods: {
    toggleSearchBar( ) {
      this.searchVisible = !this.searchVisible
    },
    select( selection ) {
      bus.$emit( 'select-bus', selection )
    }
  },
}

</script>
<style scoped>
.search {}

</style>
