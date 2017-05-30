<template>
  <div>
    <speckle-renderer></speckle-renderer>
    <speckle-stream-list v-show='!isMobileView'></speckle-stream-list>
    <speckle-color-picker v-if='!isMobileView'></speckle-color-picker>
    <speckle-mobile-nav v-if='isMobileView'></speckle-mobile-nav>
  </div>
</template>

<script>
import SpeckleStreamList  from './SpeckleStreamList.vue'
import SpeckleRenderer    from './SpeckleRenderer.vue'
import SpeckleColorPicker from './SpeckleColorPicker.vue'
import SpeckleMobileNav   from './SpeckleMobileNav.vue'

export default {
  name: 'SpeckleViewer',
  components: {
    SpeckleStreamList,
    SpeckleRenderer,
    SpeckleColorPicker,
    SpeckleMobileNav
  },
  computed: {
    isMobileView() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent) && window.innerWidth < 768
    }
  },
  data() {
    return {
    }
  },
  methods: {
  },
  created() {

  }
}
</script>

<style scoped>
</style>