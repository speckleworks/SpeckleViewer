<template>
  <div>
  <speckle-stream-list></speckle-stream-list>
  <speckle-renderer></speckle-renderer>
  <speckle-color-picker></speckle-color-picker>
  </div>
</template>

<script>
import SpeckleStreamList  from './SpeckleStreamList.vue'
import SpeckleRenderer    from './SpeckleRenderer.vue'
import SpeckleColorPicker from './SpeckleColorPicker.vue'

export default {
  name: 'SpeckleViewer',
  components: {
    SpeckleStreamList,
    SpeckleRenderer,
    SpeckleColorPicker
  },
  computed: {
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