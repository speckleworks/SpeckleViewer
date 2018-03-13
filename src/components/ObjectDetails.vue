<template>
  <div class='object-details'>
    <div v-for='(node, label) in nodes'>
      <md-list-item v-if='nodeType(node)' md-expand>
        <span class="md-list-item-text">{{label}}</span>
        <md-list slot="md-expand">
          <md-list-item class="md-inset">      
            <object-details :nodes='node' :label='label'></object-details>
          </md-list-item>
        </md-list>
      </md-list-item>
      <md-list-item v-else-if='node != null'>
        <span class="md-list-item-text">{{label}}: {{node}}</span>
      </md-list-item>
    </div>
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
.object-details {
  max-width:400px;
}
.object-details .md-list-item-content{
  min-height: 30px;
  padding: 0px 12px 0px 12px !important;
}
</style>
