<template>
<div>
  <md-card class="receiver xxxpaddedcard">  
    <md-card-header style='line-heigth:30px' class='line-height-adjustment'>
      <span class="md-body-2">
        <md-button class='md-icon-button md-dense xxxmd-accent xxxmd-raised' @click.native='expanded = ! expanded'>
          <md-icon>{{ expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</md-icon>
        </md-button>{{ spkreceiver.name }} 
      </span>
      <span class="md-caption"><code style="user-select:all">{{ spkreceiver.streamId }}</code></span>
      <br>
      <md-progress md-indeterminate v-show='showProgressBar' style='margin-bottom:20px;margin-top:20px;'></md-progress>
      <md-button v-show='expired' class='md-densexx md-warn md-raised md-icon-button' id='refresh-button' @click.native='getAndSetStream()'>
        <md-icon>refresh</md-icon>
        <md-tooltip v-if="!isIOS">Update available. Click to refresh.</md-tooltip>
      </md-button>
    </md-card-header>
    <md-card-content>
      <md-button @click.native='getControllers()' class='md-accent'>
        Get Sldiers
      </md-button>
      <br>
      <div v-for='controller in controllers'> {{ controller.Name }} :: {{ controller.Value }} :: {{ controller.Type }} </div>
      <br>
      <div v-for='slider in sliders'>
      <vue-slider v-model="slider.Value" :min='slider.Min' :max='slider.Max' :piecewise='false' :interval='slider.Step' :lazy='true'></vue-slider>
      <br>
      </div>

    </md-card-content>
  </md-card>
</div>
</template>

<script>
// import ReceiverClient             from '../receiver/SpeckleReceiver'
import ReceiverClient             from '../receiver/ClientReceiver'
import VueSlider                  from 'vue-slider-component'

import debounce                   from 'debounce'

export default {
  name: 'SpeckleReceiver',
  components: {
    VueSlider
  },
  props: ['spkreceiver'],
  computed: {
    username() {
      return this.$store.getters.user.name
    },
    layers() {
      return this.spkreceiver.layers
    },
    sliders() {
      return this.controllers.filter( c => c.Type === 'Slider' )
    },
    isIOS ( ) {
      return (typeof window.orientation !== "undefined") && (navigator.userAgent.indexOf('OS X') !== -1)
    },
  },
  data () {
    return {
      showProgressBar: true,
      objLoadProgress: 100,
      comments: 'Hello World. How Are you? Testing testing 123.',
      expanded: true, 
      expired: false,
      controllers: [],
      responses: [],
      showControllers: false
    }
  },
  methods: {
    receiverError( err ) {
      this.errror = err
    },

    getControllers() {
      // this.responses = []
      // this.controllers = []
      this.showProgressBar = true
      this.mySpkReceiver.broadcast( { eventType: 'get-defintion-io' } )
      setTimeout( this.finaliseIo, 1000 )
    },

    collateResponses( wsMessage ) {
      this.responses.push( wsMessage )
    },

    finaliseIo() {
      this.showControllers = true
      this.showProgressBar = false
      let controllerList = this.responses[0].controllers
      controllerList.forEach( c => { 
        c.pieceWise = Math.abs(c.Max - c.Min) * c.Step < 20 ? true : false
        this.controllers.push( c ) 
      })
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
    this.mySpkReceiver.on( 'get-def-io-response', this.collateResponses )
  }
}
</script>

<style>
#refresh-button {
  position: absolute;
  right: 12px;
  top: 12px;
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
