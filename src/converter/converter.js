import * as THREE from 'three'

function argbToRGB( color ) {
  return '#' + ( '000000' + ( color & 0xFFFFFF ).toString( 16 ) ).slice( -6 )
}

export default { 
  heavyTypes: [ 'Polyline', 'Curve', 'Brep', 'Mesh' ],
  //
  // The following objects do not contain a native hash, therefore
  // we construct one on the spot for the renderer pass
  //
  Point( args, cb ) {
    let geometry = new THREE.Geometry( )  
    geometry.vertices.push( new THREE.Vector3( ...args.obj.value ) )
    let point = new THREE.Points( geometry, args.layer.threePointMaterial )
    cb( null, point )
  },
  Vector( obj, cb ) {
    console.warn( 'TODO', obj.type)
  },
  Plane( obj, cb ) {
    console.warn( 'TODO', obj.type)
  },
  Line( args, cb ) {
    let geometry = new THREE.Geometry()
    geometry.vertices.push( new THREE.Vector3( args.obj.start.value[ 0 ], args.obj.start.value[ 1 ], args.obj.start.value[ 2 ] ) )
    geometry.vertices.push( new THREE.Vector3( args.obj.end.value[ 0 ], args.obj.end.value[ 1 ], args.obj.end.value[ 2 ] ) )
    let line = new THREE.Line( geometry, args.layer.threeLineMaterial )
    line.hash = args.obj.hash
    cb( null, line )
  },
  Rectangle( obj, cb ) {
    console.warn( 'TODO', obj.type)
  },
  Circle( obj, cb ) {
    console.warn( 'TODO', obj.type)
  }, 
  Box( obj, cb ) {
    console.warn( 'TODO', obj.type)
  },

  // 
  // These are objects that already contain a hash
  // 
  Polyline( args, cb ) {
    let geometry = new THREE.Geometry()
    if( !args.obj.value ) return console.warn( 'Strange polyline.' )
    for(let i = 2; i < args.obj.value.length; i += 3 )
      geometry.vertices.push( new THREE.Vector3( args.obj.value[ i - 2 ], args.obj.value[ i - 1 ], args.obj.value[ i ] ) )

    let polyline = new THREE.Line( geometry, args.layer.threeLineMaterial )
    polyline.hash = args.obj.hash
    cb( null, polyline )
  },

  Curve( args, cb ) {
    this.Polyline( { obj: args.obj.displayValue, layer: args.layer } , ( err, poly ) => {
      if( err ) return cb( err )
      return cb( null, poly )
    })
  },

  Mesh( args, cb ) {
    let obj = args.obj
    let geometry = new THREE.Geometry() 
    for(let i = 2; i < obj.vertices.length; i+=3)
      geometry.vertices.push( new THREE.Vector3( obj.vertices[i-2], obj.vertices[i-1], obj.vertices[i] ) )
    
    let k = 0
    while( k < obj.faces.length ) {
      // QUAD FACE
      if( obj.faces[ k ] === 1 ) {
        geometry.faces.push( new THREE.Face3( obj.faces[ k + 1 ], obj.faces[ k + 2 ], obj.faces[ k + 3 ] ) )
        geometry.faces.push( new THREE.Face3( obj.faces[ k + 1 ], obj.faces[ k + 3 ], obj.faces[ k + 4 ] ) )
        k += 5
      }
      // TRIANGLE FACE
      if( obj.faces[ k ] === 0 ) {
        geometry.faces.push( new THREE.Face3( obj.faces[ k + 1 ], obj.faces[ k + 2 ], obj.faces[ k + 3 ] ) )
        k += 4
      }
    }

    if( args.obj.colors ) {
      geometry.faces.forEach( face => {
        let colorA = new THREE.Color( argbToRGB( args.obj.colors[ face.a ] ) )
        face.vertexColors.push( colorA )
        let colorB = new THREE.Color( argbToRGB( args.obj.colors[ face.b ] ) )
        face.vertexColors.push( colorB )
        let colorC = new THREE.Color( argbToRGB( args.obj.colors[ face.c ] ) )
        face.vertexColors.push( colorC )
      })
    }
    
    geometry.computeFaceNormals() 
    geometry.computeVertexNormals()
    
    let edges = new THREE.EdgesGeometry( geometry )
    let line = new THREE.LineSegments( edges, args.layer.threeEdgesMaterial )
    let mesh = new THREE.Mesh( geometry, args.layer.threeMeshMaterial )
    mesh.hasVertexColors = false
    
    if( args.obj.colors.length > 0 ) {
      mesh.hasVertexColors = true
      mesh.material = args.layer.threeMeshVertexColorsMaterial
    }
    mesh.add( line )
    mesh.hash = obj.hash

    return cb( null, mesh ) 
  }, 

  Brep( args, cb ) {
    this.Mesh( { layer: args.layer, obj: args.obj.displayValue } , ( err, obj ) => {
      if( err ) return cb ( err, null )  
      return cb( null, obj )
    })
  }
}