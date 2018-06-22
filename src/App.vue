<template>
  <div id="app">
      <div>
        <md-dialog :md-active.sync="showSettings">
          <md-dialog-title>Settings</md-dialog-title>
          <md-list class='md-inset'>
                <md-subheader>Global settings for the Speckle Viewer</md-subheader>
                <md-list-item>
                  <md-switch class='md-primary' v-model="viewerSettings.autoRefresh"> Automatic refresh on Stream update?</md-switch>
                </md-list-item>
          </md-list>
          <md-dialog-actions>
            <md-button class="md-primary" @click="showSettings=false; saveSettings(viewerSettings)">Save</md-button>
          </md-dialog-actions>
        </md-dialog>
      </div>
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
            <md-button class='md-icon-button' @click.native='showAddStreamDialog=true'>
              <md-icon>add</md-icon>
              <md-tooltip md-direction="top">Add a stream to the viewer</md-tooltip>
            </md-button>
            <md-button class='md-icon-button' @click.native='zoomExt'>
              <md-icon>zoom_out_map</md-icon>
              <md-tooltip md-direction="top">Zoom Extents</md-tooltip>
            </md-button>
            <md-button class='md-icon-button' @click.native='toggleObjectDetails()'>
              <md-icon>list</md-icon>
              <md-tooltip md-direction="top">Show details for selected objects</md-tooltip>
            </md-button>
            <!-- <md-button class='md-icon-button' @click.native='showViewSelect = !showViewSelect'> -->
            <!--   <md-icon>videocam</md-icon> -->
            <!--   <md-tooltip md-direction="top">Set camera view</md-tooltip> -->
            <!-- </md-button> -->
            <!-- <md-field v-if=showViewSelect class='view-field'> -->
            <!--   <label for='view'>View</label> -->
            <!--   <md-select v-model="view" name="view" id="view"> -->
            <!--     <md-option value="top">Top</md-option> -->
            <!--     <md-option value="front">Front</md-option> -->
            <!--     <md-option value="right">Right</md-option> -->
            <!--     <md-option value="3d">Perspective</md-option> -->
            <!--   </md-select> -->
            <!-- </md-field> -->
            <!-- <search-bar class="md-toolbar-section-start" :objects="searchobjects"></search-bar> -->
          </div>
          <div class="md-toolbar-section-end">
            <md-button class='md-icon-button' @click='showSettings =! showSettings'>
              <md-icon>settings</md-icon>
            </md-button>
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
          <span>{{snackbarMessage}}</span>
        </md-snackbar>
        <md-dialog :md-active.sync="showAddStreamDialog">
          <md-dialog-title>Load a stream into the viewer</md-dialog-title>
          <md-dialog-content>
            <md-field md-clearable>
              <md-input v-model="addStreamString" placeholder="Enter a streamId..."></md-input>
            </md-field>
          </md-dialog-content>
          <md-dialog-actions>
            <md-button class="md-primary" @click="addStreamString=null; showAddStreamDialog=false">Cancel</md-button>
            <md-button class="md-primary" @click="addReceiver(addStreamString)">Add</md-button>
          </md-dialog-actions>
        </md-dialog>
        <md-dialog :md-active.sync="showObjectDetails">
          <md-dialog-title>Details:</md-dialog-title>
          <md-dialog-content>
            <object-details label='Details' :nodes='selectedObjects'></object-details>
          </md-dialog-content>
        </md-dialog>
      </md-app-content>
    </md-app>
  </div>
</template>
<script>
import SpeckleRenderer from './components/SpeckleRenderer.vue'
import SidebarMenu from './components/SidebarMenu.vue'
import SearchBar from './components/SearchBar.vue'
import ObjectDetails from './components/ObjectDetails.vue'

export default {
  name: 'app',
  props: [ ],
  components: {
    SidebarMenu,
    SpeckleRenderer,
    SearchBar,
    ObjectDetails
  },
  data( ) {
    return {
      showSnackbar: false,
      showAddStreamDialog: false,
      addStreamString: null,
      showStreamList: false,
      showAccounts: false,
      showViewSelect: false,
      showSettings: false,
      showObjectDetails: false,
      view: '3d',
      viewerSettings: {},
      snackbarMessage: null
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
        this.$store.commit( 'ADD_RECEIVERS', { receivers } )
      }
    },
    addReceiver( streamId ) {
      if (!streamId)
      {
        this.snackbarMessage = 'Invalid streamId'
        return this.showSnackbar = true
      }
      console.log( 'Adding a receiver', streamId )
      if ( this.$store.getters.receiverById( streamId ) ){
        this.snackbarMessage = 'That stream is already loaded'
        return this.showSnackbar = true
      }
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
    saveSettings (settings) {
      window.localStorage.setItem('viewerSettings', JSON.stringify(settings))
      this.$store.commit( 'SET_VIEWER_SETTINGS', { settings } )
    },
    snackbarUpdate (message) {
      this.snackbarMessage = message
      this.showSnackbar = true
    },
    toggleObjectDetails () {
      if (!this.selectedObjects)
      {
        return this.snackbarUpdate("No objects selected")
      }
      this.showObjectDetails = true
    }
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
    if (window.localStorage.getItem('viewerSettings') !== null ) {
      this.$store.commit('SET_VIEWER_SETTINGS', {settings: JSON.parse(window.localStorage.getItem('viewerSettings'))})
    }
    this.viewerSettings = this.$store.getters.viewerSettings
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
    },
    selectedObjects() {
      return this.$store.getters.selectedObjects
    }
  },
  mounted () {
    bus.$on( 'snackbar-update', this.snackbarUpdate)
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
