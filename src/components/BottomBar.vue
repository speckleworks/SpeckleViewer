<template>
  <div>
    <md-button @click.native='zoomExt'>
      <md-icon>zoom_out_map</md-icon>
    </md-button>
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
