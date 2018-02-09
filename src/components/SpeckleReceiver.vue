<template>
  <div>
    <md-toolbar class="md-transparent md-dense" md-elevation="0">
      <span class="md-toolbar-section-end">
        <md-button v-show='expired' class='md-icon-button md-dense md-accent' @click.native='getAndSetStream()'>
          <md-icon>refresh</md-icon>
          <md-tooltip>Update available. Click to refresh.</md-tooltip>
        </md-button>
        <md-button class="md-icon-button md-dense" @click.native='receiverExpanded = ! receiverExpanded'>
          <md-icon>{{ receiverExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</md-icon>
        </md-button>
      </span>
      <span>{{spkreceiver.name}}</span>
    </md-toolbar>
    <md-progress-bar md-mode="indeterminate" v-show='showProgressBar'></md-progress-bar>
    <md-list class='md-dense' v-show='receiverExpanded'>
      <md-subheader class='md-inset'>
        Layers
        <md-button class="md-icon-button md-dense" @click.native='layersExpanded = ! layersExpanded'>
          <md-icon>{{ layersExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</md-icon>
        </md-button>
      </md-subheader>
      <md-list-item v-show='layersExpanded' class='md-inset' v-for='layer in layers' :key='layer.guid'>
        <speckle-receiver-layer :spklayer='layer' :streamid='spkreceiver.streamId'></speckle-receiver-layer>
      </md-list-item>
      <md-subheader class='md-inset'>
        Comments
        <md-button class="md-icon-button md-dense" @click.native='commentsExpanded = ! commentsExpanded'>
          <md-icon>{{ commentsExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</md-icon>
        </md-button>
      </md-subheader>
      <md-list-item v-show='commentsExpanded' class='md-inset'>Soon™</md-list-item>
      <md-subheader class='md-inset'>
        History
        <md-button class="md-icon-button md-dense" @click.native='historyExpanded = ! historyExpanded'>
          <md-icon>{{ historyExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</md-icon>
        </md-button>
      </md-subheader>
      <md-list-item v-show='historyExpanded' class='md-inset'>Soon™</md-list-item>
    </md-list>

    <!-- <md-card class="receiver paddedcard"> -->  
    <!--   <md-card-header style='line-heigth:30px' class='line-height-adjustment'> -->
    <!--     <span class="md-body-2"> -->
    <!-- <md-button class='md-icon-button md-dense xxxmd-accent xxxmd-raised' @click.native='expanded = ! expanded'> -->
    <!-- <md-button class='md-icon-button md-dense xxxmd-accent xxxmd-raised' @click.native='expanded = ! expanded'> -->
    <!--   <md-icon>{{ expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</md-icon> -->

    <!-- </md-button>{{ spkreceiver.name }} --> 
    <!-- </span> -->
    <!-- <span class="md-caption"><code style="user-select:all">{{ spkreceiver.streamId }}</code></span> -->
    <!-- <br> -->
    <!-- <md-progress-bar md-mode="indeterminate" v-show='showProgressBar' style='margin-bottom:20px;margin-top:20px;'></md-progress-bar> -->
    <!-- <md-button v-show='expired' class='md-densexx md-warn md-raised md-icon-button' id='refresh-button' @click.native='getAndSetStream()'> -->
    <!-- <md-icon>refresh</md-icon> -->
    <!-- <md-tooltip>Update available. Click to refresh.</md-tooltip> -->
    <!-- </md-button> -->
    <!-- </md-card-header> -->
    <!-- <md-card-content v-show='expanded'> -->
    <!--       <md-tabs md-fixedXXX class='md-transparent'>
      <md-tab id="layers" md-label="layers" class='receiver-tabs'>
    -->
    <!-- <speckle-receiver-layer v-for='layer in layers' :key='layer.guid' :spklayer='layer' :streamid='spkreceiver.streamId'></speckle-receiver-layer> -->
    <!--         </md-tab>
      <md-tab id='comments' md-label='views' class='receiver-tabs'>
      <speckle-receiver-comments :streamid='spkreceiver.streamId' v-on:comment-submit='commentSubmit' ></speckle-receiver-comments>
      </md-tab>
      <md-tab id='versions' md-label='versions' class='receiver-tabs'>
      <br>
      <div class="md-subhead">Todo.</div>
      <speckle-receiver-comments :streamid='spkreceiver.streamId' v-on:comment-submit='commentSubmit' ></speckle-receiver-comments>
      </md-tab>
      </md-tabs> -->

      <!-- </md-card-content> -->
      <!-- </md-card> -->
  </div>
</template>

<script>
import ReceiverClient             from '../receiver/ClientReceiver'
import SpeckleReceiverLayer       from './SpeckleReceiverLayer.vue'
import SpeckleReceiverComments    from './SpeckleReceiverComments.vue'

import Converter                  from '../converter/converter'
import * as THREE                 from 'three'
import debounce                   from 'debounce'

export default {
  name: 'SpeckleReceiver',
  components: {
    SpeckleReceiverLayer,
    SpeckleReceiverComments
  },
  props: ['spkreceiver'],
  computed: {
    username() {
      return this.$store.getters.user.name
    },
    layers() {
      return this.spkreceiver.layers
    }
  },
  data () {
    return {
      showProgressBar: true,
      objLoadProgress: 100,
      comments: 'Hello World. How Are you? Testing testing 123.',
      receiverExpanded: false, 
      layersExpanded: false, 
      commentsExpanded: false, 
      historyExpanded: false, 
      expired: false
    }
  },
  methods: {
    receiverError( err ) {
      this.errror = err
    },

    receiverReady( name, layers, objects, history, layerMaterials ) {
      this.showProgressBar = false
      this.objLoadProgress = 0
      let payload = { streamId: this.spkreceiver.streamId, name: name, layers: layers, objects: objects, layerMaterials: layerMaterials }

      this.$store.commit( 'INIT_RECEIVER_DATA',  { payload } )

      bus.$emit('renderer-update')
    },

    updateGlobal( ) {
      console.info( 'live update event' )
      this.expired = true
      // this.showProgressBar = false
      // this.objLoadProgress = 0

      // let payload = { streamId: this.spkreceiver.streamId, name: name, layers: layers, objects: objects }
      // this.$store.commit( 'SET_RECEIVER_DATA',  { payload } )

      // bus.$emit('renderer-update')
      // this.isStale = true
    },

    getAndSetStream( ) {
      this.showProgressBar = true
      this.expired = false
      this.mySpkReceiver.getStream( stream => {
        let payload = { streamId: this.spkreceiver.streamId, name: stream.name, layers: stream.layers, objects: stream.objects }
        this.$store.commit( 'SET_RECEIVER_DATA',  { payload } )
        this.showProgressBar = false
        bus.$emit('renderer-update')
      } )

    },

    updateMeta( ) {
      this.mySpkReceiver.getStreamNameAndLayers( ( name, layers ) => {
        let payload = { streamId: this.spkreceiver.streamId, name: name, layers: layers }
        this.$store.commit( 'SET_RECEIVER_METADATA',  { payload } )  
      })      
    },

    objLoadProgressEv( loaded ) {
      this.objLoadProgress = ( loaded + 1 ) / this.objects.length * 100
    },

    broadcastReceived( message ) {
      console.log( message )
      let parsedMessage = JSON.parse( message.args )
      console.log( parsedMessage )
      if( parsedMessage.event != 'comment-added' ) return
        let payload = parsedMessage.comment
      this.$store.commit( 'ADD_COMMENT', { payload } )
    }
  },
  mounted() {
    console.log( 'Stream receiver mounted for streamid: ' + this.spkreceiver.streamId )
    this.name = 'loading ' + this.spkreceiver.streamId

    this.mySpkReceiver = new ReceiverClient({
      baseUrl: this.spkreceiver.serverUrl ,
      streamId: this.spkreceiver.streamId,
      token: this.spkreceiver.token
    })

    this.mySpkReceiver.on( 'error', this.receiverError )
    this.mySpkReceiver.on( 'ready', this.receiverReady )
    this.mySpkReceiver.on( 'update-meta', this.updateMeta )
    this.mySpkReceiver.on( 'update-global', this.updateGlobal )
  }
}
</script>

<style>
.md-list .md-subheader.md-inset{
  padding-left:32px;
}

.line-height-adjustment{
  line-height: 30px;
}
.receiver {
  margin-bottom: 10px;
}
.receiver-tabs {
  padding: 0 !important;
}
</style>
