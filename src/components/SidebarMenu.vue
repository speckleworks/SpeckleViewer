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
              <span>Logout</span>
            </md-menu-item>
            <md-menu-item>
              <a href="#">Admin</a>
            </md-menu-item>
          </md-menu-content>
        </md-menu>
      </md-card-header>
      <md-card-content style='background: white;'>
        <md-field class='md-dense md-raised' md-layout="box">
          <label>Search through your {{parentStreams.length}} streams.</label>
          <md-input v-model="searchFilter"></md-input>
          <md-icon>search</md-icon>
        </md-field>
        <md-list>
          <md-list-item v-for='stream in paginatedStreams' :key='stream.id' class='md-inset'>
            <div class="md-list-item-text">
              <span>{{stream.name}}</span>
              <span>{{stream.streamId}}</span>
            </div>
            <md-button class="md-icon-button md-list-action md-dense" v-on:click='addStream(stream.streamId)'>
              <md-icon>add</md-icon>
              <md-tooltip v-if="!isIOS" md-delay="800">Add this stream to the viewer</md-tooltip>
            </md-button>
          </md-list-item>
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
      user: { name: 'Not initialised' },
      streams: [ ],
      searchFilter: null,
      itemsPerPage: 10,
    }
  },
  methods: {
    logOut( ) {
      this.$store.commit( 'SET_USER', {} )
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
        this.getStreams( )

      } else if ( args.guest === true ) {
        let account = { apitoken: '', name: 'Anonymous', guest: true }
        this.$store.commit( 'SET_USER', { account } )
        this.showLogin = false
      }
    },
    getStreams( ) {
      var jwtToken = localStorage.getItem( 'token' )
      this.$http.get( this.$store.state.server + '/streams' )
        .then( response => {
          this.streams = response.data.resources.reverse( )
        } )
    },
    updateStreamList( ) {
      this.getStreams( )
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
    simpleStreams( ) {
      return this.streams.filter( stream => stream.isComputedResult == false ).map( stream => `${stream.name} \ ${stream.streamId}` )
    },
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
    },
    isIOS( ) {
      return ( typeof window.orientation !== "undefined" ) && ( navigator.userAgent.indexOf( 'OS X' ) !== -1 )
    },
  }
}

</script>
<style scoped>
.user-menu {}

.md-list-item-expand {
  border: 0 !important;
}

.md-list-item-content>.md-icon:first-child {
  margin-right: 8px;
}

.md-divider.md-inset {
  margin-left: 32px;
}

.md-drawer {
  width: auto;
}

.md-field {
  margin-bottom: 0px;
}

.login-error {
  color: #FF0000 !important;
}

</style>
