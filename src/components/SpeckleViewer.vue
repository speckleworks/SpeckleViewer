<template>
  <div>
    <speckle-renderer></speckle-renderer>
    <speckle-stream-list v-show='!isMobileView'></speckle-stream-list>
    <speckle-color-picker v-if='!isMobileView'></speckle-color-picker>
    <speckle-mobile-nav v-if='isMobileView' v-on:addstream='showNewStreamDialgue = true'></speckle-mobile-nav>
    <speckle-new-stream-dialog v-on:close='showNewStreamDialgue = false' v-show='showNewStreamDialgue'></speckle-new-stream-dialog>
    <md-button class="md-fab md-fab-bottom-right md-mini" @click.native='zoomExt'>
      <md-icon>zoom_out_map</md-icon>
    </md-button>
  </div>
</template>
<script>
import SpeckleStreamList from './SpeckleStreamList.vue'
import SpeckleRenderer from './SpeckleRenderer.vue'
import SpeckleColorPicker from './SpeckleColorPicker.vue'
import SpeckleMobileNav from './SpeckleMobileNav.vue'
import SpeckleNewStreamDialog from './SpeckleNewStreamDialog.vue'

export default {
  name: 'SpeckleViewer',
  components: {
    SpeckleStreamList,
    SpeckleRenderer,
    SpeckleColorPicker,
    SpeckleMobileNav,
    SpeckleNewStreamDialog
  },
  computed: {
    receivers( ) {
      return this.$store.getters.allReceivers
    },
    isMobileView( ) {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test( navigator.userAgent ) && window.innerWidth < 768
    }
  },
  data( ) {
    return {
      showNewStreamDialgue: false
    }
  },
  methods: {
    showStreamAdd( ) {},
    zoomExt() {
      bus.$emit('zext')
    }
  },
  mounted( ) {
    if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test( navigator.userAgent ) && window.innerWidth < 768 )
      this.$store.commit( 'MOBILE_VIEW' )
  }
}
</script>
<style scoped>
</style>