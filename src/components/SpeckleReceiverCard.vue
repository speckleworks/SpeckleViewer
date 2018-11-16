<template>
  <md-card md-with-hover class='md-elevation-0' style='margin-bottom:10px;'>
    <md-card-header>
      <md-card-header-text>
        <div class="md-title">{{spkreceiver.name}}</div>
        <div class="md-caption">{{spkreceiver.streamId}}</div>
      </md-card-header-text>
      <md-button class="md-icon-button xxx-md-raised" v-on:click='removeReceiver(spkreceiver.streamId)'>
        <md-icon>close</md-icon>
      </md-button>
      <md-button v-show='expired' class='md-icon-button md-dense md-accent md-raised' @click.native='getAndSetStream()'>
        <md-icon>refresh</md-icon>
        <md-tooltip v-if="!isIOS">Update available. Click to refresh.</md-tooltip>
      </md-button>
    </md-card-header>
    <md-card-content>
      <md-tabs>
        <md-tab id="tab-info" md-label="Info" xxx-md-icon='info'>
          <p>Created on: <strong>{{createdAt}}</strong></p>
          <p>Modified on: <strong>{{createdAt}}</strong></p>
          <p>Units: <strong>{{spkreceiver.baseProperties.units}}</strong></p>
        </md-tab>
        <md-tab id="tab-layers" md-label="Layers" xxx-md-icon='layers'>
          <div xxxlass='md-inset' v-for='layer in layers' :key='layer.guid'>
            <speckle-receiver-layer :spklayer='layer' :streamid='spkreceiver.streamId'></speckle-receiver-layer>
          </div>
        </md-tab>
        <md-tab id="tab-controllers" md-label="Controllers" xxx-md-icon='sliders'>
          <md-list-item class='md-inset' v-for='controller in controllers' :key='controller.guid'>
            <controller :controller='controller'></controller>
          </md-list-item>
          <div v-if='!controllers || !controllers.length'>
            <p class='md-caption'>No controllers are broadcasting for this stream.</p>
            <md-button v-if='!controllers || !controllers.length' class='md-dense md-raised no-margin' @click.native='getControllers()'>
              refresh
            </md-button>
          </div>
        </md-tab>
        <md-tab id="tab-history" md-label="History" xxx-md-icon='sliders'>
          <p v-show='spkreceiver.children.length == 0' class='md-caption'>This stream has no history.</p>
          <history-item v-for='streamId in historyStreams' :key='streamId' :streamid='streamId' :selected='streamId==selectedHistoryItem' v-on:selectme='historySelect' v-on:restore='restoreLatest'></history-item>
        </md-tab>
      </md-tabs>
    </md-card-content>
  </md-card>
</template>
<script>
import ClientReceiver from '../receiver/ClientReceiver'
import SpeckleReceiverLayer from './SpeckleReceiverLayer.vue'
import HistoryItem from './SpeckleReceiverHistoryItem.vue'
import Controller from './Controller.vue'

import debounce from 'debounce'

