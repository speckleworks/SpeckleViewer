import Vue from 'vue'
import Axios from 'axios'
import VueMaterial from 'vue-material'
import TreeView from 'vue-json-tree-view'
import vueDrag from 'vue-dragging'
import Clipboard from 'v-clipboard'
import qp from 'query-parse'

import App from './App.vue'
import Store from './store/Store'

import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'

Vue.prototype.$http = Axios

Vue.use( VueMaterial )
Vue.use( vueDrag )
Vue.use( TreeView )
Vue.use( Clipboard )

window.bus = new Vue( )
window.camLoc = {}

// if we provide a server url, use that.
// if not, assume the plugin is online and live, and
// default to `window.location.origin + '/api/v1'`

if ( window.location.href.includes( '?' ) ) {
  let query = qp.toObject( window.location.href.split( '?' )[ 1 ] )
  if ( query.server )
    Store.state.server = query.server + '/api/v1'
  else
    Store.state.server = window.location.origin + '/api/v1'

  if( query.streams )
    Store.state.initStreams = query.streams.split(',').filter( s => s !== '')
} else {
  Store.state.server = window.location.origin + '/api/v1'
}

new Vue( {
  el: '#app',
  store: Store,
  render: h => h( App )
} )
