<template>
  <div id="app">
    <md-app>
      <md-app-toolbar class="md-primary md-dense" style='z-index: 10'>
        <div class="md-toolbar-row">
          <div class="md-toolbar-section-start">
            <md-button class='md-icon-button md-raised' @click.native='showAccounts=!showAccounts'>
              <md-icon style='color: black'>
                {{ showAccounts ? "close" : "menu"}}
              </md-icon>
              <md-tooltip md-direction="bottom">Menu</md-tooltip>
            </md-button>
            <md-button class='md-icon-button' @click.native='zoomExt'>
              <md-icon>zoom_out_map</md-icon>
              <md-tooltip md-direction="top">Zoom Extents</md-tooltip>
            </md-button>
            <md-button class='md-icon-button' @click.native='zoomToObject'>
              <md-icon>zoom_in</md-icon>
              <md-tooltip md-direction="top">Zoom to Selected</md-tooltip>
            </md-button>
              <md-button class='md-icon-button' @click.native='showViewSelect = !showViewSelect'>
              <md-icon>videocam</md-icon>
              <md-tooltip md-direction="top">Set camera view</md-tooltip>
            </md-button>
            <md-field v-if=showViewSelect class='view-field'>
              <label for='view'>View</label>
              <md-select v-model="view" name="view" id="view">
              <md-option value="top">Top</md-option>
              <md-option value="front">Front</md-option>
              <md-option value="right">Right</md-option>
              <md-option value="3d">Perspective</md-option>
            </md-select>
            </md-field>
            <!-- <search-bar class="md-toolbar-section-start" :objects="searchobjects"></search-bar> -->
          </div>
          <div class="md-toolbar-section-end">
            <a href="https://speckle.works">
              <img src='https://speckle.works/img/logos/logo-xs.png' width="17"/>
              <md-tooltip md-direction="left">Speckle.Works!</md-tooltip>
            </a>
          </div>
        </div>
      </md-app-toolbar>
      <md-app-drawer :md-active.sync="showAccounts" style='z-index:100' class='md-elevation-4' md-persistent="full">
        <sidebar-menu v-on:add="addReceiver"></sidebar-menu>
      </md-app-drawer>
      <md-app-content>
        <speckle-renderer></speckle-renderer>
        <md-snackbar :md-active.sync="showSnackbar" md-position="center">
          <span>That stream is already here</span>
        </md-snackbar>
      </md-app-content>
    </md-app>
  </div>
</template>
<script>
import SpeckleRenderer from './components/SpeckleRenderer.vue'
import SidebarMenu from './components/SidebarMenu.vue'
import SearchBar from './components/SearchBar.vue'

export default {
  name: 'app',
  props: [ ],
  components: {
    SidebarMenu,
    SpeckleRenderer,
    SearchBar
  },
  data( ) {
    return {
      showSnackbar: false,
      showStreamList: false,
      showAccounts: false,
      showViewSelect: false,
      view: '3d'
    }
  },
  methods: {
    zoomExt( ) {
      bus.$emit( 'zext' )
    },
    zoomToObject( ) {
      bus.$emit( 'zoomToObject' )
    },
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
    searchobjects( ) {
      let objects = this.$store.getters.allObjects
      if ( objects.length === 0 ) return [ ]
        let objectIds = objects.map( ( obj ) => {
          return obj.type + ' ' + obj._id
        } )
      return objectIds
    },
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
.view-field {
  width: auto;
}

.md-menu-content{
  max-height:none;
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