export default {
  name: 'SpeckleReceiver',
  components: {
    SpeckleReceiverLayer,
    Controller,
    HistoryItem
  },
  props: [ 'spkreceiver' ],
  data( ) {
    return {
      comments: 'Hello World. How Are you? Testing testing 123.',
      expired: false,
      debounceCount: 0,
      senderId: null,
      viewerSettings: {},
      controllers: [ ],
      controllersChecked: false,
      streamParent: null,
      selectedHistoryItem: null
    }
  },
  computed: {
    historyStreams( ) {
      return this.spkreceiver.children.reverse( )
    },
    createdAt( ) {
      return new Date( this.spkreceiver.createdAt ).toLocaleString( )
    },
    username( ) {
      return this.$store.getters.user.name
    },
    layers( ) {
      return this.spkreceiver.layers
    },
    sliders( ) {
      return this.controllers.filter( c => c.InputType === 'Slider' )
    },
    isIOS( ) {
      return ( typeof window.orientation !== "undefined" ) && ( navigator.userAgent.indexOf( 'OS X' ) !== -1 )
    },
  },
  watch: {
    'controllers': {
      handler( values ) {
        // prevents init requests etc.
        if ( this.debounceCount >= 5 ) {
          let args = { controllers: this.controllers, layers: this.spkreceiver.layers, client: this.mySpkReceiver, senderId: this.senderId }
          this.sendComputeRequest( args )
        }
        this.debounceCount++
      },
      deep: true
    }
  },
  methods: {
    restoreLatest( ) {
      this.selectedHistoryItem = null
      bus.$emit( 'toggle-dim-stream', { streamId: this.spkreceiver.streamId, dim: false } )
    },

    historySelect( streamid ) {
      console.log( streamid )
      this.selectedHistoryItem = streamid
      bus.$emit( 'toggle-dim-stream', { streamId: this.spkreceiver.streamId, dim: true } )
    },

    receiverError( err ) {
      this.error = err
      if ( err == 'Remote control is disabled for this sender' ) { // need a more elegant error handler for progress bar

      }
      bus.$emit( 'snackbar-update', err )
    },

    receiverReady( stream ) {
      this.streamParent = this.mySpkReceiver.stream.parent

      let payload = { ...stream }

      this.$store.commit( 'INIT_RECEIVER_DATA', { payload } )
      bus.$emit( 'load-stream-objects', stream.streamId )
    },

    removeReceiver( streamId ) {
      this.$store.commit( 'DROP_RECEIVER', { streamId } )
      bus.$emit( 'drop-stream-objects', streamId )
      //this.$emit( 'drop', stream )
    },

    updateGlobal( ) {
      console.info( 'live update event' )
      this.viewerSettings.autoRefresh ? this.getAndSetStream( ) : this.expired = true
    },

    getAndSetStream( ) {
      this.expired = false

      bus.$emit( 'drop-stream-objects', this.spkreceiver.streamId )

      this.mySpkReceiver.getStream( stream => {
        console.log( stream )
        let payload = { streamId: this.spkreceiver.streamId, name: stream.name, layers: stream.layers, objects: stream.objects }
        this.$store.commit( 'SET_RECEIVER_DATA', { payload } )

        bus.$emit( 'load-stream-objects', stream.streamId )
      } )

    },

    updateMeta( ) {
      this.mySpkReceiver.getStreamNameAndLayers( ( name, layers ) => {
        let payload = { streamId: this.spkreceiver.streamId, name: name, layers: layers }
        this.$store.commit( 'SET_RECEIVER_METADATA', { payload } )
      } )
    },

    broadcastReceived( message ) {
      console.log( 'broadcastReceived message:', message )
      let parsedMessage = JSON.parse( message.args )
      console.log( 'broadcastReceived parsedMessage:', parsedMessage )
      if ( parsedMessage.event != 'comment-added' ) return
      let payload = parsedMessage.comment
      this.$store.commit( 'ADD_COMMENT', { payload } )
    },

    getControllers( ) {
      console.log( 'Getting controllers for ' + this.spkreceiver.streamId )
      this.mySpkReceiver.broadcast( { eventType: 'get-definition-io' } )
    },
    addControllers( wsMessage ) {
      this.senderId = wsMessage.senderId
      this.controllers = wsMessage.args.controllers
    },

    sendComputeRequest: _.debounce( args => {
      console.log( 'sendComputeRequest args:', args )
      let requestParams = args.controllers.map( controller => {
        return {
          guid: controller.guid,
          value: controller.inputType != 'Point' ? controller.value : { X: controller.X, Y: controller.Y, Z: controller.Z },
          inputType: controller.inputType
        }
      } )
      let message = { eventType: 'compute-request', requestParameters: requestParams }
      console.log( 'Sending computation request. requestParams:', requestParams )
      args.client.sendMessage( message, args.senderId )
    }, 500 ),

    revertToParent( ) {
      this.streamParent = null
      this.getAndSetStream( )
      bus.$emit( 'snackbar-update', "Restoring parent stream" )
    }
  },

  mounted( ) {
    this.viewerSettings = this.$store.getters.viewerSettings
    console.log( 'Stream receiver mounted for streamid: ' + this.spkreceiver.streamId )
    this.name = 'loading ' + this.spkreceiver.streamId

    this.mySpkReceiver = new ClientReceiver( {
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
</style>
