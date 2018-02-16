<template>
  <div>
    <md-toolbar class='md-primary'>
      <div class="md-toolbar-row ">
        <div>
          <md-button @click.native='zoomExt'>
            <md-icon>zoom_out_map</md-icon>
            <md-tooltip md-direction="top">Zoom Extents</md-tooltip>
          </md-button>
        </div>
        <div>
            <md-button class="md-icon-button">
              <md-icon>search</md-icon>
            </md-button>
        </div>
        <search-bar :objects="searchObjects"></search-bar>
      </div>
    </md-toolbar>
  </div>
</template>
<script>

import SearchBar from './SearchBar.vue'

export default {
  name: 'BottomBar',
  components: {
    SearchBar
  },
  methods: {
    zoomExt() {
      bus.$emit('zext')
    }
  },
  computed: {
    objects( ) {
      return this.$store.getters.allObjects
    },
    searchObjects() {
      //flesh this out to provide the list of objects we want to search
      let objectIds  = this.objects.map((object, index, objects) => {
        return object._id
      })
      return objectIds
    }
  }
}
</script>
<style scoped>
</style>
