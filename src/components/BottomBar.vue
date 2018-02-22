<template>
  <div>
    <md-toolbar class='md-primary'>
      <div>
        <md-button @click.native='zoomExt'>
          <md-icon>zoom_out_map</md-icon>
          <md-tooltip md-direction="top">Zoom Extents</md-tooltip>
        </md-button>
      </div>
      <search-bar :objects="searchObjects"></search-bar>
    </md-toolbar>
  </div>
</template>
<script>

import SearchBar from './SearchBar.vue'

export default {
  name: 'BottomBar',
  data: {
    searchObjects: ''
  },
  components: {
    SearchBar
  },
  methods: {
    zoomExt() {
      bus.$emit('zext')
    },
    getSearchObjects() {
      //flesh this out to provide the list of objects we want to search
      let objectIds  = this.objects.map((object, index, objects) => {
        return object._id
      })
      return objectIds
    }
  },
  computed: {
    objects( ) {
      return this.$store.getters.allObjects
    },
  },
  created () {
    this.searchObjects = this.getSearchObjects()
    console.log(this.searchObjects)
  }
}
</script>
<style scoped>
</style>
