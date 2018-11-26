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
          <p>Owner: <strong>{{owner.name}} {{owner.surname}}</strong></p>
        </md-tab>
        <md-tab id="tab-layers" md-label="Layers" xxx-md-icon='layers'>
          <div xxxlass='md-inset' v-for='layer in layers' :key='layer.guid'>
            <speckle-receiver-layer :spklayer='layer' :streamid='spkreceiver.streamId'></speckle-receiver-layer>
          </div>
        </md-tab>
        <md-tab id="tab-controllers" md-label="Controllers" xxx-md-icon='sliders'>
          <div v-for='controller in controllers' :key='controller.guid'>
            <controller :controller='controller' v-on:changed='controllersChanged' :enabled='!computeInProgress'></controller>
          </div>
          <div v-if='!controllers || !controllers.length'>
            <p class='md-caption'>No controllers are broadcasting for this stream (make sure you "enable remote control" on the gh sender).</p>
          </div>
          <br>
          <div style="text-align: right">
            <md-button class='md-dense md-raised xxx-no-margin md-icon-button' @click.native='getControllers()'>
              <md-icon>refresh</md-icon>
              <md-tooltip>Refresh controller list.</md-tooltip>
            </md-button>&nbsp
            <md-button v-if='currentComputeResponse!=null' class='md-dense md-raised no-margin' @click.native='restoreOriginal()'>
              Restore original
            </md-button>
          </div>
          <br>
          <br>
          <md-progress-bar md-mode="indeterminate" v-if='showComputeProgressBar'></md-progress-bar>
        </md-tab>
        <md-tab id="tab-history" md-label="History">
          <p v-show='spkreceiver.children.length == 0' class='md-caption'>This stream has no history.</p>
          <history-item v-for='streamId in historyStreams' :key='streamId' :streamid='streamId' :selected='streamId==selectedHistoryItem' v-on:selectme='historySelect' v-on:restore='restoreLatest'></history-item>
          <br>
          <p v-show='spkreceiver.children.length != 0'>Showing {{historyStreams.length}} out of {{spkreceiver.children.length}} history items.</p>
          <md-button v-if='historyStreams.length < spkreceiver.children.length' class='md-dense md-raised no-margin' @click.native='maxHistoryObjects+=10'>
            Load 10 more...
          </md-button>
        </md-tab>
      </md-tabs>
    </md-card-content>
  </md-card>
