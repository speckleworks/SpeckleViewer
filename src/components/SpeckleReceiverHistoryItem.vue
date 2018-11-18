<template>
  <md-card style="margin-bottom: 4px; padding: 10px; cursor: pointer;" :class='{"md-elevation-0":true, "md-primary selected":selected}' md-with-hover @click.native='selectThis()'>
    <div class="md-layout md-alignment-center-left">
      <div class="md-layout-item md-size-80">
        <p class="md-layout-item">
          <strong>{{updatedAt}}</strong></span>
          <span v-if='!stream.isComputedResult'>
          <br>
          <span class="md-caption">{{streamid}}, {{stream.name}}</span>
          </span>
          <div v-if='stream.isComputedResult'>
            <span class="md-caption">Computed result <strong>{{streamid}}</strong></span>
            <div class='md-caption' v-for='inp in stream.globalMeasures.input' :key='inp.name'>{{inp.name}}: <strong>{{inp.value}}</strong></div>
            <!-- {{stream.globalMeasures}} -->
          </div>
        </p>
      </div>
      <div class="md-layout-item" style="text-align: right" v-if='selected'>
        <md-button class='md-icon-button md-dense xxxmd-accent md-raised' @click.stop='$emit("restore")'>
          <md-icon>refresh</md-icon>
          <md-tooltip>Restore latest stream version.</md-tooltip>
        </md-button>
      </div>
    </div>
  </md-card>
</template>
<script>
import axios from 'axios'

export default {
  name: 'HistoryItem',
  props: { streamid: { type: String }, selected: { type: Boolean } },
  computed: {
    updatedAt( ) {
      return new Date( this.stream.updatedAt ).toLocaleString( )
    }
  },
  data( ) {
    return {
      stream: {
        name: "Loading",
        updatedAt: null
      }
    }
  },
  methods: {
    selectThis( ) {
      this.$emit( 'selectme', this.streamid )
    }
  },
  mounted( ) {
    axios.get( this.$store.state.server + '/streams/' + this.streamid + '?fields=name,updatedAt,isComputedResult,globalMeasures' )
      .then( response => {
        this.stream.updatedAt = response.data.resource.updatedAt
        this.stream.name = response.data.resource.name
        this.stream.isComputedResult = response.data.resource.isComputedResult
        this.stream.globalMeasures = response.data.resource.globalMeasures
      } )
      .catch( err => {
        console.log( err )
      } )
  }
}

</script>
<style scoped>
.selected {
  /*z-index: 100;*/
}

.slected.md-caption {
  color: white !important;

}

</style>
