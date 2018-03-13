<template>
  <div id='color-picker' v-drag:dragable v-show='visible'>
    <div id="dragable">
      <md-button class="md-icon-button md-dense md-warn" v-if='isGuestUser' style='margin:0;' >
        <md-icon style='font-size:20px;'>warning</md-icon>
        <md-tooltip md-direction="bottom">You are not logged in, changes will not be saved.</md-tooltip>
      </md-button>
      <md-button class="md-icon-button md-dense" style='margin:0;' @click.native='visible = false'>
        <md-icon style='font-size:20px;'>close</md-icon>
        <md-tooltip md-direction="bottom">Close</md-tooltip>
      </md-button>
    </div>
    <div class="content">
      <div class="other-options">
        <div style='cursor:pointer; height: 30px; line-height: 30px;' @click='showExtra = !showExtra'>Extra options
        <md-icon>{{ showExtra ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}}</md-icon></div>
        <div v-show='showExtra'>
        <md-field style='margin-bottom: 10px !important'>
          <label>shininess</label>
          <md-input type="number" v-model='layerMaterial.shininess'></md-input>
        </md-field>
        <md-checkbox class='md-primary' style='margin-top: 5px;' v-model='layerMaterial.showEdges'><small>Edges</small></md-checkbox><md-checkbox class='md-primary' style='margin-top: 5px;' v-model='layerMaterial.wireframe'><small>Wireframe</small></md-checkbox>
        </div>
      </div>
      <color-picker v-model='layerMaterial.color'></color-picker>
    </div>
  </div>
</template>

<script>
import { Chrome, Compact }         from 'vue-color'
import * as THREE         from 'three'
import * as ML            from 'three.meshline'
import debounce           from 'debounce'

export default {
  name: '',
  components: {
    'color-picker': Chrome,
    'compact-picker': Compact
  },
  computed: {
    isGuestUser() {
      return this.$store.getters.user.guest
    },
    layerMaterial() {
      if( this.layerGuid != '' )
        return this.$store.getters.layerMaterial( this.streamId, this.layerGuid)
      return this.temp
    }
  },
  watch: {
    'layerMaterial.color': {
      handler( newValue ) {
        this.layerMaterial.color.hex = newValue.hex
        this.layerMaterial.color.a = newValue.a
        this.layerMaterial.threeMeshMaterial.color = new THREE.Color( newValue.hex )
        this.layerMaterial.threeLineMaterial.color = new THREE.Color( newValue.hex )
        this.layerMaterial.threePointMaterial.color = new THREE.Color( newValue.hex )
        this.layerMaterial.threeMeshMaterial.opacity = newValue.a
        this.layerMaterial.threeLineMaterial.opacity = newValue.a
        this.layerMaterial.threePointMaterial.opacity = newValue.a
      },
      deep: true
    },
    'layerMaterial.shininess': {
      handler( newValue ) {
        if( newValue < 0 ) newValue = 0
        if( newValue > 50 ) newValue = 50
        this.layerMaterial.threeMeshMaterial.shininess = newValue
        this.layerMaterial.threeMeshVertexColorsMaterial.shininess = newValue
      }
    },
    'layerMaterial.showEdges': {
      handler( newValue ) {
        this.layerMaterial.threeEdgesMaterial.visible = newValue
      }
    },
    'layerMaterial.wireframe': {
      handler( newValue ) {
        this.layerMaterial.threeMeshMaterial.wireframe = newValue
        this.layerMaterial.threeMeshVertexColorsMaterial.wireframe = newValue
      }
    },
    'visible': {
      handler( nval ) {
        if( !nval ) this.commitUpdates( )
      }
    }
  },
  data() {
    return {
      temp: {
        color: { hex: '#B3B3B3', a: 1 },
        smooth: true,
        shiny: 0,
        showEdges: true,
        wireframe: false
      },
      layerGuid:'',
      streamId: '',
      visible: false,
      showExtra: false
    }
  },
  methods: {
    commitUpdates () {
      console.log( 'updating db with colors and stuffs.' )
      if( this.$store.getters.user.guest === true ) return console.warn('User not logged in, will not commit updates.')
      this.$http.put( window.SpkAppConfig.serverUrl + '/streams/' + this.streamId + '/layers',
        { 
          layers: this.$store.getters.receiverById( this.streamId ).layers 
        },
        { 
          headers: { Authorization : this.$store.getters.authToken }
      })
      .then( response => { } )
      .catch( err => {
        console.warn('Failed to update stream cosmetics.')
        console.warn( err )
      })
    }
  },
  mounted () {
    bus.$on( 'show-color-picker', args => {
      this.visible = ! this.visible
      if( this.visible ) {
        this.layerGuid = args.layerGuid
        this.streamId = args.streamId
      }
    } )
  }
}
</script>

<style>
#dragable {
    position: relative;
    top: 0px;
    left: 0px;
    height: 30px;
    cursor: move;
    background-color: white;
    text-align: right;
    line-height: 30px;
}
#dragable span {
  /*width: 220px;*/
  line-height: 30px;
  cursor: pointer;
}
#color-picker{
  position: fixed;
  z-index: 100;
  left: 420px;
  top: 10px;
}
.other-options{
  border-top: 1px solid #E6E6E6;
  box-sizing: border-box;
  padding-left: 15px;
  padding-right: 15px;
}

.content {
  background-color: white;
}

</style>
