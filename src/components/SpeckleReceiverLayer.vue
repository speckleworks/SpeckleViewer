<template>
  <md-card style="margin-bottom: 4px; padding: 10px; cursor: pointer;" class='md-elevation-0' md-with-hover @click.native='toggleLayer'>
    <div class='md-layout md-alignment-center-center' >
      <div class='md-layout-item md-size-70'>
        {{ spklayer.name }} <span class="md-caption">({{spklayer.objectCount}} objs)</span>
      </div>
      <div class="md-layout-item" style="text-align: right">
        <!-- <md-button class='md-dense md-icon-button md-primary' @click.native='toggleLayer'> -->
          <md-icon class='md-primary'>{{ visible ? "visibility" : "visibility_off" }}</md-icon>
        <!-- </md-button> -->
      </div>
    </div>
  </md-card>
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
      bus.$emit( 'r-toggle-layer', {
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
</style>
