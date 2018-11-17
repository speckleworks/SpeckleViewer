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
      <md-button v-show='expired' class='md-icon-button md-dense md-accent md-raised' @click.native='refreshStreamObjects()'>
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
      selectedHistoryItem: null,
      selectedHistoryStream: null
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
    inRenderObjects( ) {
      return this.$store.state.inRenderObjects
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
      let prevHistoryObjs = this.selectedHistoryStream.objects.map( o => o._id )
      bus.$emit( 'r-unload-objects', { objs: prevHistoryObjs, streamId: this.selectedHistoryStream.streamId } )

      let toUnGhost = this.spkreceiver.objects.map( o => o._id )
      bus.$emit( 'r-unghost-objects', toUnGhost )
      this.selectedHistoryItem = null
    },

    async historySelect( streamId ) {
      if( this.selectedHistoryItem === streamId ) return
      console.log( `History selection ${streamId}` )

      // unload previous selected history objects
      if ( this.selectedHistoryItem !== null ) {
        let prevHistoryObjs = this.selectedHistoryStream.objects.map( o => o._id )
        bus.$emit( 'r-unload-objects', { objs: prevHistoryObjs, streamId: this.selectedHistoryStream.streamId } )
      }

      let res = await this.$http.get( `${this.$store.state.server}/streams/${streamId}` )
      let stream = res.data.resource

      // ghost original stream only if we didn't ghost it before
      // if ( this.selectedHistoryItem === null ) {
        let toGhost = this.spkreceiver.objects.filter( obj => stream.objects.find( o => o._id === obj._id ) == null ).map( o => o._id )
        bus.$emit( 'r-ghost-objects', toGhost )

        let toUnGhost = this.spkreceiver.objects.filter( obj => stream.objects.find( o => o._id === obj._id ) != null ).map( o => o._id )
        bus.$emit( 'r-unghost-objects', toUnGhost )
      // }

      this.selectedHistoryItem = streamId
      this.selectedHistoryStream = stream

      // set basics
      stream.objects.forEach( ( obj, i ) => {
        obj.streams = [ stream.streamId ]
        let layer = stream.layers.find( layer => { return i >= layer.startIndex && i < ( layer.startIndex + layer.objectCount ) } )
        obj.layerGuids = [ layer.guid ]
      } )

      let toRequest = stream.objects.filter( obj => this.inRenderObjects.indexOf( obj._id ) === -1 )
      bus.$emit( 'r-load-objects', { toRequest: toRequest, zoomExt: false } )

      let toUpdateProps = stream.objects.filter( obj => this.inRenderObjects.indexOf( obj._id ) !== -1 )
      bus.$emit( 'r-update-props', toUpdateProps )

      // console.log( 'ghost, request, update', toGhost, toRequest, toUpdateProps )
    },

    async receiverReady( stream ) {
      try {
        let res = await this.$http.get( this.$store.state.server + '/streams/' + this.spkreceiver.streamId )
        let payload = { ...res.data.resource }
        let stream = payload

        this.$store.commit( 'INIT_RECEIVER_DATA', { payload } )
        // set basics
        stream.objects.forEach( ( obj, i ) => {
          obj.streams = [ stream.streamId ]
          let layer = stream.layers.find( layer => { return i >= layer.startIndex && i < ( layer.startIndex + layer.objectCount ) } )
          obj.layerGuids = [ layer.guid ]
        } )

        let toRequest = stream.objects.filter( obj => this.inRenderObjects.indexOf( obj._id ) === -1 )
        let toUpdateProps = stream.objects.filter( obj => this.inRenderObjects.indexOf( obj._id ) !== -1 )

        bus.$emit( 'r-load-objects', { toRequest: toRequest, zoomExt: true } )
        bus.$emit( 'r-update-props', toUpdateProps )
      } catch ( e ) {
        console.warn( e )
      }
    },

    async refreshStreamObjects( ) {
      console.log( 'updating stream' )
      try {
        let res = await this.$http.get( this.$store.state.server + '/streams/' + this.spkreceiver.streamId )
        let stream = res.data.resource

        // set basics
        stream.objects.forEach( ( obj, i ) => {
          obj.streams = [ stream.streamId ]
          let layer = stream.layers.find( layer => { return i >= layer.startIndex && i < ( layer.startIndex + layer.objectCount ) } )
          obj.layerGuids = [ layer.guid ]
        } )

        let toUnload = this.spkreceiver.objects.filter( obj => stream.objects.find( o => o._id === obj._id ) == null ).map( o => o._id )
        bus.$emit( 'r-unload-objects', { objs: toUnload, streamId: stream.streamId } )

        let toRequest = stream.objects.filter( obj => this.inRenderObjects.indexOf( obj._id ) === -1 )
        let toUpdateProps = stream.objects.filter( obj => this.inRenderObjects.indexOf( obj._id ) !== -1 )

        let payload = { ...res.data.resource }
        this.$store.commit( 'INIT_RECEIVER_DATA', { payload } )

        bus.$emit( 'r-load-objects', { toRequest: toRequest, zoomExt: false } )
        bus.$emit( 'r-update-props', toUpdateProps )
        this.expired = false
      } catch ( e ) {
        console.warn( e )
      }
    },

    removeReceiver( streamId ) {
      let toUnload = this.spkreceiver.objects.map( o => o._id )
      bus.$emit( 'r-unload-objects', { objs: toUnload, streamId: this.spkreceiver.streamId } )
      this.$store.commit( 'DROP_RECEIVER', { streamId } )
    },

    updateGlobal( ) {
      console.info( 'live update event' )
      this.viewerSettings.autoRefresh ? this.refreshStreamObjects( ) : this.expired = true
    },

    async updateMeta( ) {

    },

    getControllers( ) {
      console.log( 'Getting controllers for ' + this.spkreceiver.streamId )
      this.mySpkReceiver.broadcast( { eventType: 'get-definition-io' } )
    },

    addControllers( wsMessage ) {
      this.senderId = wsMessage.senderId
      this.controllers = wsMessage.args.controllers
    },

    receiverError( err ) {
      this.error = err
      if ( err == 'Remote control is disabled for this sender' ) { // need a more elegant error handler for progress bar
      }
      bus.$emit( 'snackbar-update', err )
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
