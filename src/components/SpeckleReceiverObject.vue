<template>
  <div class='spk-object md-layout md-alignment-center-left md-dense'>
    <md-layout-item class='spk-object-id'>{{spkobj._id}}</md-layout-item>
    <md-layout-item>
      <md-button class="md-icon-button" @click='select(spkobj._id)'>
        <md-icon>zoom_in</md-icon>
      </md-button>
    </md-layout-item>
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