</template>
<script>
import qp from 'query-parse'
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
      selectedHistoryStream: null,
      currentComputeResponse: null,
      showComputeProgressBar: false,
      computeInProgress: false,
      maxHistoryObjects: 10,
      owner: { name: null, surname: null }
    }
  },
  computed: {
    historyStreams( ) {
      return this.spkreceiver.children.reverse( ).slice( 0, this.maxHistoryObjects )
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
  methods: {
    // returning  back from history
    restoreLatest( ) {
      let prevHistoryObjs = this.selectedHistoryStream.objects.map( o => o._id )
      bus.$emit( 'r-unload-objects', { objs: prevHistoryObjs, streamId: this.selectedHistoryStream.streamId } )

      let toUnGhost = this.spkreceiver.objects.map( o => o._id )
      bus.$emit( 'r-unghost-objects', toUnGhost )
      this.selectedHistoryItem = null
    },

    // returning back from controllers
    restoreOriginal( ) {
      let toUnload = this.currentComputeResponse.objects.map( o => o._id )
      bus.$emit( 'r-unload-objects', { objs: toUnload, streamId: this.currentComputeResponse.streamId } )
      this.spkreceiver.objects = [ ]
      this.refreshStreamObjects( )
      this.getControllers( )
    },

    async historySelect( streamId ) {
      if ( this.selectedHistoryItem === streamId ) return
      console.log( `History selection ${streamId}` )

      // get the requested history stream
      let res = await this.$http.get( `${this.$store.state.server}/streams/${streamId}` )
      let stream = res.data.resource

      // unload previous selected history objects  (TODO: check for overlaps with new stream)
      if ( this.selectedHistoryItem !== null ) {
        let toUnload = this.selectedHistoryStream.objects.map( o => o._id )
        bus.$emit( 'r-unload-objects', { objs: toUnload, streamId: this.selectedHistoryStream.streamId } )
      }

      // ghost objects from original
      let toGhost = this.spkreceiver.objects.filter( obj => stream.objects.find( o => o._id === obj._id ) == null ).map( o => o._id )
      bus.$emit( 'r-ghost-objects', toGhost )

      // unghost objects from original
      let toUnGhost = this.spkreceiver.objects.filter( obj => stream.objects.find( o => o._id === obj._id ) != null ).map( o => o._id )
      bus.$emit( 'r-unghost-objects', toUnGhost )


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

        let ownerResp = await this.$http.get( `${this.$store.state.server}/accounts/${stream.owner}` )
        this.owner = ownerResp.data.resource

        this.updateUrl( )
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

      // unload history, if any loaded
      if ( this.selectedHistoryItem !== null )
        bus.$emit( 'r-unload-objects', { objs: this.selectedHistoryStream.objects.map( o => o._id ), streamId: this.selectedHistoryItem } )

      // unload compute response, if any loaded
      if ( this.currentComputeResponse !== null )
        bus.$emit( 'r-unload-objects', { objs: this.currentComputeResponse.objects.map( o => o._id ), streamId: this.currentComputeResponse.streamId } )

      this.myClientReceiver.disposeClient( )
      this.$store.commit( 'DROP_RECEIVER', { streamId } )
      this.updateUrl( )
    },

    updateGlobal( ) {
      console.info( 'live update event' )
      this.viewerSettings.autoRefresh ? this.refreshStreamObjects( ) : this.expired = true
    },

    async updateMeta( ) {
      console.log( "todo: update metatada" )
    },

    getControllers( ) {
      console.log( 'Getting controllers for ' + this.spkreceiver.streamId )
      this.myClientReceiver.broadcast( { eventType: 'get-definition-io' } )
    },

    addControllers( wsMessage ) {
      this.senderId = wsMessage.senderId
      this.controllers = wsMessage.args.controllers
      // console.log( this.controllers )
    },

    controllersChanged( ) {
      console.log( 'controllers changed', this.controllers )
      this.showComputeProgressBar = true
      let args = { controllers: this.controllers, layers: this.spkreceiver.layers, client: this.myClientReceiver, senderId: this.senderId }
      this.computeInProgress = true
      this.sendComputeRequest( args )
    },

    async computeResponse( streamId ) {
      console.log( `got ${streamId} as compute response` )

      let res = await this.$http.get( this.$store.state.server + '/streams/' + streamId )
      let stream = res.data.resource

      let toUnload = this.spkreceiver.objects.filter( obj => stream.objects.find( o => o._id === obj._id ) == null ).map( o => o._id )
      bus.$emit( 'r-unload-objects', { objs: toUnload, streamId: this.spkreceiver.streamId } )

      if ( this.currentComputeResponse != null ) {
        // unload it
        let toUnload = this.currentComputeResponse.objects.filter( obj => stream.objects.find( o => o._id === obj._id ) == null ).map( o => o._id )
        bus.$emit( 'r-unload-objects', { objs: toUnload, streamId: this.currentComputeResponse.streamId } )
      }

      this.currentComputeResponse = stream

      // set basics
      stream.objects.forEach( ( obj, i ) => {
        obj.streams = [ stream.streamId ]
        let layer = stream.layers.find( layer => { return i >= layer.startIndex && i < ( layer.startIndex + layer.objectCount ) } )
        obj.layerGuids = [ layer.guid ]
      } )


      let toRequest = stream.objects.filter( obj => this.inRenderObjects.indexOf( obj._id ) === -1 )
      let toUpdateProps = stream.objects.filter( obj => this.inRenderObjects.indexOf( obj._id ) !== -1 )

      bus.$emit( 'r-load-objects', { toRequest: toRequest, zoomExt: false } )
      bus.$emit( 'r-update-props', toUpdateProps )

      this.showComputeProgressBar = false
      this.computeInProgress = false
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
    }, 700 ),

    revertToParent( ) {
      this.streamParent = null
      this.getAndSetStream( )
      bus.$emit( 'snackbar-update', "Restoring parent stream" )
    },

    updateUrl( ) {
      let streams = this.$store.getters.allReceivers.map( r => r.streamId ).join( ',' )
      // check if we have a query first
      if ( window.location.href.includes( '?' ) ) {
        let query = window.location.href.split( '?' )
        let queryObject = qp.toObject( query[ 1 ] )
        let newQuery = '?'
        // recreate the query:
        // 1. include the server, if it was present
        if ( queryObject.server )
          newQuery += 'server=' + queryObject.server + '&'
        // 2. add the streams list, if we actually have any receivers
        if ( this.$store.getters.allReceivers.length !== 0 )
          newQuery += 'streams=' + streams
        // 3. get that in the url bar
        history.replaceState( { spk: 'changed history' }, "Speckle Viewer Rocks", newQuery )
        // if no query, just barge in and add the streams list, but do check if we have any streams to actually add
      } else if ( this.$store.getters.allReceivers.length !== 0 ) {
        history.replaceState( { spk: 'changed history' }, "Speckle Viewer Rocks", '?streams=' + streams )
      }
    }
  },
  mounted( ) {
    this.viewerSettings = this.$store.getters.viewerSettings
    console.log( 'Stream receiver mounted for streamid: ' + this.spkreceiver.streamId )
    this.name = 'loading ' + this.spkreceiver.streamId

    this.myClientReceiver = new ClientReceiver( {
      baseUrl: this.spkreceiver.serverUrl,
      streamId: this.spkreceiver.streamId,
      token: this.$store.state.jwtToken
    } )

    this.myClientReceiver.on( 'error', this.receiverError )
    this.myClientReceiver.on( 'ready', this.receiverReady )
    this.myClientReceiver.on( 'update-meta', this.updateMeta )
    this.myClientReceiver.on( 'update-global', this.updateGlobal )
    this.myClientReceiver.on( 'get-def-io-response', this.addControllers )
    this.myClientReceiver.on( 'compute-response', this.computeResponse )
  }
}

</script>
<style>
</style>
