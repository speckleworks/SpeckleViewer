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
          <md-list-item>
            <md-icon>import_export</md-icon>
            <span class="md-list-item-text">My Streams</span>
          </md-list-item>
          <md-list-item>
            <md-icon>history</md-icon>
            <span class="md-list-item-text">Recent</span>
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
      menuVisible: false
    }
  },
  methods: {
    user() {return this.$store.getters.user},
    toggleMenu() {
      console.log(this.user())
      if (this.user().user) {this.menuVisible = !this.menuVisible}
      else {this.showLogin = !this.showLogin}
    },
    loggedIn( args ) {
      console.log( args )
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
