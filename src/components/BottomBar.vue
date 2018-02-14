<template>
  <div>
    <md-toolbar class='md-dense'>
      <md-button @click.native='zoomExt'>
        <md-icon>zoom_out_map</md-icon>
        <md-tooltip md-direction="top">Zoom Extents</md-tooltip>
      </md-button>
    </md-toolbar>
  </div>
</template>
<script>

export default {
  name: 'BottomBar',
  methods: {
    zoomExt() {
      bus.$emit('zext')
    }
  }
}
</script>
<style scoped>
</style>
