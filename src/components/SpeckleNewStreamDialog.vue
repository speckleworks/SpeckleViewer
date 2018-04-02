<template>
  <div class='new-stream'>
    <md-content md-elevation="19" class="login-card">
        <md-field style='margin:0;text-align:center;'>
          <label>Stream Id</label>
          <md-textarea v-model='streamId'></md-textarea>
        </md-field>
        <br>
        <md-button class='md-icon-button md-primary' @click.native='closeMe'>
        <md-icon>close</md-icon></md-button>
        <md-button class='md-icon-button md-primary md-raised' @click.native='makeStream'>
        <md-icon>done</md-icon></md-button>
    </md-content>
  </div>
</template>

<script>
export default {
  name: 'NewStreamDialog',
  computed: {
  },
  data() {
    return {
      streamId:''
    }
  },
  methods: {
    closeMe() {
      this.streamId = ''
      this.$emit( 'close' )
    },
    makeStream() {
      if( this.$store.getters.receiverById( this.streamId ) )
        return alert( 'This stream is already there.' )
      let receiver = {
        serverUrl: this.$store.state.server,
        streamId: this.streamId,
        token: this.$store.getters.user.apitoken,
        objects: [],
        layers: [],
        history: [],
        name: 'Loading ' + this.streamId + '...',
        layerMaterials: []
      }
      this.$store.commit( 'ADD_RECEIVER', { receiver } )
      this.streamId = ''
      this.$emit( 'close' )
    }
  }
}
</script>

<style scoped>
.login-card{
//  width: 200px;
  height: 200px;
  text-align: center;
  pointer-events: auto;
  background: white;
  padding: 30px;
  border-radius: 10px;
}
.new-stream{
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background-color: rgba(255,255,255,0.31)
}
</style>
