<template>
  <div class='speckle-input md-layout md-alignment-center-left'>
    <!-- <vue-slider ref='slider' :interval='0.01' :dot-size='24' :width='200' :min="min" :max="max" v-model='controller.value'></vue-slider> -->
    <div class='md-layout-item md-size-5'>{{trimmedName}}</div>
    <div class='md-layout-item slider-wrapper'><input type="range" :min="min" :max="max" step='0.01' class='slider' v-model.number="controller.value"></div>
    <div class='md-layout-item md-size-10'>{{controller.value}}</div> 
  </div>
</template>

<script>
//import vueSlider from 'vue-slider-component'
export default {
  name: 'Controller',
  props: ['controller'],
  components: {
    vueSlider
  },
  computed: {
    trimmedName: function(){
      return this.controller.name.slice(7)
    },
  },
  data() {
    return {
      min: this.controller.min,
      max: this.controller.max
    }
  },
  methods: {
  },
  mounted()
  {
  
  }
}
</script>

<style scoped>
.speckle-input{
  width:100%
}
.slider-wrapper{
  padding-left:5px;
  padding-right:5px;
}
.slider{
  width:100%
}
</style>
