import Vue              from 'vue'
import App              from './App.vue'
import VueMaterial      from 'vue-material'
import Axios            from 'axios'
import Store            from './store/Store'
import TreeView         from 'vue-json-tree-view'
import vueDrag          from 'vue-dragging'

Vue.prototype.$http = Axios

Vue.use( VueMaterial )
Vue.use( vueDrag )
Vue.use( TreeView )

window.bus = new Vue( )

//hacky
window.camLoc = {}


Vue.material.registerTheme('default', {
  primary: 'black',
  accent: 'light-blue',
  warn: 'red',
  background: 'white'
})


new Vue({
  el: '#app',
  store: Store,
  render: h => h(App)
})
