<template>
<div id="stream-list-cover">
  <div class='list-menu'>
    <md-button class="md-icon-button md-warn" @click.native='showNewStreamDialgue = true'>
      <md-icon>add</md-icon>
    </md-button>
    <md-button class="md-icon-button md-primary" @click.native='toggleStreamList'>
      <md-icon>{{ showStreamList ? 'keyboard_arrow_left':'keyboard_arrow_right' }}</md-icon>
      <md-tooltip> {{ showStreamList ? 'Hide' : 'Show' }} the stream list.</md-tooltip>
    </md-button>
  </div>
  <div id='stream-list' class='' ref='thestreamlist'>
    <speckle-receiver v-for='receiver in receivers' :key='receiver.streamId' :spkreceiver='receiver'></speckle-receiver>
    <div class='paddedcard' style='position:relative;' v-show='receivers.length === 0'>
      <div class="md-title">There are no clients to show.</div>
      <p>You can add a new client by click on the add button above.</p>
    </div>
  </div>
  <speckle-new-stream-dialog v-on:close='showNewStreamDialgue = false' v-show='showNewStreamDialgue'></speckle-new-stream-dialog>
</div>
</template>

<script>
import SpeckleReceiver            from './SpeckleReceiver.vue'
import SpeckleNewStreamDialog     from './SpeckleNewStreamDialog.vue'
import NewReceiver                from './NewReceiver.vue'

export default {
  name: 'SpeckleStreamList',
  components: {
    SpeckleReceiver,
    NewReceiver,
    SpeckleNewStreamDialog
  },
  computed: {
    receivers() {
      return this.$store.getters.allReceivers
    }
  },
  data() {
    return {
      showStreamList: true,
      showNewStreamDialgue: false
    }
  },
  methods: {
    dialogClosed() {

    },
    toggleStreamList() {
      this.showStreamList = ! this.showStreamList
      console.log(this.$refs.thestreamlist  )
      this.$refs.thestreamlist.classList.toggle('hidden')
    }
  },
  created() {
    bus.$on('showstreamadd', () => {
      this.showNewStreamDialgue = true
    })
  }
}
</script>

<style scoped>
#stream-list-cover{
  position: fixed;
  padding-top: 10px;
  padding-bottom: 10px;
  top:0px;
  height: 100%;
  left: 10px;
  width: 340px;
  overflow: hidden;
  z-index: 99;
  pointer-events: none;
  box-sizing: border-box;
}
.list-menu {
  pointer-events: auto;
  position: relative;
  left: 10px;
  margin-bottom: 10px;
  height: 5%;
}
#stream-list {
  position: relative;
  padding-right: 10px;
  left: 10px;
  top: 0;
  max-height:95%;
  width: 350px;
  box-sizing: border-box;
  overflow-y: scroll;
  z-index: 100;
  pointer-events: auto;
  transition: all .2s ease;
  opacity: 1;
}
#stream-list.hidden{
  left: -500px;
  opacity: 0;
}

#stream-list div {
}
</style>