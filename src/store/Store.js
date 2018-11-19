import Vue from 'vue'
import Vuex from 'vuex'
import LMat from './LayerMaterial'

import * as THREE from 'three'

Vue.use( Vuex )

export default new Vuex.Store( {
  state: {
    server: null,
    jwtToken: '',
    user: {},
    mobile: false,
    initStreams: [ ],
    receivers: [ ],
    comments: [ ],
    viewerSettings: { },
    selectedObjects: [ ],
    inRenderObjects: [ ]
  },
  getters: {
    isMobile: state => state.mobile,
    user: state => state.user,
    authToken: state => state.jwtToken,
    allReceivers: state => state.receivers,
    receiverById: state => ( streamId ) => {
      return state.receivers.find( rec => rec.streamId === streamId )
    },
    allComments: state => state.comments,
    receiverComments: state => ( streamId ) => {
      return state.comments.filter( comment => comment.streamId === streamId ).reverse( )
    },
    receiverLayers: state => ( streamId ) => {
      return state.receivers.find( rec => rec.streamId === streamId ).layers
    },
    layerMaterial: ( state, getters ) => ( streamId, layerGuid ) => {
      return getters.receiverById( streamId ).layers.find( item => item.guid === layerGuid ).properties
    },
    allObjects: state => {
      return state.receivers.reduce( ( p, c ) => { return [ ...p, ...c.objects ] }, [ ] )
    },
    objectsByLayer: state => ( layerGuid ) => {
      let objects = state.receivers.reduce( ( p, c ) => { return [ ...p, ...c.objects ] }, [ ] )
      return objects.filter( object => object.layerGuid == layerGuid )
    },
    allLayerMaterials: ( state ) => {
      let arr = [ ]
      state.receivers.forEach( rec => {
        rec.layers.forEach( layer => {
          arr.push( layer.properties )
        } )
      } )
      return arr
      // return arr.concat.apply( [ ], arr )
    },
    defaultLayerMaterial: ( state ) => {
      return new LMat( { guid: "default", streamId: "default", color: "#808080" } )
    },
    viewerSettings: ( state ) => state.viewerSettings,
    selectedObjects: ( state ) => state.selectedObjects
  },
  actions: {},
  mutations: {
    ADD_INRENDER_OBJS( state, objects ) { },
    REMOVE_INRENDER_OBJS( state, objects ) {
      state.inRenderObjects = state.inRenderObjects.filter( id => objects.indexOf(id) === -1 )
    },
    SET_VIEWER_SETTINGS( state, { settings } ) {
      state.viewerSettings = settings
    },
    MOBILE_VIEW( state ) {
      state.mobile = true
    },
    SET_JWT( state, { jwtToken } ) {
      state.jwtToken = jwtToken
    },
    SET_USER( state, { account } ) {
      state.user = account
    },

    ADD_RECEIVERS( state, { receivers } ) {
      state.receivers = receivers
    },
    ADD_RECEIVER( state, { receiver } ) {
      state.receivers.unshift( receiver )
    },

    ADD_COMMENT( state, { payload } ) {
      state.comments.push( payload )
    },

    ADD_COMMENTS( state, { payload } ) {
      state.comments.push( ...payload.comments )
    },

    DROP_RECEIVER( state, { streamId } ) {
      state.receivers.splice( state.receivers.findIndex( rec => rec.streamId === streamId ), 1 )
    },

    UPDATE_LAYER_PROPS( state, { payload } ) {
      let l = state.receivers.find( rec => rec.streamId === payload.streamId ).layers.find( l => l.guid == payload.guid ).properties
      l.color.hex = payload.hex
      l.threeMeshMaterial.color = new THREE.Color( payload.hex )
      l.threeLineMaterial.color = new THREE.Color( payload.hex )
      l.threePointMaterial.color = new THREE.Color( payload.hex )
      l.threeMeshMaterial.opacity = payload.a
      l.threeLineMaterial.opacity = payload.a
      l.threePointMaterial.opacity = payload.a
    },

    INIT_RECEIVER_DATA( state, { payload } ) {

      let target = state.receivers.find( rec => rec.streamId === payload.streamId )

      target.name = payload.name
      target.children = payload.children
      target.createdAt = payload.createdAt
      target.updatedAt = payload.updatedAt
      target.comments = payload.comments
      target.baseProperties = payload.baseProperties
      target.owner = payload.owner

      // check if object table matches layer table
      let objCountLayers = 0
      payload.layers.forEach( l => objCountLayers += l.objectCount )
      if ( objCountLayers != payload.objects.length ) {
        console.warn( `Malformed layer table in stream ${payload.streamId}: ${payload.objects.length} objs out of which ${objCountLayers}  accounted for by layers.\nWill replace with one layer only that contains all objects.` )
        payload.layers = [ ]
        payload.layers.push( { guid: "gen-" + Date.now, name: "Default Layer", objectCount: payload.objects.length, orderIndex: 0, startIndex: 0, topology: "" } )
      }

      // set objects
      target.objects = payload.objects.map( ( obj, index ) => {
        return {
          streamId: payload.streamId,
          layerGuid: payload.layers.find( layer => {
            return index >= layer.startIndex && index < layer.startIndex + layer.objectCount
          } ).guid,
          _id: obj._id
        }
      } )

      // create layers magic
      target.layers = payload.layers.map( layer => {
        if ( layer.properties === undefined || layer.properties.threeMeshMaterial === undefined ) {
          layer.properties = new LMat( { guid: layer.guid, streamId: target.streamId, color: layer.properties ? layer.properties.color.hex : null } )
          return layer
        } else {
          layer.properties.threeMeshMaterial = new THREE.MeshPhongMaterial( { ...layer.properties.threeMeshMaterial } )
          layer.properties.threeLineMaterial = new THREE.LineBasicMaterial( { ...layer.properties.threeLineMaterial } )
          layer.properties.threeEdgesMaterial = new THREE.LineBasicMaterial( { ...layer.properties.threeEdgesMaterial } )
          layer.properties.threeEdgesMaterial.visible = layer.properties.showEdges
          layer.properties.threePointMaterial = new THREE.PointsMaterial( { ...layer.properties.threePointMaterial } )
          if ( layer.properties.threeMeshVertexColorsMaterial )
            layer.properties.threeMeshVertexColorsMaterial = new THREE.MeshPhongMaterial( { ...layer.properties.threeMeshVertexColorsMaterial } )
          else
            layer.properties.threeMeshVertexColorsMaterial = new LMat( { guid: layer.properties.guid, streamId: target.streamId } ).threeMeshVertexColorsMaterial
          return layer
        }
      } )
    },

    SET_RECEIVER_METADATA( state, { payload } ) {
      let target = state.receivers.find( rec => rec.streamId === payload.streamId )
      target.name = payload.name
      target.layers.forEach( l => {
        let match = payload.layers.find( la => la.guid == l.guid )
        if ( match ) {
          l.name = match.name
        } else {
          // REMOVE LAYER
        }
      } )
      // TODO: iterate through new list and add if required
    },

    SET_RECEIVER_DATA( state, { payload } ) {
      let target = state.receivers.find( rec => rec.streamId === payload.streamId )

      target.name = payload.name

      let layersToRemove = [ ],
        layersToAdd = [ ]

      target.layers.forEach( l => {
        let match = payload.layers.find( la => la.guid == l.guid )
        if ( match ) {
          l.name = match.name
        } else {
          layersToRemove.push( l )
        }
      } )

      payload.layers.forEach( l => {
        let match = target.layers.find( la => la.guid == l.guid )
        if ( !match )
          layersToAdd.push( l )
      } )

      // set objects
      target.objects = payload.objects.map( ( obj, index ) => {
        return {
          streamId: payload.streamId,
          layerGuid: payload.layers.find( layer => {
            return index >= layer.startIndex && index < layer.startIndex + layer.objectCount
          } ).guid,
          _id: obj._id
        }
      } )
    },
    SET_SELECTED_OBJECTS( state, { selectedObjectProperties } ) {
      state.selectedObjects = selectedObjectProperties
    }
  }
} )
