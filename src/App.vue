<template>
  <div id="app">
    <div id='main' class="md-layout md-gutter">
      <div class='md-layout-item md-size-33'>
        <user-menu v-on:add="addReceiver" ></user-menu>
      </div>
      <div class='md-layout-item'>
        <search-bar :objects="searchObjects"></search-bar>
        <speckle-renderer></speckle-renderer>
      </div>
      <div class="md-layout-item md-size-33" >
        <speckle-stream-list> </speckle-stream-list>
      </div>
    </div>
    <div class='md-layout md-alignment-center-center'>
      <bottom-bar></bottom-bar>
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
import SearchBar from './components/SearchBar.vue'
export default {
  name: 'app',
  components: {
    SpeckleStreamList,
    UserMenu,
    LoginScreen,
    SpeckleViewer,
    SpeckleRenderer,
    BottomBar,
    SearchBar
  },
  data( ) {
    return {
      showSnackbar: false
    }
  },
  methods: {
    createReceivers( ) {
      if ( this.receiversCreated ) return
        let streamIds = window.location.href.split( '/' )[ window.location.href.split( '/' ).length - 1 ].split( ',' )
      streamIds[ 0 ] = streamIds[ 0 ].substr( 1 )

      // make sure we ignore 'dev'
      streamIds = streamIds.filter( ( obj, index, self ) => { return self.indexOf( obj ) === index && obj !== 'dev' } )

      console.log( 'streamIds:', streamIds )

      if ( streamIds.length == 0 || streamIds[ 0 ] === '' )
        return console.warn( 'no streams provided in url.' )

      let receivers = streamIds.map( id => {
        return {
          serverUrl: window.SpkAppConfig.serverUrl,
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
    },
    addReceiver(streamId){
      console.log('Adding a receiver', streamId)
      if( this.$store.getters.receiverById( streamId ) )
        return this.showSnackbar = true
      let receiver = {
        serverUrl: window.SpkAppConfig.serverUrl,
        streamId: streamId,
        token: this.$store.getters.user.apitoken,
        objects: [],
        layers: [],
        history: [],
        name: 'Loading ' + streamId + '...',
        layerMaterials: []
      }
      this.$store.commit( 'ADD_RECEIVER', { receiver } )
    },
  },

  created( ) {
    this.createReceivers( )
    this.$http.get( window.SpkAppConfig.serverUrl )
      .then( response => {
        var account = localStorage.getItem( 'userAccount' )
        var jwtToken = localStorage.getItem( 'userJwtToken' )
        if ( !jwtToken || jwtToken == '' )
          throw new Error( 'no login details found' )
        return this.$http.get( window.SpkAppConfig.serverUrl + '/accounts/profile', {
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
    },
    searchObjects() {
      //flesh this out to provide the list of objects we want to search
      let objectIds  = this.objects.map((object, index, objects) => {
        return object.streamId
      })
      return objectIds
    }
  }
}
</script>

<style>
.md-layout {
  padding:8px;
}
#app {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
#main {
  height: 90%
}
</style>
