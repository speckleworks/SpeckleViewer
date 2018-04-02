<template>
  <div id="app">
    <md-app>
      <md-app-toolbar class="md-primary md-dense" style='z-index: 10'>
        <div class="md-toolbar-row">
          <div class="md-toolbar-section-start">
            <md-button class='md-icon-button md-raised' @click.native='showAccounts=!showAccounts'>
              <md-icon style='color: black'>account_circle</md-icon>
              <md-tooltip md-direction="bottom">Your Account</md-tooltip>
            </md-button>
            <md-button class='md-icon-button md-raised' @click.native='showStreamList=!showStreamList'>
              <md-icon style='color: black'>import_export</md-icon>
              <md-tooltip md-direction="bottom">streams</md-tooltip>
            </md-button>
            <md-button class='md-icon-button' @click.native='zoomExt'>
              <md-icon>zoom_out_map</md-icon>
              <md-tooltip md-direction="top">Zoom Extents</md-tooltip>
            </md-button>
            <md-button class='md-icon-button' @click.native='zoomToObject'>
              <md-icon>zoom_in</md-icon>
              <md-tooltip md-direction="top">Zoom to Selected</md-tooltip>
            </md-button>
          </div>
          <div class="md-toolbar-section-end">
            <a href="https://speckle.works">
              <img src='https://speckle.works/img/logos/logo-xs.png' width="17"/>
              <md-tooltip md-direction="left">Speckle.Works!</md-tooltip>
              </a>
          </div>
        </div>
      </md-app-toolbar>
      <md-app-content>
        <md-drawer :md-active.sync="showAccounts" style='z-index:100' class='md-dense'>
          <user-menu v-on:add="addReceiver" @closeme='showAccounts=false'></user-menu>
        </md-drawer>
        <md-drawer :md-active.sync="showStreamList" style='z-index:100' xxxmd-permanent="full" class='md-dense'>
          <speckle-stream-list></speckle-stream-list>
        </md-drawer>
        <speckle-renderer></speckle-renderer>
        <md-snackbar :md-active.sync="showSnackbar" md-position="center">
          <span>That stream is already here</span>
        </md-snackbar>
      </md-app-content>
    </md-app>
    <!--     <div id='main' class="md-layout md-gutter">
      <div class='md-layout-item md-size-33'>
        <user-menu v-on:add="addReceiver"></user-menu>
      </div>
      <div class='md-layout-item'>
        <speckle-renderer></speckle-renderer>
      </div>
      <div class="md-layout-item md-size-33">
        <speckle-stream-list> </speckle-stream-list>
      </div>
    </div> -->
    <!-- <div id='bottom-bar'>
      <div class='md-layout md-alignment-bottom-left'>
        <div class="md-layout-item md-size-50">
          <bottom-bar></bottom-bar>
        </div>
      </div>
    </div> -->
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
      showSnackbar: false,
      showStreamList: false,
      showAccounts: false
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
.md-app {
  height: 100vh;
  border: 1px solid rgba(#000, .12);
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
  /*  position: absolute;
  top: 10px;
  bottom: 0;
  left: 0;
  width: 100%;*/
}

</style>
