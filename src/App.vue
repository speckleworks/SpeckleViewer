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
      <md-app-toolbar class="md-transparent xxx-md-dense md-elevation-0 no-shadow" style='z-index: 10'>
        <div class="md-toolbar-row">
          <div class="md-toolbar-section-start">
            <md-button class='md-icon-button' @click.native='showAccounts=!showAccounts'>
              <md-icon xxx-style='color: black'>
                {{ showAccounts ? "arrow_left" : "menu"}}
              </md-icon>
            </md-button>
            <md-button class='md-icon-button' @click.native='showAddStreamDialog=true'>
              <md-icon>add</md-icon>
              <md-tooltip v-if="!isIOS" md-direction="top">Add a stream to the viewer</md-tooltip>
            </md-button>
            <md-button class='md-icon-button' @click.native='zoomExt'>
              <md-icon>zoom_out_map</md-icon>
              <md-tooltip v-if="!isIOS" md-direction="top">Zoom Extents / To Selected Object</md-tooltip>
            </md-button>
            <md-button v-show='selectedObjects!=null' class='md-icon-button' @click.native='toggleObjectDetails()'>
              <md-icon>list</md-icon>
              <md-tooltip v-if="!isIOS" md-direction="top">Show details for selected objects</md-tooltip>
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
            <!-- <search-bar class="md-toolbar-section-start"></search-bar> -->
          </div>
          <div class="md-toolbar-section-end">
            <p> {{ progressMessage }}</p>
            <md-button class='md-icon-button' @click='showSettings =! showSettings'>
              <md-icon>settings</md-icon>
              <md-tooltip v-if="!isIOS" md-direction="top">Global settings for the Speckle viewer</md-tooltip>
            </md-button>
            <a href="https://speckle.works">
              <img src='https://speckle.works/img/logos/logo-xs.png' width="17"/>
              <md-tooltip v-if="!isIOS" md-direction="left">Speckle.Works!</md-tooltip>
            </a>
          </div>
        </div>
      </md-app-toolbar>
      <md-app-drawer :md-active.sync="showAccounts" style='padding:14px; box-sizing:border-box; background-color:#448aff;' class='md-scrollbar md-elevation-4 md-primary' md-persistent="full">
        <sidebar-menu v-on:addreceiver="addReceiver"></sidebar-menu>
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
        <md-dialog v-show="selectedObjects!=null" style="position: absolute;" :md-close-on-esc="false" :md-click-outside-to-close="false" :md-backdrop="false" v-drag :md-active.sync="showObjectDetails">
          <md-button class="md-mini md-flat md-icon-button" @click="showObjectDetails=false">
            <md-icon>close</md-icon>
          </md-button>
          <md-dialog-content>
            <div class="md-subheading">Object Details:</div>
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

import drag from '@branu-jp/v-drag'

export default {
  name: 'app',
  props: [ ],
  components: {
    SidebarMenu,
    SpeckleRenderer,
    SearchBar,
    ObjectDetails
  },
  directives: {
    drag
  },
  data( ) {
    return {
      showSnackbar: false,
      showAddStreamDialog: false,
      addStreamString: null,
      showStreamList: false,
      showAccounts: true,
      showViewSelect: false,
      showSettings: false,
      showObjectDetails: false,
      view: '3d',
      viewerSettings: {},
      snackbarMessage: null,
      progressMessage: 'All is ready.'
    }
  },
  computed: {
    isMobileView( ) {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test( navigator.userAgent ) && window.innerWidth < 768
    },
    isIOS( ) {
      return ( typeof window.orientation !== "undefined" ) && ( navigator.userAgent.indexOf( 'OS X' ) !== -1 )
    },
    receivers( ) {
      return this.$store.getters.allReceivers
    },
    objects( ) {
      return this.$store.getters.allObjects
    },
    selectedObjects( ) {
      return this.$store.getters.selectedObjects
    }
  },
  methods: {
    zoomExt( ) {
      if ( !this.selectedObjects )
        bus.$emit( 'r-zoom-ext' )
      else
        bus.$emit( 'r-zoom-to-object' )
    },

    zoomToObject( ) {
      bus.$emit( 'r-zoom-to-object' )
    },

    addReceiver( streamId ) {
      if ( !streamId || streamId === '' ) {
        this.snackbarMessage = 'Invalid streamId.'
        return this.showSnackbar = true
      }
      if ( this.$store.getters.receiverById( streamId ) ) {
        this.snackbarMessage = 'That stream is already loaded'
        return this.showSnackbar = true
      }
      let receiver = {
        serverUrl: this.$store.state.server,
        streamId: streamId,
        token: this.$store.getters.user.apitoken,
        objects: [ ],
        layers: [ ],
        children: [ ],
        parent: null,
        createdAt: null,
        updatedAt: null,
        baseProperties: {
          units: null
        },
        owner: {
          name: null,
          surname: null,
        },
        comments: null,
        name: 'Loading ' + streamId + '...'
      }
      this.$store.commit( 'ADD_RECEIVER', { receiver } )
    },

    saveSettings( settings ) {
      window.localStorage.setItem( 'viewerSettings', JSON.stringify( settings ) )
      this.$store.commit( 'SET_VIEWER_SETTINGS', { settings } )
    },

    snackbarUpdate( message ) {
      this.snackbarMessage = message
      this.showSnackbar = true
    },

    toggleObjectDetails( ) {
      if ( !this.selectedObjects ) {
        return this.snackbarUpdate( "No objects selected" )
      }
      this.snackbarUpdate( "You can drag the info panel around the screen" )
      this.showObjectDetails = true
    }
  },
  created( ) {
    if ( window.localStorage.getItem( 'viewerSettings' ) !== null ) {
      this.$store.commit( 'SET_VIEWER_SETTINGS', { settings: JSON.parse( window.localStorage.getItem( 'viewerSettings' ) ) } )
    }

    this.viewerSettings = this.$store.getters.viewerSettings

    bus.$on( 'login-flow-finalised', ( ) => {
      this.$store.state.initStreams.forEach( streamId => {
        this.addReceiver( streamId )
      } )
    } )
    bus.$on( 'snackbar-update', this.snackbarUpdate )
    bus.$on( 'stream-load-progress', message => {
      this.progressMessage = message
    } )
  },
  mounted( ) {}
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

.no-shadow {
  box-shadow: none !important;
}

.no-margin {
  margin: 0 !important;
}

.md-card.md-with-hover {
  cursor: default;
}

</style>
