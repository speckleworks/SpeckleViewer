<template>
  <div id='stream-list'>
    <md-toolbar class="md-transparent md-dense" md-elevation="0">
      <span class="md-title">Streams</span>
      <md-button class="md-icon-button md-list-action" v-on:click='toggleShowNewStream'>
        <md-icon>add</md-icon>
        <md-tooltip md-delay="800">Add a stream to the viewer</md-tooltip>
      </md-button>
    </md-toolbar>
    <md-list>
      <speckle-receiver v-on:drop="dropReceiver" v-for='receiver in receivers' :key='receiver.streamId' :spkreceiver='receiver'></speckle-receiver>
    </md-list>
    <speckle-new-stream-dialog v-on:close='showNewStreamDialog = false' v-if='showNewStreamDialog'></speckle-new-stream-dialog>
  </div>
</template>
<script>
import SpeckleReceiver from './SpeckleReceiver.vue'
import SpeckleNewStreamDialog from './SpeckleNewStreamDialog.vue'
import NewReceiver from './NewReceiver.vue'

export default {
  name: 'SpeckleStreamList',
  components: {
    SpeckleReceiver,
    NewReceiver,
    SpeckleNewStreamDialog
  },
  computed: {
    receivers( ) {
      return this.$store.getters.allReceivers
    }
  },
  data( ) {
    return {
      showStreamList: true,
      showNewStreamDialog: false
    }
  },
  methods: {
    dialogClosed( ) {

    },
    toggleStreamList( ) {
      this.showStreamList = !this.showStreamList
    },
    toggleShowNewStream( ) {
      this.showNewStreamDialog = !this.showNewStreamDialog
    },
    dropReceiver( streamId ) {
      console.log( 'Dropping receiver:', streamId )
      this.$store.commit( 'DROP_RECEIVER', { streamId } )
      bus.$emit( 'renderer-drop-stream', streamId )
      bus.$emit( 'renderer-update' )
    }
  },
  created( ) {
    bus.$on( 'showstreamadd', ( ) => {
      this.showNewStreamDialgue = true
    } )
  }
}

</script>
<style scoped>
.md-drawer {
  width: auto;
}

#streamsButton {
  float: right;
}


/*
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
 */

#stream-list div {}

</style>
