<template>
  <div class='object-details'>
    <!-- <md-list> -->
    <!--   <md-list-item v-for='(value, key) in speckleObject'> -->
    <!--     {{key}}: {{value}} -->
    <!--   </md-list-item> -->
    <!-- </md-list> -->
    <md-table> 
      <md-table-row v-for='(value, key) in speckleObject'>
        <md-table-cell>{{key}}</md-table-cell>
        <md-table-cell>{{value}}</md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script>
export default {
  name: 'ObjectDetails',
  props:{
    speckleObject: [Array, Object]
  },
  computed: {
  },
  data() {
    return {

    }
  },
  methods: {
  }
}
</script>

<style>
.object-details .md-table-cell-container{
  padding: 6px 12px 6px 12px !important;
}
</style>
