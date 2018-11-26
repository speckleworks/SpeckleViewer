<template>
  <div class="login-screen">
    <md-card class="login-card md-elevation-0">
      <md-card-content>
        <!-- <div style='text-align:center'><img :src='logoUrl' style="max-width:50px;"></div> -->
        <md-field>
          <label>Email address</label>
          <md-input v-model='email'></md-input>
        </md-field>
        <md-field>
          <label>Password</label>
          <md-input type='password' v-model='password'></md-input>
        </md-field>
        <md-button class='md-primary md-raised' @click.native='login'>Login</md-button>
        <md-button class='md-primary xxx-md-raised' @click.native='continueAsGuest'>Continue as guest</md-button>
        <div v-show='loginError' class='login-error'>
          <br>
          <md-icon>warning</md-icon>
          <br> Error logging in. Wrong password/email combo.
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>
<script>
export default {
  name: 'LoginScreen',
  computed: {
    logoUrl( ) { return window.SpkAppConfig.logoUrl },
    serverUrl( ) { return this.$store.state.server },
    isIOS( ) {
      return ( typeof window.orientation !== "undefined" ) && ( navigator.userAgent.indexOf( 'OS X' ) !== -1 )
    },
  },
  data( ) {
    return {
      email: '',
      password: '',
      loginError: false
    }
  },
  methods: {
    continueAsGuest( ) {
      this.$emit( 'success', { guest: true } )
    },
    login( ) {
      if ( this.email === '' ) return
      if ( this.password === '' ) return
      this.$http.post( this.$store.state.server + '/accounts/login', { email: this.email, password: this.password } )
        .then( response => {
          if ( response.data.success == false ) throw new Error( 'Failed to login.' )
          localStorage.setItem( 'token', response.data.resource.apitoken )
          return this.$http.get( this.$store.state.server + '/accounts', { headers: { 'Authorization': response.data.resource.apitoken } } )
        } )
        .then( response => {
          localStorage.setItem( 'userAccount', JSON.stringify( response.data.resource ) )
          let args = { guest: false }
          this.$emit( 'success', { guest: false, account: response.data.resource } )
        } )
        .catch( err => {
          this.loginError = true
        } )
    }
  }
}

</script>
<style scoped>
.login-card {
  pointer-events: auto;
}

.login-error {
  color: #FF0000 !important;
}

</style>
