
<template>
  <div id="app">
    <login-screen v-if='showLogin' v-on:success='loggedIn'></login-screen>
    <speckle-viewer v-if='!showLogin'></speckle-viewer>
  </div>
</template>

<script>

import LoginScreen      from './components/LoginScreen.vue'
import SpeckleViewer    from './components/SpeckleViewer.vue'

export default {
  name: 'app',
  components: {
    LoginScreen,
    SpeckleViewer
  },
  data () {
    return {
      showLogin: true
    }
  },
  methods: {
    loggedIn( args ) {
      if( args.guest === false ) {
        this.showLogin = false
        var account = JSON.parse( localStorage.getItem( 'userAccount' ) )
        account.guest = false
        var jwtToken = JSON.parse( localStorage.getItem( 'userJwtToken' ) )
        this.$store.commit( 'SET_JWT', { jwtToken } )
        this.$store.commit( 'SET_USER', { account } )
        this.$http.defaults.headers.common['Autorization'] = jwtToken
      } else if( args.guest === true ) {
        let account = { apitoken: '', name: 'Anonymous', guest: true }
        this.$store.commit( 'SET_USER', { account } )
        this.showLogin = false
      }
      this.createReceivers( ) 
    },
    createReceivers() {
      // let urlSecondPart = window.location.href.split( '?' )[ 1 ]
      let streamIds = window.location.href.split('/')[ window.location.href.split('/').length - 1 ].split(',')
      streamIds[ 0 ] = streamIds[ 0 ].substr( 1 )
      console.log( 'streamIds:', streamIds)
      

      streamIds = streamIds.filter( ( obj, index, self ) => { return self.indexOf( obj ) === index } )
      
      if( streamIds.length == 0 || streamIds[0] === '' )
        return console.warn('no streams provided in url.')
      
      let receivers = streamIds.map( id => {
        return {
          serverUrl: window.SpkAppConfig.serverUrl,
          streamId: id,
          token: this.$store.getters.user.apitoken,
          objects: [],
          layers: [],
          history: [],
          name: 'Loading ' + id + '...',
          layerMaterials: []
        }
      })

      this.$store.commit( 'ADD_RECEIVERS', { receivers } )
    }
  },
  created() {
    this.$http.get( window.SpkAppConfig.serverUrl )
    .then( response => {
      window.SpkAppConfig.serverDetails = response.data
    })
    .catch( err => {
      console.warn( err )
    })

    var account = localStorage.getItem('userAccount')
    var jwtToken = localStorage.getItem('userJwtToken')
    
    // 
    // TODO: check jwt for age and force login if expired
    // 
    if( account && jwtToken ) this.loggedIn( { guest: false } )
    else console.log( 'User needs to login.' )
  }
}
</script>

<style>
body {
  background-color: #E6E6E6;
}
#app {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #E6E6E6;
  /*background: -webkit-linear-gradient(to top, #666666, #808080);
  background: linear-gradient(to top, #666666, #808080);*/
}
</style>
