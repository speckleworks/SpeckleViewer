<template>
  <md-card style="margin-bottom: 4px; padding: 10px; cursor:default;" :class='{"md-elevation-0":true, "md-primary selected":selected}' md-with-hover>
    <div class="md-layout md-alignment-center-left">
      <div class="md-layout-item md-size-70" style="cursor: pointer" @click='selectThis()'>
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
      <div class="md-layout-item md-size-15" style="text-align: right" >
        <md-button v-if='selected' class='md-icon-button md-dense xxxmd-accent md-raised' @click.stop='$emit("restore")'>
          <md-icon>refresh</md-icon>
          <md-tooltip>Restore latest stream version.</md-tooltip>
        </md-button>
      </div>
      <div class="md-layout-item md-size-15" style="text-align: right">
        <a class='md-icon-button md-dense xxxmd-accent md-raised' style='border-bottom:none; text-decoration: none !important' :href='href' target='_blank'>
          <md-icon>open_in_new</md-icon>
          <md-tooltip>Open in a new tab.</md-tooltip>
        </a>
      </div>
    </div>
  </md-card>
</template>
<script>
import qp from 'query-parse'

export default {
  name: 'HistoryItem',
  props: { streamid: { type: String }, selected: { type: Boolean } },
  computed: {
    updatedAt( ) {
      return new Date( this.stream.updatedAt ).toLocaleString( )
    },
    href() {
      let query = qp.toObject( window.location.href.split( '?' )[ 1 ] )
      let reassembledQuery = window.location.href.split( '?' )[ 0 ]

      if ( query.server )
        reassembledQuery += `?server=${query.server}`
      reassembledQuery += `&streams=${this.streamid}`
      return reassembledQuery
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
    this.$http.get( this.$store.state.server + '/streams/' + this.streamid + '?fields=name,updatedAt,isComputedResult,globalMeasures' )
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
