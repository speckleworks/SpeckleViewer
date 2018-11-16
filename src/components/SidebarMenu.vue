<template>
  <div>
    <!--     <md-toolbar class="md-primary">
      <span class="md-toolbar-section-end">
        <md-button class="md-icon-button" @click="showAccountsStuff=!showAccountsStuff">
          <md-icon>{{showAccountsStuff ? "keyboard_arrow_up" : "keyboard_arrow_down"}}</md-icon>
        </md-button>
      </span>
      <span class="md-title" v-if='showLogin'>Login</span>
      <span class="md-title" v-else>Hello <strong>{{user.name}}!</strong></span>
    </md-toolbar> -->
    <!--     <div class="user-menu" v-if='!showLogin && showAccountsStuff'>
      <md-list> -->
    <!--         <md-list-item md-expand>
          <md-icon>person</md-icon>
          <span class="md-list-item-text">My Account</span>
          <md-list class='md-triple-line md-dense' slot='md-expand'>
            <md-list-item class='md-inset'>
              <div class="md-list-item-text">
                <span>{{user.name}} {{user.surname}}</span>
                <span>{{user.email}}</span>
                <p>{{user.createdAt}}</p>
              </div>
              <md-button class="md-raised md-icon-button md-list-action" @click='logOut'>
                <md-icon class="md-primary">close</md-icon>
              </md-button>
            </md-list-item>
          </md-list>
        </md-list-item> -->
    <!--         <md-list-item md-expand>
          <md-icon>import_export</md-icon>
          <span class="md-list-item-text">My Streams</span>
          <md-list class='md-double-line md-dense' slot='md-expand' :md-expand-single="true">
            <md-list-item>
              <md-field md-clearable>
                <md-icon>search</md-icon>
                <label>Filter your streams</label>
                <md-input v-model='searchFilter' @focus="showStreamList = true" @blur="showStreamList = false"></md-input>
              </md-field>
            </md-list-item>
            <md-list-item>
              <md-button class="md-icon-button md-dense" @click="updateStreamList">
                <md-icon>refresh</md-icon>
                <md-tooltip v-if="!isIOS" md-delay="500">Refresh stream list</md-tooltip>
              </md-button>
              <div class="md-layout-item">
                <md-button :disabled='startIndex==0' class='md-dense md-icon-button md-primary' @click='startIndex -= startIndex != 0 ? itemsPerPage : 0'>
                  <md-icon>chevron_left</md-icon>
                </md-button>
              </div>
              <div class="md-layout-item md-text-center">
                <div class='md-caption'>{{currentPage}} / {{pageCount}}</div>
              </div>
              <div class="md-layout-item">
                <md-button :disabled='currentPage == pageCount' class='md-dense md-icon-button md-primary' @click='startIndex += currentPage == pageCount ? 0 : itemsPerPage '>
                  <md-icon>chevron_right</md-icon>
                </md-button>
              </div>
              <div class="md-caption">Showing {{startIndex + 1}} - {{startIndex + itemsPerPage}} out of <strong> {{filteredStreams.length}} </strong> </div>
            </md-list-item>
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
        </md-list-item> -->
    <!--       </md-list>
    </div> -->
    <!--     <md-toolbar class="md-accent md-elevation-4" md-elevation="0">
      <span class="md-toolbar-section-end">
        <md-button class="md-icon-button" @click="showCurrentStreamStuff=!showCurrentStreamStuff">
          <md-icon>{{showCurrentStreamStuff ? "keyboard_arrow_up" : "keyboard_arrow_down"}}</md-icon>
        </md-button>
      </span>
      <span class="md-title">Current <strong>Streams</strong></span>
    </md-toolbar> -->
    <md-card style='margin-bottom:20px;' md-with-hover v-if='showLogin'>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">Login</div>
          <div class="md-caption">{{$store.state.server}}</div>
        </md-card-header-text>
      </md-card-header>
      <login-screen  v-on:success='loggedIn'></login-screen>
    </md-card>
    <md-card v-if='!showLogin' class='md-elevation-0' md-with-hover>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">Hello, {{user.name}}!</div>
          <div class="md-caption">{{user.email}} | {{$store.state.server}}</div>
          <!-- <div class="md-caption">{{$store.state.server}}</div> -->
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
    <speckle-receiver v-on:drop="dropReceiver" v-for='receiver in $store.state.receivers' :key='receiver.streamId' :spkreceiver='receiver'></speckle-receiver>
    <span v-show='$store.state.receivers.length === 0 && showCurrentStreamStuff' class='md-caption' style="padding: 10px">No streams loaded.</span>
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
      showAccountsStuff: true,
      showCurrentStreamStuff: true,
      email: null,
      password: null,
      loginError: false,
      menuVisible: false,
      user: { name: 'Not initialised' },
      streams: [ ],
      searchFilter: null,
      startIndex: 0,
      itemsPerPage: 5,
      streamAddition: null,
      showStreamList: false,
      selectedStream: null
    }
  },
  methods: {
    getUser( ) { return this.$store.getters.user },
    toggleShowNewStream( ) {},
    toggleMenu( ) {
      if ( this.user ) {
        this.menuVisible = !this.menuVisible
      } else { this.showLogin = !this.showLogin }
    },
    logOut( ) {
      this.$store.commit( 'SET_USER', {} )
      window.localStorage.setItem( 'userAccount', null )
      window.localStorage.setItem( 'token', null )
      this.user = null
      this.menuVisible = false
      this.showLogin = true
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
        this.menuVisible = true
      } else if ( args.guest === true ) {
        let account = { apitoken: '', name: 'Anonymous', guest: true }
        this.$store.commit( 'SET_USER', { account } )
        this.showLogin = false
      }
    },
    getStreams( ) {
      var jwtToken = localStorage.getItem( 'token' )
      this.$http.get( this.$store.state.server + '/streams', {
          headers: {
            Authorization: jwtToken
          }
        } )
        .then( response => {
          this.streams = response.data.resources.reverse( )
        } )
    },
    updateStreamList( ) {
      this.getStreams( )
    },
    addStream( stream ) {
      this.$emit( 'add', stream )
    },
    dropReceiver( streamId ) {
      console.log( 'Dropping receiver:', streamId )
      this.$store.commit( 'DROP_RECEIVER', { streamId } )
      bus.$emit( 'renderer-drop-stream', streamId )
      bus.$emit( 'renderer-update' )
    },
    shareStream( streamId ) {
      this.$clipboard( window.location.origin + '/?' + streamId )
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
      return this.streams.filter( stream => stream.isComputedResult == false && stream.parent == null)
    },
    filteredStreams( ) {
      if ( this.searchFilter == null || this.searchFilter == '' )
        return [ ]
      else {
        //this.startIndex = 0
        return this.parentStreams.filter( stream => stream.name.toLowerCase( ).includes( this.searchFilter.toLowerCase( ) ) || stream.streamId.toLowerCase( ).includes( this.searchFilter.toLowerCase( ) ) )
      }
    },
    paginatedStreams( ) {
      return this.filteredStreams
        .slice( this.startIndex, this.startIndex + this.itemsPerPage )
    },
    pageCount( ) {
      return parseInt( this.filteredStreams.length / this.itemsPerPage ) + 1
    },
    currentPage( ) {
      if ( this.startIndex == 0 ) return 1
      return this.startIndex / this.itemsPerPage + 1
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
