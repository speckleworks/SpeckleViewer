<template>
  <div class='object-details'>
    <md-list :md-expand-single="true">
      <md-list-item v-for="(node, label) in nodes">
        <md-list-item v-if="nodeType(node)" md-expand>
          {{label}}
          <object-details slot="md-expand" :nodes="node" :label="label"></object-details>
        </md-list-item>
        <md-list-item v-else-if="node != null">
          {{label}}: {{node}}
        </md-list-item>
      </md-list-item>
    </md-list>
  </div>
</template>

<script>
export default {
  name: 'ObjectDetails',
  props: ['label', 'nodes'],
  methods: {
    nodeType: function (node) {
      if (typeof(node) === 'object' && node != null ){
        return true 
      }
    }
  }
}
</script>

<style>

</style>
