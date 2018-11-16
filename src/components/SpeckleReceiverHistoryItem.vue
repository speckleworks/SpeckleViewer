<template>
  <md-card style="margin-bottom: 4px; padding: 10px;" :class='{"md-elevation-0":true, "md-primary selected":selected}' md-with-hover @click.native='selectThis()'>
    <div class="md-layout md-alignment-center-center">
      <div class="md-layout-item md-size-100">
        <p class="md-layout-item">
          <strong>{{updatedAt}}</strong></span>
          <span v-if='!stream.isComputedResult'>
          <br>
          <span class="md-caption">{{streamid}}, {{stream.name}}</span>
          </span>
          <span v-if='stream.isComputedResult' class="md-caption">(computed result)</span>
        </p>
      </div>
      <!--       <div class="md-layout-item" style="text-align: right" v-if='!stream.isComputedResult'>
        <md-button class='md-icon-button md-dense md-primary md-raised' @click.native=''>
          <md-icon>chevron_right</md-icon>
        </md-button>
      </div> -->
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
      console.log( 'seel' )
      this.$emit( 'selectme', this.streamid )
    }
  },
  mounted( ) {
    console.log( 'history was created, getting streams!' )
    axios.get( this.$store.state.server + '/streams/' + this.streamid + '?fields=name,updatedAt,isComputedResult', { headers: { 'Auth': this.$store.state.jwtToken } } )
      .then( response => {
        this.stream.updatedAt = response.data.resource.updatedAt
        this.stream.name = response.data.resource.name
        this.stream.isComputedResult = response.data.resource.isComputedResult
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
.slected.md-caption{
  color:white !important;

}

</style>
