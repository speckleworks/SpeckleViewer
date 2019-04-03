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
    // proper load unload methods
    // 1. loads objects into the scene
    async loadObjects( args ) {
      let toRequest = args.toRequest,
        zExt = true
      try { zExt = args.zoomExt } catch ( e ) {}
      // prepare buckets
      let totalCount = 0,
        requestBatches = [ ],
        maxObjectRequestCount = 25,
        bucket = [ ]
      for ( var i = 0; i < toRequest.length; i++ ) {
        bucket.push( toRequest[ i ] )
        if ( i % maxObjectRequestCount == 0 && i != 0 ) {
          requestBatches.push( [ ...bucket ] )
          bucket = [ ]
        }
      }
      if ( bucket.length != 0 ) requestBatches.push( bucket )

      console.info( `Made ${requestBatches.length} batches` )

      // request the objects from the server
      let filledBatch = [ ],
        k = 1
      for ( const batch of requestBatches ) {
        let res = await this.$http.post( this.$store.state.server + '/objects/getbulk?omit=base64,rawData', batch.map( item => item._id ) )
        res.data.resources.forEach( ( obj, i ) => {
          obj.streams = batch[ i ].streams
          obj.layerGuids = batch[ i ].layerGuids
        } )
        if ( requestBatches.length > 0 && batch.length > 0 )
          bus.$emit( 'stream-load-progress', `Got ${ k++ * maxObjectRequestCount } objects out of ${toRequest.length }` )
        filledBatch = [ ...res.data.resources, ...filledBatch ]
      }

      // convert the objects and add them to the scene
      let convertedCount = 0
      filledBatch.forEach( object => {
        let splitType = object.type.split("/")
        let convertType = splitType.pop()
        while (splitType.length > 0 & !Converter.hasOwnProperty( convertType ))
          convertType = splitType.pop()
        if ( !Converter.hasOwnProperty( convertType ) ) {
          convertedCount++
          if ( convertedCount >= filledBatch.length ) {
            this.computeSceneBoundingSphereAndZoomExt( zExt )
            bus.$emit( 'stream-load-progress', `All ready.` )
          }
          return console.warn( `Objects of type ${object.type} not supported.` )
        }
        let layer = this.$store.getters.allLayerMaterials.find( l => object.layerGuids.indexOf( l.guid ) > -1 )
        if ( !layer ) layer = this.defaultLayerMaterial
        Converter[ convertType ]( { obj: object, layer: layer }, ( err, threeObj ) => {
          convertedCount++
          threeObj.hash = object.hash
          threeObj.streams = object.streams
          threeObj.layerGuids = object.layerGuids
          threeObj._id = object._id
          threeObj.properties = object.properties

          let color = null
          try { color = object.properties.spkColor } catch ( e ) {}
          if ( color ) {
            if ( threeObj instanceof THREE.Mesh ) threeObj.material = this.getMeshMaterial( color )
            if ( threeObj instanceof THREE.Line ) threeObj.material = this.getLineMaterial( color )
            if ( threeObj instanceof THREE.Points ) threeObj.material = this.getPointsMaterial( color )
          }
          this.scene.add( threeObj )
          this.$store.state.inRenderObjects.push( object._id )
          if ( convertedCount >= filledBatch.length ) {
            this.computeSceneBoundingSphereAndZoomExt( zExt )
            bus.$emit( 'stream-load-progress', `All ready.` )
          }
        } )
      } )
    },

    // 2. updates object tracking (streams and layers)
    updateObjectProps( toUp ) {
      toUp.forEach( newObj => {
        let found = this.scene.children.filter( obj => obj.hasOwnProperty( '_id' ) ).find( obj => obj._id === newObj._id )
        found.streams = [ ...newObj.streams, ...found.streams ]
        found.layerGuids = [ ...newObj.layerGuids, ...found.layerGuids ]
      } )
    },

    // 3. unloads objects
    unloadObjects( args ) {
      let removedIds = [ ]
      let objectIds = args.objs,
        streamId = args.streamId

      this.scene.children = this.scene.children.filter( object => {
        // probably a scene object
        if ( !object.hasOwnProperty( '_id' ) )
          return true
        if ( objectIds.indexOf( object._id ) !== -1 ) {
          object.streams = object.streams.filter( x => x !== streamId )
          if ( object.streams.length === 0 ) {
            removedIds.push( object._id )
            return false
          }
          return true
        }
        return true
      } )

      this.$store.commit( 'REMOVE_INRENDER_OBJS', removedIds )
      this.computeSceneBoundingSphere( geometry => this.sceneBoundingSphere = geometry.boundingSphere )
    },

    // visibility methods
    toggleLayer( args ) {
      this.scene.traverse( obj => {
        if ( !obj.hasOwnProperty( 'layerGuids' ) ) return
        if ( obj.layerGuids.indexOf( args.layerGuid ) >= 0 )
          obj.visible = args.state
      } )
    },

    ghostObjects( objIds ) {
      this.scene.traverse( obj => {
        if ( !obj.hasOwnProperty( '_id' ) ) return
        if ( obj.hasOwnProperty( 'ghostMaterial' ) ) return // means it's already ghosted
        if ( objIds.indexOf( obj._id ) !== -1 ) {
          obj.ghostMaterial = obj.material // keep old ref
          obj.material = obj.material.clone( ) // break ref
          obj.material.opacity = 0.1 // change opacity
          obj.premultipliedAlpha = true
          obj.renderOrder = 1
          // obj.material.wireframe = true
        }
      } )
    },

    unghostObjects( objIds ) {
      this.scene.traverse( obj => {
        if ( !obj.hasOwnProperty( '_id' ) || !obj.hasOwnProperty( 'ghostMaterial' ) ) return
        if ( objIds.indexOf( obj._id ) !== -1 ) {
          obj.material.dispose( ) // only leaky bladders, no leaky memory please
          obj.material = obj.ghostMaterial // go back
          obj.renderOrder = 0
          delete obj.ghostMaterial
        }
      } )
    },

    // Custom color material generators
    getMeshMaterial( color ) {
      return new THREE.MeshPhongMaterial( {
        color: new THREE.Color( color.hex ),
        specular: new THREE.Color( '#FFECB3' ),
        shininess: 30,
        side: THREE.DoubleSide,
        transparent: true,
        wireframe: false,
        opacity: color.a
      } )
    },
    getLineMaterial( color ) {
      return new THREE.LineBasicMaterial( {
        color: new THREE.Color( color.hex ),
        linewidth: 1,
        opacity: color.a
      } )
    },
    getPointsMaterial( color ) {
      return new THREE.PointsMaterial( {
        color: new THREE.Color( color.hex ),
        sizeAttenuation: false,
        transparent: true,
        size: 3,
        opacity: color.a
      } )
    },

    // Base Render Methods
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

    // Selection methods
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
        properties: selectedObject.properties,
        streams: selectedObject.streams,
        layers: selectedObject.layerGuids
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

    // Renderer Camera Methods
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

    computeSceneBoundingSphereAndZoomExt( zExt ) {
      this.computeSceneBoundingSphere( geometry => {
        this.sceneBoundingSphere = geometry.boundingSphere
        if ( zExt ) this.zoomExtents( )
      } )
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

    bus.$on( 'r-load-objects', this.loadObjects )
    bus.$on( 'r-unload-objects', this.unloadObjects )
    bus.$on( 'r-update-props', this.updateObjectProps )

    bus.$on( 'r-ghost-objects', this.ghostObjects )
    bus.$on( 'r-unghost-objects', this.unghostObjects )
    bus.$on( 'r-zoom-to-object', this.zoomToObject )
    bus.$on( 'r-zoom-ext', this.zoomExtents )

    bus.$on( 'r-deselect-objects', this.deselectObjects )



    bus.$on( 'select-bus', this.selectBus )
    bus.$on( 'r-toggle-layer', this.toggleLayer )


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

</style>
