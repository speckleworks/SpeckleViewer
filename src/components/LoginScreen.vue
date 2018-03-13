<template>
  <div class="login-screen">
    <md-card md-with-hover class="login-card">
      <md-card-content>
        <div style='text-align:center'><img :src='logoUrl' style="max-width:50px;"></div>
        <md-field>  
          <label>Email address</label>
          <md-input v-model='email'></md-input>
        </md-field>
        <md-field>  
          <label>Password</label>
          <md-input type='password' v-model='password'></md-input>
        </md-field>
        <md-button class='md-primary md-raised' @click.native='login'>Login</md-button>
        <div v-show='loginError' class='login-error'>
          <br>
          <md-icon>warning</md-icon> <br>
          Error logging in. Wrong password/email combo.
        </div>
        <br>
        <md-button class='md-accent md-raised' @click.native='guestLogin' v-if='allowGuestLogin'>
          Continue as guest
          <md-tooltip>You will not be allowed to comment or edit.</md-tooltip>
        </md-button>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
export default {
  name: 'LoginScreen',
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
.login-card{
  width: 400px;
  text-align: center;
  pointer-events: auto;
}
.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
  background-color: rgba(0,0,255,0.5)
}
.login-error {
  color: #FF0000 !important;
}
</style>
