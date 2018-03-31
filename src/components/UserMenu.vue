<template>
  <div>
    <login-screen v-if='showLogin' v-on:success='loggedIn'></login-screen>
    <div class="user-menu">
      <md-button class="md-icon-button md-primary md-raised" @click="toggleMenu" v-if="!menuVisible">
        <md-icon v-if='user'>person</md-icon>
        <md-icon v-else>person_outline</md-icon>
        <md-tooltip>Account</md-tooltip>
      </md-button>
      <md-drawer v-if='user' :md-active.sync="menuVisible" md-persistent="full">
        <md-toolbar class="md-transparent" md-elevation="0">
          <span class="md-toolbar-section-end">
            <md-button class="md-icon-button" @click="toggleMenu" v-if="menuVisible">
              <md-icon>keyboard_arrow_left</md-icon>
            </md-button>
          </span>
          <span class="md-title">Hello, {{user.name}}</span>
        </md-toolbar>
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
              <md-list-item class='md-inset'>
                <md-field md-clearable>
                  <label>Filter</label>
                  <md-input v-model='searchFilter'></md-input>
                </md-field>
              </md-list-item>
              <md-list-item class='md-inset'>
                <!-- <div class="md-layout md-alignment-center-center"> -->
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
                <!-- </div> -->
                <div class="md-layout-item md-size-100 md-small-size-100 md-text-center"> 
                  <div class="md-caption">Showing {{startIndex + 1}} - {{startIndex + itemsPerPage}} out of <strong> {{filteredStreams.length}} </strong> </div>
                </div>          
              </md-list-item>
              <md-divider class='md-inset'></md-divider>
              <md-list-item v-for='stream in paginatedStreams':key='stream.id' class='md-inset'>
                <div class="md-list-item-text">
                  <span>{{stream.name}}</span>
                  <span>{{stream.streamId}}</span>
                </div>
                <md-button class="md-icon-button md-list-action md-dense" v-on:click='addStream(stream.streamId)'>
                  <md-icon>add</md-icon>
                  <md-tooltip  md-delay="800">Add this stream to the viewer</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-list-action md-dense" v-on:click='shareStream(stream.streamId)'>
                  <md-icon>share</md-icon>
                  <md-tooltip  md-delay="800">Copy stream address to clipboard</md-tooltip>
                </md-button>
              </md-list-item>
            </md-list>
          </md-list-item>
          <md-list-item md-expand>
            <md-icon>history</md-icon>
            <span class="md-list-item-text">Recent</span>
            <md-list slot='md-expand'>
              <md-list-item class='md-inset'>Soon™</md-list-item>
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
      email: null,
      password: null,
      loginError: false,
      menuVisible: false,
      user: null,
      streams: null,
      searchFilter: null,
      startIndex: 0,
      itemsPerPage: 5,
    }
  },
  methods: {
    getUser() {return this.$store.getters.user},
    toggleMenu() {
      if (this.user) {
        this.menuVisible = !this.menuVisible}
      else {this.showLogin = !this.showLogin}
    },
    logOut(){
      this.$store.commit( 'SET_USER', {})
      localStorage.setItem( 'userAccount', null)
      localStorage.setItem( 'userJwtToken', null)
      this.user = null
      this.menuVisible = false
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
        this.user = this.getUser().user
        this.getStreams()
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
    },
    addStream(stream){
      this.$emit('add', stream)
    },
    shareStream(streamId){
      this.$clipboard(window.location.origin + '/?' + streamId)
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
      this.getStreams()
  },
  computed: {
    filteredStreams(  ) {
      if ( this.searchFilter == null || this.searchFilter == ''  )
        return this.streams
      else {
        //this.startIndex = 0
        return this.streams.filter( stream => stream.name.toLowerCase(  ).includes( this.searchFilter.toLowerCase(  )  ) || stream.streamId.toLowerCase(  ).includes( this.searchFilter.toLowerCase(  )  )  )
      }
    },
    paginatedStreams(  ) {
      return this.filteredStreams
        .slice( this.startIndex, this.startIndex + this.itemsPerPage  )
    },
    pageCount(  ) {
      return parseInt( this.filteredStreams.length / this.itemsPerPage  ) + 1
    },
    currentPage(  ) {
      if ( this.startIndex == 0  ) return 1
        return this.startIndex / this.itemsPerPage + 1
    },
  }
}
</script>

<style scoped>
.user-menu {
}
.md-list-item-content>.md-icon:first-child {
  margin-right:8px;
}
.md-divider.md-inset {
  margin-left:32px;
}
.md-drawer {
  width:auto;
}
.md-field {

  margin-bottom: 0px;
}
.login-error {
  color: #FF0000 !important;
}
</style>
