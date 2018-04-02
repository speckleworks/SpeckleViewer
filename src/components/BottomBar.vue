<template>
  <div>
    <md-toolbar class='md-primary'>
      <div class='md-toolbar-row'>
        <div>
          <md-button class='md-icon-button md-raised' @click.native='zoomExt'>
            <md-icon style='color: black'>account_circle</md-icon>
            <md-tooltip md-direction="bottom">Your Account</md-tooltip>
          </md-button>
          <md-button class='md-icon-button md-raised' @click.native='zoomExt'>
            <md-icon style='color: black'>import_export</md-icon>
            <md-tooltip md-direction="bottom">streams</md-tooltip>
          </md-button>
          
          <md-button class='md-icon-button' @click.native='zoomExt'>
            <md-icon>zoom_out_map</md-icon>
            <md-tooltip md-direction="top">Zoom Extents</md-tooltip>
          </md-button>
          <md-button class='md-icon-button' @click.native='zoomToObject'>
            <md-icon>zoom_in</md-icon>
            <md-tooltip md-direction="top">Zoom to Selected</md-tooltip>
          </md-button>
        </div>
        <search-bar class="md-toolbar-section-start" :objects="searchObjects"></search-bar>
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
    zoomExt( ) {
      bus.$emit( 'zext' )
    },
    zoomToObject( ) {
      bus.$emit( 'zoomToObject' )
    }
  },
  computed: {
    searchObjects( ) {
      //flesh this out to provide the list of objects we want to search
      let objects = this.$store.getters.allObjects
      let objectIds = objects.map( ( object, index, objects ) => {
        return object._id
      } )
      return objectIds
    }
  },
}

</script>
<style scoped>


</style>
