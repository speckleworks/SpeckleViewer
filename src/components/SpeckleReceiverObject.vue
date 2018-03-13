<template>
  <div class='spk-object md-layout md-alignment-center-left md-dense'>
    <div class='md-layout-item spk-object-id'>{{spkobj._id}}</div>
    <div class='md-layout-item'>
      <md-button class="md-icon-button" @click='select(spkobj._id)'>
        <md-icon>zoom_in</md-icon>
      </md-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SpeckleReceiverObject',
  props: { 
    spkobj: { type: Object },
  },
  computed: {
  },
  data() {
    return {

    }
  },
  methods: {
    select(selection) {
      bus.$emit('select-bus', selection)
    }
  }
}
</script>

<style scoped>
.spk-object{
  padding: 0 0 0 0;
}
</style>
