<template>
  <div>
    <div id='render-window' ref='mycanvas'>
    </div>
  </div>
</template>
<script>
import * as THREE from 'three'
import OrbitControlsDef from 'three-orbit-controls'
import TWEEN from 'tween.js'
import debounce from 'debounce'

import Converter from '../converter/converter'
import ObjectDetails from './ObjectDetails.vue'
export default {
  name: 'SpeckleRenderer',
  components: {
    ObjectDetails
  },
  computed: {
    isMobile( ) {
      return this.$store.getters.isMobile
    },
    allObjects( ) {
      return this.$store.getters.allObjects
    },
    layerMaterials( ) {
      return this.$store.getters.allLayerMaterials
    },
    defaultLayerMaterial( ) {
      return this.$store.getters.defaultLayerMaterial
    },
    propertiesToDisplay( ) {
      return this.selectedObjectsProperties.properties
    }
  },
  data( ) {
    return {
      selectedObjectsProperties: [ { hash: null, properties: {} } ],
      hoveredObject: '',
      isRotatingStuff: false,
      isInitLoad: false,
      sceneBoundingSphere: null
    }
  },
  methods: {
    loadStream( ) {
      this.update( )
    },
    async update( ) {
      // removes the objects that are no longer in any stream's object list
      // TODO: remove them from the vuejs store as well (free for GC?)
      for ( let myObject of this.scene.children ) {
        if ( myObject.hasOwnProperty( '_id' ) ) {
          let found = this.allObjects.find( o => { return o._id === myObject._id && o.streamId === myObject.streamId } )
          if ( !found ) {
            scene.remove( myObject )
            myObject.geometry.dispose( )
            // myObject.material.dispose( ) // don't dispose material as they're used across?
            myObject = null
          }
        }
      }

      // creates a list of objects to request from the server and makes the previously requested ones visible
      let thingsToReq = [ ]
      for ( let myObject of this.allObjects ) {
        let sceneObj = this.scene.children.find( obj => { return obj.name === myObject.streamId + '::' + myObject._id } )
        if ( !sceneObj ) {
          let layer = this.layerMaterials.find( lmat => { return lmat.guid === myObject.layerGuid && lmat.streamId === myObject.streamId } )
          if ( !layer ) layer = this.defaultLayerMaterial
          thingsToReq.push( { object: myObject, layer: layer } )
        } else {
          // makes things visible; this should no longer be the case (as we're removing the objects fully above ¯\_(ツ)_/¯
          if ( sceneObj.visible === false ) {
            sceneObj.visible = true
            sceneObj.isCurrent = true
            sceneObj.spkProperties = myObject.properties
          }
        }
      }

      let totalCount = 0
      let requestBatches = [ ]
      let maxObjectRequestCount = 25
      let bucket = [ ]
      for ( var i = 0; i < thingsToReq.length; i++ ) {
        bucket.push( thingsToReq[ i ] )
        if ( i % maxObjectRequestCount == 0 && i != 0 ) {
          requestBatches.push( [ ...bucket ] )
          bucket = [ ]
        }
      }
      if ( bucket.length != 0 )
        requestBatches.push( bucket )

      let filledBatch = [ ]
      let k = 1
      for ( const batch of requestBatches ) {
        let res = await this.$http.post( this.$store.state.server + '/objects/getbulk?omit=base64,rawData', batch.map( item => item.object._id ) )
        res.data.resources.forEach( ( obj, i ) => {
          obj.streamId = batch[ i ].object.streamId;
          obj.layerGuid = batch[ i ].object.layerGuid
        } )
        if ( requestBatches.length > 0 && batch.length > 0 )
          bus.$emit( 'stream-load-progress', `Got ${ k++ * maxObjectRequestCount } objects out of ${thingsToReq.length }` )

        filledBatch = [ ...res.data.resources.map( ( obj, i ) => { return { object: obj, layer: batch[ i ].layer } } ), ...filledBatch ]
      }

      let convertedCount = 0
      filledBatch.forEach( ( pair, i ) => {
        convertedCount++
        if ( !Converter.hasOwnProperty( pair.object.type ) )
          throw new Error( `Objects of type ${pair.object.type} not supported.` )
        else
          Converter[ pair.object.type ]( { obj: pair.object, layer: pair.layer, camera: this.camera }, ( err, threeObj ) => {
            threeObj.hash = pair.object.hash
            threeObj.streamId = pair.object.streamId
            threeObj.layerGuid = pair.object.layerGuid
            threeObj.visible = pair.layer.visible
            threeObj.isCurrent = true
            threeObj.spkProperties = pair.object.properties
            threeObj.name = pair.object.streamId + '::' + pair.object._id
            threeObj._id = pair.object._id

            let color = null
            try {
              color = pair.object.properties.spkColor
            } catch ( e ) {}

            if ( color ) {
              // override material
              let color = pair.object.properties.spkColor
              if ( threeObj instanceof THREE.Mesh ) {
                threeObj.material = new THREE.MeshPhongMaterial( {
                  color: new THREE.Color( color.hex ),
                  specular: new THREE.Color( '#FFECB3' ),
                  shininess: 30,
                  side: THREE.DoubleSide,
                  transparent: true,
                  wireframe: false,
                  opacity: color.a
                } )
              }
              if ( threeObj instanceof THREE.Line ) {
                threeObj.material = new THREE.LineBasicMaterial( {
                  color: new THREE.Color( color.hex ),
                  linewidth: 1,
                  opacity: color.a
                } )
              }
              if ( threeObj instanceof THREE.Points ) {
                threeObj.material = new THREE.PointsMaterial( {
                  color: new THREE.Color( color.hex ),
                  sizeAttenuation: false,
                  transparent: true,
                  size: 3,
                  opacity: color.a
                } )
              }
            }
            this.scene.add( threeObj )
            if ( convertedCount >= filledBatch.length ) {
              this.needsBoundsRefresh = true
              this.computeSceneBoundingSphere( geometry => {
                this.needsBoundsRefresh = false
                this.sceneBoundingSphere = geometry.boundingSphere
                this.zoomExtents( )
                bus.$emit( 'stream-load-progress', `All ready.` )
              } )
            }
          } )
      } )
    },

    render( ) {
      TWEEN.update( )

      this.animationId = requestAnimationFrame( this.render )
      this.renderer.render( this.scene, this.camera )
    },

    resizeCanvas( ) {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix( )
      this.renderer.setSize( window.innerWidth, window.innerHeight )
    },

    toggleLayer( args ) {
      this.scene.traverse( obj => {
        if(!obj.hasOwnProperty('layerGuid')) return
        if(obj.layerGuid == args.layerGuid)
          obj.visible = args.state
      })
    },

    deselectObjects( ) {
      this.hoveredObjects.forEach( myObject => {
        let layer = this.layerMaterials.find( lmat => { return lmat.guid === myObject.layerGuid && lmat.streamId === myObject.streamId } )

        myObject.material = myObject.originalMaterial
      } )
      this.hoveredObjects = [ ]
      this.hoveredObject = ''
      this.selectionBoxes = [ ]
      let selectedObjectProperties = null
      if ( this.$store.getters.selectedObjects != null )
        this.$store.commit( 'SET_SELECTED_OBJECTS', { selectedObjectProperties } )
    },
    selectObject( selectedObject ) {
      selectedObject.originalMaterial = selectedObject.material
      selectedObject.material = this.hoverMaterial

      this.hoveredObjects.push( selectedObject )
      this.hoveredObject = selectedObject.hash

      this.selectedObjectsProperties = {
        hash: selectedObject.hash,
        streamId: selectedObject.streamId,
        properties: selectedObject.spkProperties
      }
      let selectedObjectProperties = this.selectedObjectsProperties
      this.$store.commit( 'SET_SELECTED_OBJECTS', { selectedObjectProperties } )
    },
    canvasClickedEvent( event ) {
      if ( event.which === 3 ) {
        this.deselectObjects( )
        return
      }
      if ( this.isRotatingStuff ) return
      this.deselectObjects( )

      // preselect object
      let mouse = new THREE.Vector2( ( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1 )
      this.raycaster.setFromCamera( mouse, this.camera )

      let intersects = this.raycaster.intersectObjects( scene.children )
      if ( intersects.length <= 0 ) {
        return
      }

      let selectedObject = null
      intersects.reverse( ).forEach( obj => {
        if ( obj.object.material.visible ) selectedObject = obj.object
      } )

      if ( !selectedObject ) {
        return
      }
      this.selectObject( selectedObject )
    },
    selectBus( objectId ) {
      this.deselectObjects( )
      let selectedObject = this.scene.children.find( child => { return child.name.includes( objectId ) } )
      let hash = this.getHash( objectId )
      this.zoomToObject( hash )
      this.selectObject( selectedObject )
    },
    getHash( objectId ) {
      let child = this.scene.children.find( child => { return child.name.includes( objectId ) } )
      return child.hash
    },
    dropStream( streamId ) {
      this.scene.children = this.scene.children.filter( child => !child.name.includes( streamId ) )
      this.computeSceneBoundingSphere( geometry => {
        this.needsBoundsRefresh = false
        this.sceneBoundingSphere = geometry.boundingSphere
        this.zoomExtents( )
      } )
    },
    zoomToObject( hash ) {
      if ( this.hoveredObject ) {
        hash = this.hoveredObject
      }
      if ( !hash ) {
        console.log( 'No object selected' )
        return
      }
      let myObject = this.scene.children.find( ch => { return ch.hash === hash } )
      if ( !myObject )
        return console.warn( 'no object selected' )
      myObject.geometry.computeBoundingSphere( )
      let bsphere = myObject.geometry.boundingSphere
      let r = bsphere.radius

      let offset = r / Math.tan( Math.PI / 180.0 * this.controls.object.fov * 0.5 )
      let vector = new THREE.Vector3( 0, 0, 1 )
      let dir = vector.applyQuaternion( this.controls.object.quaternion );
      let newPos = new THREE.Vector3( )
      dir.multiplyScalar( offset * 1.25 )
      newPos.addVectors( bsphere.center, dir )
      this.setCamera( {
        position: [ newPos.x, newPos.y, newPos.z ],
        rotation: [ this.camera.rotation.x, this.camera.rotation.y, this.camera.rotation.z ],
        target: [ bsphere.center.x, bsphere.center.y, bsphere.center.z ]
      }, 100 )
    },
    computeSceneBoundingSphere( cb ) {
      let minX, minY, minZ, maxX, maxY, maxZ

      let geometry = new THREE.Geometry( )
      this.scene.children.forEach( child => {
        if ( child.geometry ) {
          geometry.merge( child.geometry )
        }
      } )
      geometry.computeBoundingSphere( )
      cb( geometry )
    },
    zoomExtents( duration ) {
      let offset = this.sceneBoundingSphere.radius / Math.tan( Math.PI / 180.0 * this.controls.object.fov * 0.5 )
      let vector = new THREE.Vector3( 0, 0, 1 )
      let dir = vector.applyQuaternion( this.controls.object.quaternion );
      let newPos = new THREE.Vector3( )
      dir.multiplyScalar( offset * 1.25 )
      newPos.addVectors( this.sceneBoundingSphere.center, dir )
      this.setCamera( {
        position: [ newPos.x, newPos.y, newPos.z ],
        rotation: [ this.camera.rotation.x, this.camera.rotation.y, this.camera.rotation.z ],
        target: [ this.sceneBoundingSphere.center.x, this.sceneBoundingSphere.center.y, this.sceneBoundingSphere.center.z ]
      }, 250 )
    },
    setFar_t( ) {
      let camDistance = this.camera.position.distanceTo( this.sceneBoundingSphere.center )
      this.camera.far = 2 * this.sceneBoundingSphere.radius + camDistance
      this.camera.updateProjectionMatrix( )
    },
    setCamera( where, time ) {
      let self = this
      let duration = time ? time : 350
      //position
      new TWEEN.Tween( self.camera.position ).to( { x: where.position[ 0 ], y: where.position[ 1 ], z: where.position[ 2 ] }, duration ).easing( TWEEN.Easing.Quadratic.InOut ).start( )
      // rotation
      new TWEEN.Tween( self.camera.rotation ).to( { x: where.rotation[ 0 ], y: where.rotation[ 1 ], z: where.rotation[ 2 ] }, duration ).easing( TWEEN.Easing.Quadratic.InOut ).start( )
      // controls center
      new TWEEN.Tween( self.controls.target ).to( { x: where.target[ 0 ], y: where.target[ 1 ], z: where.target[ 2 ] }, duration ).onUpdate( ( ) => {
        self.controls.update( );
        if ( this.x === where.target[ 0 ] )
          console.log( 'camera finished stuff' )
      } ).easing( TWEEN.Easing.Quadratic.InOut ).start( )
    },
  },
  mounted( ) {

    this.oldQuaternion = null
    this.frameSkipper = 0
    this.animationId = null
    this.selectionBoxes = [ ]
    this.hoveredObjects = [ ]

    this.needsBoundsRefresh = false
    this.loadFinishedPromise = null

    this.updateInProgress = false

    this.hoverMaterial = new THREE.MeshPhongMaterial( { color: new THREE.Color( '#FFFF66' ), specular: new THREE.Color( '#FFECB3' ), shininess: 0, side: THREE.DoubleSide, transparent: true, opacity: 1 } )


    this.renderer = new THREE.WebGLRenderer( { alpha: true, antialias: true } )
    this.renderer.setSize( window.innerWidth, window.innerHeight )
    this.renderer.setClearColor( new THREE.Color( '#FFFFFF' ), 0 )
    this.$refs.mycanvas.appendChild( this.renderer.domElement )

    this.scene = new THREE.Scene( )
    window.scene = this.scene

    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100000 );
    this.camera.up.set( 0, 0, 1 )
    this.camera.position.z = 1000
    this.camera.isCurrent = true
    this.camera.name = 'my super camera'
    this.oldQuaternion = new THREE.Quaternion( ).copy( this.camera.quaternion )

    this.OrbitControls = OrbitControlsDef( THREE )
    this.controls = new this.OrbitControls( this.camera, this.renderer.domElement )

    this.controls.addEventListener( 'change', this.setFar_t )

    this.computeSceneBoundingSphere( geometry => {
      this.sceneBoundingSphere = geometry.boundingSphere
    } )

    this.render( )
    window.addEventListener( 'resize', this.resizeCanvas )

    let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
    hemiLight.color = new THREE.Color( '#FFFFFF' )
    hemiLight.groundColor = new THREE.Color( '#959595' )
    hemiLight.position.set( 0, 500, 0 );
    hemiLight.isCurrent = true
    hemiLight.name = 'world lighting'
    this.scene.add( hemiLight );

    let flashlight = new THREE.PointLight( new THREE.Color( '#FFFFFF' ), 0.32, 0, 1 )
    flashlight.name = 'camera light'
    this.scene.add( this.camera )
    this.camera.add( flashlight )

    this.raycaster = new THREE.Raycaster( )

    this.$refs.mycanvas.onmousedown = this.canvasClickedEvent

    document.onkeydown = ( event ) => {
      if ( event.keyCode !== 27 ) return
      this.deselectObjects( )
    }

    window.THREE = THREE
    window.scene = this.scene

    bus.$on( 'renderer-update', debounce( this.update, 300 ) )
    bus.$on( 'renderer-setview', this.setCamera )
    bus.$on( 'renderer-load-stream', this.loadStream )
    bus.$on( 'zext', this.zoomExtents )

    bus.$on( 'renderer-pop', ( ) => {
      console.log( "POP" )
      this.$refs.mycanvas.classList.toggle( 'pop' )
    } )
    bus.$on( 'renderer-unpop', ( ) => {
      console.log( "UNPOP" )
      this.$refs.mycanvas.classList.toggle( 'pop' )
    } )
    bus.$on( 'select-bus', ( objectId ) => {
      this.selectBus( objectId )
    } )
    bus.$on( 'zoomToObject', ( ) => {
      this.zoomToObject( )
    } )
    bus.$on( 'renderer-drop-stream', ( streamId ) => {
      this.dropStream( streamId )
    } )
    bus.$on( 'toggle-layer', ( args ) => {
      this.toggleLayer( args )
    } )


    document.addEventListener( 'keydown', ( event ) => {
      const keyName = event.key;
      if ( keyName == ' ' ) this.zoomExtents( )
    } )
  }
}

</script>
<style scoped>
#render-window {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /*z-index: 10;*/
  transition: all .2s ease;
  background-color: aliceblue;
}

#render-window.pop {
  top: -15%;
}

.object-info {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 10;
  user-select: none;
}

.expand-button {
  z-index: 42;
  margin: 0px !important;
}


.expanded-info-box {
  border-color: grey;
  position: absolute;
  top: 0;
  left: 35px;
  /*max-width: 400px;*/
  max-height: 300px;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
  user-select: auto;
  z-index: 40;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
}


@media (max-width: 768px) {
  .expanded-info-box {
    position: fixed;
    top: auto;
    bottom: 50px;
    left: 2%;
    width: 96%;
    max-width: 96%;
    height: 30%;
    background-color: white;
    z-index: 44;
    overflow-x: auto;
  }
}

.tree-view-wrapper {
  font-family: auto;
  overflow: hidden !important;
}

</style>
