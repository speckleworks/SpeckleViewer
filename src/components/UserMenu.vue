<template>
  <div>
    <login-screen v-if='showLogin' v-on:success='loggedIn'></login-screen>
    <div class="user-menu" v-else>
      <md-toolbar class="md-primary" md-elevation="0">
        <span class="md-toolbar-section-end">
            <md-button class="md-icon-button" @click="$emit('closeme')">
              <md-icon>close</md-icon>
            </md-button>
          </span>
        <span class="md-title">Hello {{user.name}}!</span>
      </md-toolbar>
      <md-list>
        <md-list-item md-expand>
          <md-icon>person</md-icon>
          <span class="md-list-item-text">My Account</span>
          <md-list class='md-triple-line md-dense' slot='md-expand'>
            <md-list-item class='xxxmd-inset'>
              <div class="md-list-item-text">
                <span>{{user.name}} {{user.surname}}</span>
                <span>{{user.email}}</span>
                <p>{{user.createdAt}}</p>
              </div>
              <md-button class="md-icon-button md-list-action" @click='logOut'>
                <md-icon class="md-primary">close</md-icon>
              </md-button>
            </md-list-item>
          </md-list>
        </md-list-item>
        <md-list-item md-expand>
          <md-icon>import_export</md-icon>
          <span class="md-list-item-text">My Streams</span>
          <md-list class='md-double-line md-dense' slot='md-expand'>
            <md-list-item class='xxxmd-inset'>
              <md-field md-clearable>
                <md-icon>search</md-icon>
                <label>Search your streams</label>
                <md-input v-model='searchFilter'></md-input>
              </md-field>
            </md-list-item>
            <md-list-item>
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
            <!-- <md-divider class='xxxmd-inset'></md-divider> -->
            <md-list-item v-for='stream in paginatedStreams' :key='stream.id' class='xxxmd-inset'>
              <div class="md-list-item-text">
                <span>{{stream.name}}</span>
                <span>{{stream.streamId}}</span>
              </div>
              <md-button class="md-icon-button md-list-action md-dense" v-on:click='addStream(stream.streamId)'>
                <md-icon>add</md-icon>
                <md-tooltip md-delay="800">Add this stream to the viewer</md-tooltip>
              </md-button>
              <md-button class="md-icon-button md-list-action md-dense" v-on:click='shareStream(stream.streamId)'>
                <md-icon>share</md-icon>
                <md-tooltip md-delay="800">Copy stream address to clipboard</md-tooltip>
              </md-button>
            </md-list-item>
          </md-list>
        </md-list-item>
        <md-list-item md-expand>
          <md-icon>history</md-icon>
          <span class="md-list-item-text">Recent</span>
          <md-list slot='md-expand'>
            <md-list-item class='xxxmd-inset'>Soon™</md-list-item>
          </md-list>
        </md-list-item>
      </md-list>
      <!-- </md-drawer> -->
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
  data( ) {
    return {
      showLogin: false,
      email: null,
      password: null,
      loginError: false,
      menuVisible: false,
      user: { name: 'Not initialised'},
      streams: [ ],
      searchFilter: null,
      startIndex: 0,
      itemsPerPage: 5,
    }
  },
  methods: {
    getUser( ) { return this.$store.getters.user },
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
        console.log( args )
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
          console.log( response )
          this.streams = [ ...response.data.resources.reverse( ), ...response.data.resources.reverse( ), ...response.data.resources.reverse( ) ]
        } )
    },
    addStream( stream ) {
      this.$emit( 'add', stream )
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
    filteredStreams( ) {
      if ( this.searchFilter == null || this.searchFilter == '' )
        return this.streams
      else {
        //this.startIndex = 0
        return this.streams.filter( stream => stream.name.toLowerCase( ).includes( this.searchFilter.toLowerCase( ) ) || stream.streamId.toLowerCase( ).includes( this.searchFilter.toLowerCase( ) ) )
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
  }
}

</script>
<style scoped>
.user-menu {}

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
