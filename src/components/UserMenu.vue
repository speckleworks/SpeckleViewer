<template>
  <div class="user-menu">
    <md-button class="md-icon-button" @click="toggleMenu" v-if="!menuVisible">
      <md-icon>person</md-icon>
    </md-button>
    <md-drawer :md-active.sync="menuVisible" md-persistent="full">
      <md-button class="md-icon-button" @click="toggleMenu" v-if="menuVisible">
        <md-icon>person</md-icon>
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
</template>

<script>
export default {
  name: 'UserMenu',
  computed: {
    logoUrl() { return window.SpkAppConfig.logoUrl },
    serverUrl() { return window.SpkAppConfig.serverUrl },
    allowGuestLogin() { return window.SpkAppConfig.allowGuestAccess }
  },
  data() {
    return {
      email: '',
      password: '',
      loginError: false,
            menuVisible: false
    }
  },
  methods: {
    login() {
      if( this.email === '' ) return
        if( this.password === '' ) return
          this.$http.post( window.SpkAppConfig.serverUrl + '/accounts/login' , { email: this.email, password: this.password })
            .then( response => {
              if( response.data.success == false ) throw new Error( 'Failed to login.' )
                localStorage.setItem( 'userJwtToken', JSON.stringify( response.data.token ) )
              return this.$http.get( window.SpkAppConfig.serverUrl + '/accounts/profile', { headers: { 'Authorization' : response.data.token } } )
            })
              .then( response => {
                localStorage.setItem( 'userAccount', JSON.stringify( response.data ) )
                let args = { guest: false }
                this.$emit( 'success', { guest: false, account: response.data } )
              })
                .catch( err => {
                  this.loginError = true
                })
    },
    guestLogin() {
      this.$emit( 'success', { guest: true } )
    },
        toggleMenu: function toggleMenu() {
          this.menuVisible = !this.menuVisible

        }
  },
  created() {

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
