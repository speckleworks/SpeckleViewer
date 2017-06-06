<template>
  <div class='spk-layer' @click='toggleLayer'>
    <!-- <span class="layer-name"> -->
      {{ spklayer.name }} ({{spklayer.objectCount}} objs)
    <!-- </span> -->
    <span class="layer-buttons"> 
      <md-icon>{{ visible ? "visibility" : "visibility_off" }}</md-icon>
    </span>
  </div>
</template>

<script>
export default {
  name: 'SpeckleMobileLayer',
  props: { 
    spklayer: { type: Object },
    streamid: { type: String },
  },
  components: {
  },
  computed: {
    layerMaterial() {
      return this.$store.getters.layerMaterial( this.streamid, this.spklayer.guid )
    },
    colorStyle() {
      if( this.layerMaterial )
        return 'color:' + this.layerMaterial.color.hex
      return 'color:gray'
    },
    showPicker() {
      return this.showColorPicker
    }
  },
  data() {
    return {
      visible: true
    }
  },
  methods: {
    showColorPicker() {
      bus.$emit( 'show-color-picker', { layerGuid: this.spklayer.guid, streamId: this.streamid } )
    },
    toggleLayer() {
      this.visible = ! this.visible
      this.layerMaterial.threeMeshMaterial.visible = this.visible
      this.layerMaterial.threeMeshVertexColorsMaterial.visible = this.visible
      this.layerMaterial.threeLineMaterial.visible = this.visible
      this.layerMaterial.threeEdgesMaterial.visible = this.layerMaterial.showEdges ? this.visible : this.layerMaterial.threeEdgesMaterial.visible
      this.layerMaterial.threePointMaterial.visible = this.visible
    }
  }, 
  mounted() {
  }
}
</script>

<style scoped>

.spk-layer{
  position: relative;
  margin-top: 10px;
  width: 90%;
  left: 3%;
  box-sizing: border-box;
  padding: 5px 20px;
  background-color: #F3F3F3;
  border-radius: 30px;
  font-size: 12px;
  transition: all .3s ease;
  cursor: pointer;
}
.spk-layer:hover{
  /*background-color: #B3B3B3;*/
}

.layer-buttons {
  float: left;
  margin-right: 10px;
}

.layer-buttons .md-icon {
  cursor: pointer;
}

</style>