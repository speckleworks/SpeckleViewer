import Vue from 'vue'
import App from './App.vue'
import VueMaterial from 'vue-material'
import Axios from 'axios'
import Store from './store/Store'
import TreeView from 'vue-json-tree-view'
import vueDrag from 'vue-dragging'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import Clipboard from 'v-clipboard'

Vue.prototype.$http = Axios

Vue.use( VueMaterial )
Vue.use( vueDrag )
Vue.use( TreeView )
Vue.use(Clipboard)

window.bus = new Vue( )

//hacky
window.camLoc = {}

// If there's no "dev" keyword in the url, set the serverUrl from window.location.origin
if ( !window.location.href.includes( 'dev' ) )
  window.SpkAppConfig.serverUrl = window.location.origin + '/api'
// ELSE
// we will go forward and use the one provided in the dist/config.js file.

// Vue.material.registerTheme( 'default', {
//   primary: 'black',
  // accent: 'light-blue',
  // warn: 'red',
  // background: 'white'
// } )


new Vue( {
  el: '#app',
  store: Store,
  render: h => h( App )
} )
