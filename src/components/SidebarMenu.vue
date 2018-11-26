<template>
  <div>
    <!-- User Login card -->
    <md-card style='margin-bottom:20px;' md-with-hover v-if='showLogin'>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">Login</div>
          <div class="md-caption">{{$store.state.server}}</div>
        </md-card-header-text>
      </md-card-header>
      <login-screen v-on:success='loggedIn'></login-screen>
    </md-card>
    <!-- Account card -->
    <md-card v-if='!showLogin' class='md-elevation-0' md-with-hover>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">Hello, {{user.name}}!</div>
          <div class="md-caption">{{$store.state.server}}</div>
        </md-card-header-text>
        <md-menu xxx-md-size="dense" md-direction="bottom-end">
          <md-button class="md-icon-button" md-menu-trigger>
            <md-icon>more_vert</md-icon>
          </md-button>
          <md-menu-content>
            <md-menu-item @click='logOut'>
              <span>{{isGuest ? "Login" : "Logout"}}</span>
            </md-menu-item>
            <md-menu-item v-if='!isGuest'>
              <a :href="linkToAdmin" target="_blank">Admin</a>
            </md-menu-item>
          </md-menu-content>
        </md-menu>
      </md-card-header>
      <md-card-content style='background: white;' v-if='!isGuest'>
        <div class='md-layout md-alignment-center-left'>
          <md-button class='md-layout-item md-size-10 md-icon-button md-dense md-primary no-margin' @click.native='getStreams'>
            <md-icon>refresh</md-icon>
          </md-button>
          <md-field class='md-layout-item md-dense md-raised' md-layout="box">
            <label>Search through your {{parentStreams.length}} streams.</label>
            <md-input v-model="searchFilter"></md-input>
            <md-icon>search</md-icon>
          </md-field>
        </div>
        <md-list>
          <div v-for='stream in paginatedStreams' :key='stream.id' class='md-inset'>
            <div class="md-layout md-alignment-center-left" style="margin-bottom:10px;">
              <div class="md-layout-item md-size-70">
                <span>{{stream.name}}</span>
                <span class='md-caption'>{{stream.streamId}}</span>
              </div>
              <div class="md-layout-item md-size-30" style='text-align: right'>
                <md-button class="md-icon-button xxxmd-dense md-raised" v-on:click='$emit("addreceiver", stream.streamId)'>
                  <md-icon>add</md-icon>
                </md-button>
              </div>
            </div>
          </div>
        </md-list>
      </md-card-content>
    </md-card>
    <br>
    <!-- Receiver Cards -->
    <speckle-receiver v-for='receiver in $store.state.receivers' :key='receiver.streamId' :spkreceiver='receiver'></speckle-receiver>
    <span v-show='$store.state.receivers.length === 0' class='md-caption' style="padding: 10px">No streams loaded.</span>
  </div>
</template>
<script>
import LoginScreen from './LoginScreen.vue'
import SpeckleReceiver from './SpeckleReceiverCard.vue'

export default {
  name: 'UserMenu',
  components: {
    LoginScreen,
    SpeckleReceiver
  },
  computed: {
    receivers( ) {
      return this.$store.getters.allReceivers
    }
  },
  data( ) {
    return {
      showLogin: false,
      isGuest: true,
      user: { name: 'Anonymous 🐸 ' },
      streams: [ ],
      searchFilter: null,
      itemsPerPage: 10,
      linkToAdmin: this.$store.state.server.replace( '/api/v1', '/admin' )
    }
  },
  methods: {
    logOut( ) {
      let account = { apitoken: '', name: 'Anonymous', guest: true }
      this.$store.commit( 'SET_USER', account )
      window.localStorage.setItem( 'userAccount', null )
      window.localStorage.setItem( 'token', null )
      this.user = null
      this.showLogin = true
      this.$http.defaults.headers.common[ 'Authorization' ] = ''
    },
    loggedIn( args ) {
      if ( args.guest === false ) {
        this.showLogin = false
        var account = args.account
        account.guest = false
        var jwtToken = args.account.apitoken
        this.$store.commit( 'SET_JWT', { jwtToken } )
        this.$store.commit( 'SET_USER', { account } )
        this.$http.defaults.headers.common[ 'Authorization' ] = jwtToken
        this.user = args.account
        this.isGuest = false
        this.getStreams( )
      } else if ( args.guest === true ) {
        console.log('asdf')
        let account = { apitoken: '', name: 'Anonymous', guest: true }
        this.$store.commit( 'SET_USER', { account } )
        this.showLogin = false
        this.isGuest = true
      }
      bus.$emit( 'login-flow-finalised' )
    },
    getStreams( ) {
      var jwtToken = localStorage.getItem( 'token' )
      this.$http.get( this.$store.state.server + '/streams' )
        .then( response => {
          this.streams = response.data.resources.reverse( )
        } )
    }
  },
  created( ) {
    this.$http.get( this.$store.state.server )
      .then( response => {
        var account = localStorage.getItem( 'userAccount' )
        var jwtToken = localStorage.getItem( 'token' )
        if ( !jwtToken || jwtToken == '' )
          throw new Error( 'no login details found' )
        return this.$http.get( this.$store.state.server + '/accounts', {
          headers: {
            Authorization: jwtToken
          }
        } )
      } )
      .then( response => {
        if ( response.status != 200 ) throw new Error( response )
        let args = {
          guest: false,
          account: response.data.resource
        }
        window.localStorage.setItem( 'userAccount', JSON.stringify( response.data.resource ) )
        this.loggedIn( args )
        this.getStreams( )
      } )
      .catch( err => {
        this.showLogin = true
        console.warn( err )
      } )
  },
  computed: {
    parentStreams( ) {
      return this.streams.filter( stream => stream.isComputedResult == false && stream.parent == null )
    },
    filteredStreams( ) {
      if ( this.searchFilter == null || this.searchFilter == '' )
        return [ ]
      else {
        return this.parentStreams.filter( stream => stream.name.toLowerCase( ).includes( this.searchFilter.toLowerCase( ) ) || stream.streamId.toLowerCase( ).includes( this.searchFilter.toLowerCase( ) ) )
      }
    },
    paginatedStreams( ) {
      return this.filteredStreams.slice( 0, this.itemsPerPage )
    }
  }
}

</script>
<style scoped>
</style>
