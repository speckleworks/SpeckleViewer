<template>
  <div id="app">
    <div id='main' class="md-layout md-gutter">
      <div class='md-layout-item md-size-10'>
        <user-menu></user-menu>
      </div>
      <div class='md-layout-item'>
        <speckle-renderer></speckle-renderer>
      </div>
      <div class="md-layout-item md-size-15" >
        <speckle-stream-list v-show='!isMobileView'></speckle-stream-list>
      </div>
    </div>
    <div class='md-layout md-gutter'>
      <div class='md-layout md-alignment-center-center'>
        <div class='md-layout-item md-size-5'>
          <bottom-bar></bottom-bar>
        </div>
      </div>
    </div>
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
  components: {
    SpeckleStreamList,
    UserMenu,
    LoginScreen,
    SpeckleViewer,
    SpeckleRenderer,
    BottomBar
  },
  data( ) {
    return {
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
    }
  },
  created( ) {
    this.createReceivers( )
  },
  computed: {
    isMobileView( ) {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test( navigator.userAgent ) && window.innerWidth < 768
    },
    receivers( ) {
      return this.$store.getters.allReceivers
    }
  }
}
</script>

<style>
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
