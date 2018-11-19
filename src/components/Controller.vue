<template>
  <div class='speckle-input'>
    <div class='controller-wrapper'>
      <div class='md-subheading-xxx'>{{trimmedName}}: <strong>{{controller.value}}</strong></div>
      <!-- <div class='md-layout md-alignment-center-left'>
        <div class='md-layout-item md-size-5 md-caption'>{{min}}</div>
        <div class='md-layout-item slider-wrapper md-caption'><input type="range" :min="min" :max="max" step='0.01' class='slider' v-model.number="controller.value"></div>
        <div class='md-layout-item md-size-10 md-caption'>{{max}}</div>
      </div> -->
      <vue-slider ref='slider' :interval='controller.step' :dot-size='24' :min="controller.min" :max="controller.max" :value='controller.value' tooltip='hover' lazy v-on:callback='changed' :disabled='!enabled'></vue-slider>
    </div>
  </div>
</template>
<script>
import VueSlider from 'vue-slider-component'

export default {
  name: 'Controller',
  props: [ 'controller', 'enabled' ],
  components: {
    VueSlider
  },
  computed: {
    trimmedName: function( ) {
      return this.controller.name.slice( 7 )
    },
  },
  data( ) {
    return {
      min: this.controller.min,
      max: this.controller.max
    }
  },
  methods: {
    changed( val ) {
      this.controller.value = val
      this.$emit( 'changed' )
    }
  },
  mounted( ) {

  }
}

</script>
<style scoped>
.speckle-input {
  width: 100%
}

.slider-wrapper {
  padding-left: 5px;
  padding-right: 5px;
}

.slider {
  width: 100%
}

.controller-wrapper {
  padding-top: 5px;
  padding-bottom: 5px;
}

</style>
