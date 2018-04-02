<template>
  <div id="app">
    <div id='main' class="md-layout md-gutter">
      <div class='md-layout-item md-size-33'>
        <user-menu v-on:add="addReceiver"></user-menu>
      </div>
      <div class='md-layout-item'>
        <speckle-renderer></speckle-renderer>
      </div>
      <div class="md-layout-item md-size-33">
        <speckle-stream-list> </speckle-stream-list>
      </div>
    </div>
    <div id='bottom-bar'>
      <div class='md-layout md-alignment-bottom-center'>
        <div class="md-layout-item md-size-50">
          <bottom-bar></bottom-bar>
        </div>
      </div>
    </div>
    <md-snackbar :md-active.sync="showSnackbar" md-position="center">
      <span>That stream is already here</span>
    </md-snackbar>
  </div>
</template>
<script>
import SpeckleStreamList from './components/SpeckleStreamList.vue'
import SpeckleRenderer from './components/SpeckleRenderer.vue'
import LoginScreen from './components/LoginScreen.vue'
import SpeckleViewer from './components/SpeckleViewer.vue'
import UserMenu from './components/UserMenu.vue'
import BottomBar from './components/BottomBar.vue'

export default {
  name: 'app',
  props: [ ],
  components: {
    SpeckleStreamList,
    UserMenu,
    LoginScreen,
    SpeckleViewer,
    SpeckleRenderer,
    BottomBar,
  },
  data( ) {
    return {
      showSnackbar: false
    }
  },
  methods: {
    createReceivers( ) {
      if ( this.receiversCreated ) return
      if ( this.$store.state.initStreams.length != 0 ) {
        let receivers = this.$store.state.initStreams
          .filter( id => id != "" )
          .map( id => {
            return {
              serverUrl: this.$store.state.server,
              streamId: id,
              token: this.$store.getters.user.apitoken,
              objects: [ ],
              layers: [ ],
              history: [ ],
              name: 'Loading ' + id + '...',
              layerMaterials: [ ]
            }
          } )
        console.log( receivers )
        this.$store.commit( 'ADD_RECEIVERS', { receivers } )
      }
    },
    addReceiver( streamId ) {
      console.log( 'Adding a receiver', streamId )
      if ( this.$store.getters.receiverById( streamId ) )
        return this.showSnackbar = true
      let receiver = {
        serverUrl: this.$store.state.server,
        streamId: streamId,
        token: this.$store.getters.user.apitoken,
        objects: [ ],
        layers: [ ],
        history: [ ],
        name: 'Loading ' + streamId + '...',
        layerMaterials: [ ]
      }
      this.$store.commit( 'ADD_RECEIVER', { receiver } )
    },
  },

  created( ) {
    this.createReceivers( )
    this.$http.get( this.$store.state.server )
      .then( response => {
        var account = localStorage.getItem( 'userAccount' )
        var jwtToken = localStorage.getItem( 'userJwtToken' )
        if ( !jwtToken || jwtToken == '' )
          throw new Error( 'no login details found' )
        return this.$http.get( this.$store.state.server + '/accounts', {
          headers: {
            Authorization: JSON.parse( jwtToken )
          }
        } )
      } )
      .then( response => {
        if ( response.status != 200 ) throw new Error( response )
        let args = {
          guest: false,
          account: response.data
        }
        localStorage.setItem( 'userAccount', JSON.stringify( response.data ) )
      } )
      .catch( err => {
        console.warn( err )
      } )
  },
  computed: {
    isMobileView( ) {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test( navigator.userAgent ) && window.innerWidth < 768
    },
    receivers( ) {
      return this.$store.getters.allReceivers
    },
    objects( ) {
      return this.$store.getters.allObjects
    }
  }
}

</script>
<style>
.md-layout {
  padding: 8px;
}

#app {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

#main {}

#bottom-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
}

</style>
