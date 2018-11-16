<template>
  <div class='spk-layer'>
    <div class='layer-details'>
      <span class="layer-name md-caption">
      {{ spklayer.name }} ({{spklayer.objectCount}} objs)
    </span>
      <span class="layer-buttons">
      <md-icon @click.native='toggleLayer'>{{ visible ? "visibility" : "visibility_off" }}</md-icon>
    </span>
    </div>
  </div>
</template>
<script>
import SpeckleReceiverObject from './SpeckleReceiverObject.vue'

export default {
  name: 'SpkReceiverLayer',
  props: {
    spklayer: { type: Object },
    streamid: { type: String },
  },
  components: {
    SpeckleReceiverObject
  },
  data( ) {
    return {
      visible: true,
      objectsExpanded: false,
    }
  },
  computed: {
    layerMaterial( ) {
      return this.spklayer.properties
    },
    colorStyle( ) {
      if ( this.layerMaterial )
        return 'color:' + this.spklayer.properties.color.hex
      return 'color:gray'
    },
    showPicker( ) {
      return this.showColorPicker
    },
    objects( ) {
      return this.$store.getters.objectsByLayer( this.spklayer.guid )
    }
  },
  watch: {
    layerName( ) {
      return this.spklayer.name
    },
    objectCount( ) {
      console.log( this.spklayer )
      return this.spklayer.objectCount
    },
  },
  methods: {
    showColorPicker( ) {
      bus.$emit( 'show-color-picker', { layerGuid: this.spklayer.guid, streamId: this.streamid } )
    },
    toggleLayer( ) {
      this.visible = !this.visible
      bus.$emit( 'toggle-layer', {
        layerGuid: this.spklayer.guid,
        state: this.visible
      } )
    },
    toggleObjects( ) {
      this.objectsExpanded = !this.objectsExpanded
    }
  },
  mounted( ) {}
}

</script>
<style scoped>
/*
.spk-layer{
  border-bottom: 1px solid #E6E6E6;
  position: relative;
}
.spk-layer:last-of-type{
  border-bottom: 0;
}
.layer-details {
  position: relative;
  display: inline-block;
  font-size: 12px;
}
.layer-name {
  float: left;
  display: inline-block;
  width: 70%;
  overflow: hidden;
}
.layer-buttons {
  text-align: right;
  float: left;
  display: inline-block;
  width: 30%;
  box-sizing: border-box;
  color: #666666;
}

.layer-buttons .md-icon {
  cursor: pointer;
}
*/

</style>
