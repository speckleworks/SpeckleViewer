<template>
<div id="stream-list-cover">
  <div id='stream-list'>
    <speckle-receiver v-for='receiver in receivers' :key='receiver.streamId' :spkreceiver='receiver'></speckle-receiver>
    <div class='paddedcard' style='position:relative;' v-show='receivers.length === 0'>
      <div class="md-title">There are no clients to show.</div>
      <p>You can add a new client by click on the big plus button above.</p>
    </div>
  </div>
</div>
</template>

<script>
import SpeckleReceiver from './SpeckleReceiver.vue'
import NewReceiver     from './NewReceiver.vue'

export default {
  name: 'SpeckleStreamList',
  components: {
    SpeckleReceiver,
    NewReceiver
  },
  computed: {
    receivers() {
      return this.$store.getters.allReceivers
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
#stream-list-cover{
  position: fixed;
  top:5%;
  height: 90%;
  left: -5px;
  width: 390px;
  overflow: hidden;
  z-index: 99;
  pointer-events: none;
}
#stream-list {
  position: relative;
  padding-right: 10px;
  left: 10px;
  top: 0;
  max-height:100%;
  width: 400px;
  box-sizing: border-box;
  overflow-y: scroll;
  z-index: 100;
  pointer-events: auto;
}
#stream-list div {
}
</style>