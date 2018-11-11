<template>
  <div>
    <md-toolbar class="md-transparent md-dense" md-elevation="0">
      <span class="md-toolbar-section-end">
        <md-button v-show='expired' class='md-icon-button md-dense md-accent' @click.native='getAndSetStream()'>
          <md-icon>refresh</md-icon>
          <md-tooltip v-if="!isIOS">Update available. Click to refresh.</md-tooltip>
        </md-button>
        <md-button v-if="streamParent" class="md-icon-button md-list-action md-dense" @click="revertToParent()">
          <md-icon>undo</md-icon>
          <md-tooltip v-if="!isIOS" md-delay="800">Revert to the parent stream</md-tooltip>
        </md-button>
        <md-button class="md-icon-button md-dense" @click.native='receiverExpanded = ! receiverExpanded'>
          <md-icon>{{ receiverExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</md-icon>
        </md-button>
      </span>
      <md-button class="md-icon-button md-list-action md-dense" v-on:click='dropStream(spkreceiver.streamId)'>
        <md-icon>close</md-icon>
        <md-tooltip v-if="!isIOS" md-delay="800">Remove this stream from the viewer</md-tooltip>
      </md-button>
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
      <md-subheader class='md-inset'>
        Controllers
        <md-button class='md-icon-button md-dense' @click.native='toggleControllers()'>
          <md-icon>{{ controllersExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</md-icon>
        </md-button>
        <md-button v-if="controllersChecked" class='md-icon-button md-dense' @click.native='getControllers()'>
          <md-icon>refresh</md-icon>
        </md-button>
      </md-subheader>
      <md-list-item class='md-inset' v-if='controllersExpanded && (!controllers || !controllers.length)'>No controllers are broadcasting for this stream</md-list-item>
      <md-list-item class='md-inset' v-if='controllersExpanded' v-for='controller in controllers' :key='controller.guid'> 
        <controller :controller='controller'></controller>
      </md-list-item>
    </md-list>
  </div>
</template>
<script>
import ReceiverClient from '../receiver/ClientReceiver'
import SpeckleReceiverLayer from './SpeckleReceiverLayer.vue'
import SpeckleReceiverComments from './SpeckleReceiverComments.vue'
import Controller from './Controller.vue'

import Converter from '../converter/converter'
import * as THREE from 'three'
import debounce from 'debounce'

export default {
  name: 'SpeckleReceiver',
  components: {
    SpeckleReceiverLayer,
    SpeckleReceiverComments,
    Controller
  },
  props: [ 'spkreceiver' ],
  computed: {
    username( ) {
      return this.$store.getters.user.name
    },
    layers( ) {
      return this.spkreceiver.layers
    },
    sliders () {
      return this.controllers.filter( c => c.InputType === 'Slider' )
    },
    isIOS ( ) {
      return (typeof window.orientation !== "undefined") && (navigator.userAgent.indexOf('OS X') !== -1)
    },
  },
  data( ) {
    return {
      showProgressBar: true,
      objLoadProgress: 100,
      comments: 'Hello World. How Are you? Testing testing 123.',
      receiverExpanded: false,
      layersExpanded: false,
      commentsExpanded: false,
      historyExpanded: false,
      controllersExpanded: false,
      expired: false,
      debounceCount: 0,
      senderId: null,
      viewerSettings: {},
      controllers: [],
      controllersChecked: false,
      streamParent: null
    }
  },
  watch: {
    'controllers':{
      handler( values  ) {
        // prevents init requests etc. 
        if(this.debounceCount >= 5) { 
          let args = {
            controllers: this.controllers, 
            layers: this.spkreceiver.layers,
            client: this.mySpkReceiver, 
            senderId: this.senderId 
          }
          this.showProgressBar = true
          this.sendComputeRequest( args  )
        }
        this.debounceCount++
      },
      deep: true
    }  
  },
  methods: {
    receiverError( err ) {
      this.error = err
      if (err == 'Remote control is disabled for this sender'){ // need a more elegant error handler for progress bar
        this.showProgressBar = false
      }
      bus.$emit( 'snackbar-update', err)
    },

    receiverReady( name, layers, objects, history, layerMaterials ) {
      this.streamParent = this.mySpkReceiver.stream.parent
      this.showProgressBar = false
      this.objLoadProgress = 0
      let payload = { streamId: this.spkreceiver.streamId, name: name, layers: layers, objects: objects, layerMaterials: layerMaterials }

      this.$store.commit( 'INIT_RECEIVER_DATA', { payload } )

      bus.$emit( 'renderer-load-stream' )
    },

    updateGlobal( ) {
      console.info( 'live update event' )
      this.viewerSettings.autoRefresh ? this.getAndSetStream() : this.expired = true
    },

    getAndSetStream( ) {
      this.showProgressBar = true
      this.expired = false
      this.mySpkReceiver.getStream( stream => {
        console.log(stream)
        let payload = { streamId: this.spkreceiver.streamId, name: stream.name, layers: stream.layers, objects: stream.objects }
        this.$store.commit( 'SET_RECEIVER_DATA', { payload } )
        this.showProgressBar = false
        bus.$emit( 'renderer-update' )
      } )

    },

    updateMeta( ) {
      this.mySpkReceiver.getStreamNameAndLayers( ( name, layers ) => {
        let payload = { streamId: this.spkreceiver.streamId, name: name, layers: layers }
        this.$store.commit( 'SET_RECEIVER_METADATA', { payload } )
      } )
    },

    objLoadProgressEv( loaded ) {
      this.objLoadProgress = ( loaded + 1 ) / this.objects.length * 100
    },

    broadcastReceived( message ) {
      console.log( 'broadcastReceived message:', message )
      let parsedMessage = JSON.parse( message.args )
      console.log( 'broadcastReceived parsedMessage:', parsedMessage )
      if ( parsedMessage.event != 'comment-added' ) return
      let payload = parsedMessage.comment
      this.$store.commit( 'ADD_COMMENT', { payload } )
    },
    dropStream( stream ) {
      this.$emit( 'drop', stream )
    },
    toggleControllers( ) {
     this.controllersExpanded = ! this.controllersExpanded  
      if (!this.controllersChecked) {
        this.controllersChecked = true
        this.getControllers()
      }
    },
    getControllers () {
        console.log('Getting controllers for ' + this.spkreceiver.streamId)
        this.mySpkReceiver.broadcast( { eventType: 'get-definition-io'  }  )
    },
    addControllers(wsMessage){
      this.senderId = wsMessage.senderId
      this.controllers = wsMessage.args.controllers
    },
    sendComputeRequest: _.debounce( args => {
      console.log( 'sendComputeRequest args:', args  )
      let requestParams = args.controllers.map( controller => { 
        return {
          guid: controller.guid,
          value: controller.inputType != 'Point' ? controller.value : { X: controller.X, Y: controller.Y, Z: controller.Z  },
          inputType: controller.inputType
        }
      } )
      let message = { eventType: 'compute-request', requestParameters: requestParams  }
      console.log( 'Sending computation request. requestParams:', requestParams  )
      args.client.sendMessage( message,  args.senderId  ) 

    }, 500 ),
    revertToParent(){
      this.streamParent = null
      this.getAndSetStream()
      bus.$emit('snackbar-update', "Restoring parent stream")
    }
  },
  mounted( ) {
    this.viewerSettings = this.$store.getters.viewerSettings
    console.log( 'Stream receiver mounted for streamid: ' + this.spkreceiver.streamId )
    this.name = 'loading ' + this.spkreceiver.streamId

    this.mySpkReceiver = new ReceiverClient( {
      baseUrl: this.spkreceiver.serverUrl,
      streamId: this.spkreceiver.streamId,
      token: this.spkreceiver.token
    } )

    this.mySpkReceiver.on( 'error', this.receiverError )
    this.mySpkReceiver.on( 'ready', this.receiverReady )
    this.mySpkReceiver.on( 'update-meta', this.updateMeta )
    this.mySpkReceiver.on( 'update-global', this.updateGlobal )
    this.mySpkReceiver.on( 'get-def-io-response', this.addControllers )
  }
}

</script>
<style>
.md-list .md-subheader.md-inset {
  padding-left: 32px;
}

.md-list-item.md-inset .md-list-item-content {
  padding-left: 48px;
}

.line-height-adjustment {
  line-height: 30px;
}

.receiver {
  margin-bottom: 10px;
}

.receiver-tabs {
  padding: 0 !important;
}

</style>
