<template>
<div>
  <md-button class='md-icon-button md-primary md-raised' @click.native='showNewReceiver=true' v-show='!showNewReceiver'>
    <md-icon>add</md-icon>
    <md-tooltip v-if="!isIOS" md-direction='right'>Add a new stream.</md-tooltip>
  </md-button>

  <md-card class='paddedcard' style="margin-bottom:20px;" v-show='showNewReceiver'>
    <md-card-content>
      <md-input-container>
        <label>Stream Id</label>
        <md-input v-model='streamId'></md-input>
      </md-input-container>
      <md-button class='md-dense md-primary md-raised' @click.native='createReceiver'>Add</md-button>
      <md-button class='md-dense md-warnxxx md-raisedxx' @click.native='showNewReceiver=false'>Cancel</md-button>
    </md-card-content>
  </md-card>
</div>
</template>
<script>
export default {
  name: 'NewReceiver',
  computed: {
    isIOS ( ) {
      return (typeof window.orientation !== "undefined") && (navigator.userAgent.indexOf('OS X') !== -1)
    },
  },
  data() {
    return {
      streamId: '',
      showNewReceiver: false
    } 
  },
  methods: {
    createReceiver () { 
      if( this.streamId === '' ) return alert( 'Please input a streamId.' )
      let receiver = { 
        streamId: this.streamId, 
        token: this.$store.getters.user.apitoken,
        serverUrl: this.$store.state.server
      }
      console.log(receiver)
      this.$store.commit( 'ADD_RECEIVER', { receiver } )
      this.showNewReceiver = false
      this.streamId = ''
    }
  }
}
</script>