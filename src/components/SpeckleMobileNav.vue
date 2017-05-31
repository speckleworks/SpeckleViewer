<template>
  <div id='mobile-nav'>
    <md-bottom-bar md-shiftxxx id='buttons'>
      <!-- <md-bottom-bar-item :md-icon="currentView==='3d' ? '3d_rotation' : 'close'" md-active  @click.native='currentView="3d"'></md-bottom-bar-item> -->
      <md-bottom-bar-item :md-icon="currentView==='layers' ? 'close' : 'layers'" @click.native='currentView = currentView === "layers" ? "3d" : "layers"'></md-bottom-bar-item>
      <md-bottom-bar-item :md-icon="currentView==='comments' ? 'close' : 'chat_bubble'" @click.native='currentView = currentView === "comments" ? "3d" : "comments"'></md-bottom-bar-item>
      <md-bottom-bar-item md-icon="zoom_out_map" @click.native='' style='color: #FF0000 !important'></md-bottom-bar-item>
      <md-bottom-bar-item :md-icon="currentView==='more_vert' ? 'close' : 'more_vert'" @click.native='currentView = currentView === "settings" ? "3d" : "settings"'></md-bottom-bar-item>

    </md-bottom-bar>
   <transition name="fade">
    <md-whiteframe id='mobile-elements' v-show='currentView!="3d"'>
      <div v-show='currentView === "comments"'>
        <md-button class="md-icon-button md-primary md-raised new-comment-button">
          <md-icon>edit</md-icon>
        </md-button>
        <div class="md-caption">Comments/Saved Views:</div>
        <div v-for='comment in comments' class='comment' @click='setView(comment.camera)'>
          <strong><span class='comment-author'>{{comment.author.name == user.name ? 'You :' : comment.author.name + ' said:'}}</span></strong>
          <span class='comment-text'>{{comment.text}}</span>
        </div>
      </div>
      <div v-show='currentView === "layers"'>
        <div v-for='receiver in receivers' class='layer-group'>
         <div class='comment'><span><strong>{{receiver.name}}</strong> <code>{{receiver.streamId}}</code></span></div>
         <speckle-receiver-layer v-for='layer in receiver.layers' :key='layer.guid' :spklayer='layer' :streamid='receiver.streamId'></speckle-receiver-layer>
        </div>
      </div>
      <div v-show='currentView === "settings"'>
        <div class="md-caption">Help</div>
        <p><md-icon style='font-size:12px; color: #3F3F3F;'>pan_tool</md-icon> <strong>Pan:</strong> Three finger drag.</p>
        <p><md-icon style='font-size:12px; color: #3F3F3F;'>3d_rotation</md-icon> <strong>Rotate:</strong> One finger drag.</p>
        <p><md-icon style='font-size:12px; color: #3F3F3F;'>zoom_in</md-icon> <strong>Zoom:</strong> Pinch in and out with two fingers.</p>
        <div class="md-caption">Experimental</div>
        <br>
        <div md-class='md-warn' @click='toggleDo'>Enable/Disable DO</div>
        <br>
      </div>
    </md-whiteframe>
    </transition>
  </div>
</template>

<script>
import SpeckleReceiverLayer       from './SpeckleMobileLayer.vue'


export default {
  name: 'SpeckleMobileNav',
  components: {
    SpeckleReceiverLayer
  },
  computed: {
    layersButtonIcon() {
      if( this.currentView === 'layers') return 'close'
      else return 'layers'
    },
    user() {
      return this.$store.getters.user
    },
    receivers() {
      return this.$store.getters.allReceivers
    },
    layers() {
      return 'lol'
    },
    comments() {
      return this.$store.getters.allComments
    }
  },
  data() {
    return {
      currentView: '3d',
    }
  },
  methods: {
    setView( where ) {
      bus.$emit( 'renderer-setview', where )
    },
    toggleDo( ) {
      bus.$emit('renderer-toggle-do')
    }
  }
}
</script>

<style scoped>
  #mobile-nav {
    position: fixed;
    bottom: 0;
    width: 100%;
  }
  #buttons {
    z-index: 2;
  }
  #mobile-elements { 
    position: fixed;
    bottom: 50px;
    height: 35%;
    background-color: white;
    width: 100%;
    z-index: 1;
    overflow-y: auto;
    box-sizing: border-box;
    padding: 20px 10px 20px 10px;
  }

  .new-comment-button {
    position: fixed;
    bottom: 42%;
    right: 10px;
    z-index: 100;
  }
  .comment {
    position: relative;
    margin-top: 10px;
    width: 90%;
    left: 3%;
    box-sizing: border-box;
    padding: 5px 20px;
    background-color: #E6E6E6;
    border-radius: 30px;
    font-size: 12px;
    transition: all .3s ease;
    cursor: pointer;
  }

  .comment:hover{
    background-color: #B3B3B3;
  } 

  .layer-group {
    position: relative;
    margin-top: 10px;
    width: 90%;
    left: 3%;
    box-sizing: border-box;
    border-radius: 10px;
    font-size: 12px;
    transition: all .3s ease;
    cursor: pointer;
  }
  .fade-enter-active, .fade-leave-active {
    transition: all .3s
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
    opacity: 0
  }
</style>