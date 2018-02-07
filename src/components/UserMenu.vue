<template>
  <div>
    <login-screen v-if='showLogin' v-on:success='loggedIn'></login-screen>
    <div class="user-menu">
      <md-button class="md-icon-button" @click="toggleMenu" v-if="!menuVisible">
        <md-icon>person</md-icon>
      </md-button>
      <md-drawer :md-active.sync="menuVisible" md-persistent="full">
        <md-button class="md-icon-button" @click="toggleMenu" v-if="menuVisible">
          <md-icon>keyboard_arrow_left</md-icon>
        </md-button>
        <md-list>
          <md-list-item md-expand>
            <md-icon>person</md-icon>
            <span class="md-list-item-text">My Account</span>
            <md-list class='md-triple-line md-dense'slot='md-expand'>
              <md-list-item class='md-inset'>                
                <div class="md-list-item-text">
                  <span>{{user.name}} {{user.surname}}</span>
                  <span>{{user.email}}</span>
                  <p>{{user.createdAt}}</p>
                </div>
              </md-list-item>
            </md-list>
          </md-list-item>
          <md-list-item md-expand>
            <md-icon>import_export</md-icon>
            <span class="md-list-item-text">My Streams</span>
            <md-list class='md-double-line md-dense' slot='md-expand'>
              <md-list-item v-for='stream in streams':key='stream.id' class='md-inset'>
                <div class="md-list-item-text">
                  <span>{{stream.name}}</span>
                  <span>{{stream.streamId}}</span>
                </div>
              </md-list-item>
            </md-list>
          </md-list-item>
          <md-list-item md-expand>
            <md-icon>history</md-icon>
            <span class="md-list-item-text">Recent</span>
            <md-list slot='md-expand'>
              <md-list-item class='md-inset'>History placeholder</md-list-item>
            </md-list>
          </md-list-item>
        </md-list>
      </md-drawer>
    </div>
  </div>
</template>

<script>
import LoginScreen from './LoginScreen.vue'
export default {
  name: 'UserMenu',
  components: {
    LoginScreen
  },
  data() {
    return {
      showLogin: false,
      email: '',
      password: '',
      loginError: false,
      menuVisible: false,
      user: '',
      streams: ''
    }
  },
  methods: {
    getUser() {return this.$store.getters.user},
    toggleMenu() {
      if (this.getUser().user) {this.menuVisible = !this.menuVisible}
      else {this.showLogin = !this.showLogin}
    },
    loggedIn( args ) {
      if ( args.guest === false ) {
        this.showLogin = false
        var account = args.account
        account.guest = false
        var jwtToken = JSON.parse( localStorage.getItem( 'userJwtToken' ) )
        this.$store.commit( 'SET_JWT', { jwtToken } )
        this.$store.commit( 'SET_USER', { account } )
        this.$http.defaults.headers.common[ 'Autorization' ] = jwtToken
      } else if ( args.guest === true ) {
        let account = { apitoken: '', name: 'Anonymous', guest: true }
        this.$store.commit( 'SET_USER', { account } )
        this.showLogin = false
      }
    },
    getStreams(){
      var jwtToken = localStorage.getItem( 'userJwtToken' )
      this.$http.get(window.SpkAppConfig.serverUrl + '/accounts/streams',{
        headers: {
          Authorization: JSON.parse( jwtToken )
        }})
          .then( response => {
            this.streams = response.data.streams
          } )
    }
  },
  created () {
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
          this.loggedIn( args )
          this.user = this.getUser().user
          this.getStreams()
        } )
          .catch( err => {
            console.warn( err )
          } )
  }
}
</script>

<style scoped>
.user-menu {
}
.md-list-item-content>.md-icon:first-child {
  margin-right:8px;
}
.md-drawer {
  width:auto;
}
.login-error {
  color: #FF0000 !important;
}
</style>
