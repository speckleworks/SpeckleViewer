<template>
<div>
  <md-card class="receiver paddedcard">  
    <md-card-header style='line-heigth:30px' class='line-height-adjustment'>
      <span class="md-body-2">
        <md-button class='md-icon-button md-dense xxxmd-accent xxxmd-raised' @click.native='expanded = ! expanded'>
          <md-icon>{{ expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</md-icon>
        </md-button>{{ spkreceiver.name }} 
      </span>
      <span class="md-caption"><code style="user-select:all">{{ spkreceiver.streamId }}</code></span>
      <br>
      <md-progress md-indeterminate v-show='showProgressBar' style='margin-bottom:20px;margin-top:20px;'></md-progress>
      <!-- <div class="md-caption"><br>ID: <code>{{ spkreceiver.streamId }}</code></div> -->
    </md-card-header>
    <md-card-content v-show='expanded'>
      <md-tabs md-fixedXXX class='md-transparent'>
        <md-tab id="layers" md-label="layers" class='receiver-tabs'>
            <speckle-receiver-layer v-for='layer in layers' :key='layer.guid' :spklayer='layer' :streamid='spkreceiver.streamId'></speckle-receiver-layer>
        </md-tab>
        <md-tab id='comments' md-label='views' class='receiver-tabs'>
          <speckle-receiver-comments :streamid='spkreceiver.streamId' v-on:comment-submit='commentSubmit' ></speckle-receiver-comments>
        </md-tab>
        <md-tab id='versions' md-label='versions' class='receiver-tabs'>
        <br>
        <div class="md-subhead">Todo.</div>
<!--           <speckle-receiver-comments :streamid='spkreceiver.streamId' v-on:comment-submit='commentSubmit' ></speckle-receiver-comments> -->
        </md-tab>
      </md-tabs>
      
    </md-card-content>
  </md-card>
</div>
</template>

<script>
import ReceiverClient             from '../receiver/SpeckleReceiver' // temporary solution to fix uglify error on build.
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
      isStale: false,
      expanded: true
    }
  },
  methods: {
    receiverError( err ) {
      this.errror = err
    },
    getComments( ) {
      this.$http.get( window.SpkAppConfig.serverDetails.restApi + '/comments/' + this.spkreceiver.streamId )
      .then( response => {
        if( !response.data.success ) throw new Error( 'Failed to retrieve comments for stream ' + this.spkreceiver.streamId )
        // if( response.data.comments.length <= 0 ) return console.warn( 'Stream had no commnets.' )
        let payload = { comments: response.data.comments }
        this.$store.commit( 'ADD_COMMENTS', { payload } )
      })
      .catch( err => {
        console.warn( err )
      })
    },
    receiverReady( name, layers, objects, history, layerMaterials ) {
      this.getComments() 
      
      this.showProgressBar = false
      this.objLoadProgress = 0
      let payload = { streamId: this.spkreceiver.streamId, name: name, layers: layers, objects: objects, layerMaterials: layerMaterials }
      this.$store.commit( 'INIT_RECEIVER_DATA',  { payload } )
      
      bus.$emit('renderer-update')
      this.isStale = true
    },
    liveUpdate( name, layers, objects, history ) {
      console.info( 'live update event' )
      this.showProgressBar = false
      this.objLoadProgress = 0

      let payload = { streamId: this.spkreceiver.streamId, name: name, layers: layers, objects: objects }
      this.$store.commit( 'SET_RECEIVER_DATA',  { payload } )
      
      bus.$emit('renderer-update')
      this.isStale = true
    },
    metadataUpdate( name, layers ) {
      let payload = { streamId: this.spkreceiver.streamId, name: name, layers: layers }
      this.$store.commit( 'SET_RECEIVER_METADATA',  { payload } )
    },
    objLoadProgressEv( loaded ) {
      this.objLoadProgress = ( loaded + 1 ) / this.objects.length * 100
    },
    commentSubmit( comment ) {
      let payload = comment
      payload.streamId = this.spkreceiver.streamId

      this.$http.post( window.SpkAppConfig.serverDetails.restApi + '/comments', { comment: comment }, { headers: { Authorization: this.$store.getters.authToken } } )
      .then( response => {
        if( ! response.data.success ) throw new Error( 'Failed to post comment for a reason.' )
        this.$store.commit( 'ADD_COMMENT', { payload } )
        this.mySpkReceiver.broadcast(  { event: 'comment-added',  comment: comment } )
      })
      .catch( err => { 
        console.log( err ) 
      })
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
    console.log( 'Receiver mounted: ' + this.spkreceiver.streamId )
    this.name = 'loading ' + this.spkreceiver.streamId
    this.mySpkReceiver = new ReceiverClient({
      serverUrl: this.spkreceiver.serverUrl,
      streamId: this.spkreceiver.streamId,
      token: this.spkreceiver.token
    })

    this.mySpkReceiver.on( 'error', this.receiverError )
    this.mySpkReceiver.on( 'ready', this.receiverReady )
    this.mySpkReceiver.on( 'live-update', this.liveUpdate )
    this.mySpkReceiver.on( 'metadata-update', this.metadataUpdate )
    this.mySpkReceiver.on( 'object-load-progress', this.objLoadProgressEv )
    this.mySpkReceiver.on( 'volatile-broadcast', this.broadcastReceived )
  }
}
</script>

<style>
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
