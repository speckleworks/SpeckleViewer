<template>
  <div class="user-menu">
    This is the user menu
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
      loginError: false
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
    }
  },
  created() {

  }
}
</script>

<style scoped>
.user-menu {
}
.login-error {
  color: #FF0000 !important;
}
</style>
