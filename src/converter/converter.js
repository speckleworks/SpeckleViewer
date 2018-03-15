import * as THREE from 'three'

function argbToRGB( color ) {
  return '#' + ( '000000' + ( color & 0xFFFFFF ).toString( 16 ) ).slice( -6 )
}

export default {
  Point( args, cb ) {
    let geometry = new THREE.Geometry( )
      geometry.vertices.push( new THREE.Vector3( ...args.obj.value ) )
      let point = new THREE.Points( geometry, args.layer.threePointMaterial )
      cb( null, point )
  },
  Vector( args, cb ) {
    console.log(args.obj)
    console.warn( 'TODO', args.obj.type)
  },
  Plane( args, cb ) {
    console.log(args.obj)
    console.warn( 'TODO', args.obj.type)
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
    console.warn( 'TODO', args.obj.type)
  },
  Circle( args, cb ) {
    let origin = args.obj.center.value
    let radius = args.obj.radius
    let v1 = new THREE.Vector3(0,0,1)
    let v2 = new THREE.Vector3()
    v2.fromArray(args.obj.normal.value)
    let q = new THREE.Quaternion()
    q.setFromUnitVectors(v1, v2)
    let curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2*Math.PI, false, 0)
    let points = curve.getPoints(50)
    let geometry = new THREE.BufferGeometry().setFromPoints(points)
    let circle = new THREE.Line(geometry, args.layer.threeLineMaterial)
    circle.rotation.setFromQuaternion(q)
    circle.position.set(origin[0],origin[1],origin[2])
    circle.hash = args.obj.hash
    cb( null, circle)
  },
  Arc (args, cb) {
    console.log(args.obj)
    let origin = args.obj.plane.origin.value
    let radius = args.obj.radius
    let startAngle = args.obj.startAngle
    let endAngle = args.obj.endAngle
    let v1 = new THREE.Vector3(0,0,1)
    let v2 = new THREE.Vector3()
    v2.fromArray(args.obj.plane.normal.value)
    let q = new THREE.Quaternion()
    q.setFromUnitVectors(v1, v2)
    let curve = new THREE.EllipseCurve(0, 0, radius, radius, startAngle, endAngle, false, 0)
    let points = curve.getPoints(50)
    let geometry = new THREE.BufferGeometry().setFromPoints(points)
    let arc = new THREE.Line(geometry, args.layer.threeLineMaterial)
    arc.rotation.setFromQuaternion(q)
    arc.position.set(origin[0],origin[1],origin[2])
    arc.hash = args.obj.hash
    cb( null, arc)
  },
  Ellipse (args, cb) {
    let origin = args.obj.plane.origin.value
    let xRadius = args.obj.firstRadius
    let yRadius = args.obj.secondRadius
    let startAngle = args.obj.startAngle
    let endAngle = args.obj.endAngle
    let v1 = new THREE.Vector3(0,0,1)
    let v2 = new THREE.Vector3()
    v2.fromArray(args.obj.plane.normal.value)
    let q = new THREE.Quaternion()
    q.setFromUnitVectors(v1, v2)
    let curve = new THREE.EllipseCurve(0, 0, xRadius, yRadius, startAngle, endAngle, false, 0)
    let points = curve.getPoints(50)
    let geometry = new THREE.BufferGeometry().setFromPoints(points)
    let arc = new THREE.Line(geometry, args.layer.threeLineMaterial)
    arc.rotation.setFromQuaternion(q)
    arc.position.set(origin[0],origin[1],origin[2])
    arc.hash = args.obj.hash
    cb( null, arc)
  },
  Box( args, cb ) {
    console.log(args.obj)
    let width = args.obj.xSize.end - args.obj.xSize.start
    let height = args.obj.ySize.end - args.obj.ySize.start
    let depth = args.obj.zSize.end - args.obj.zSize.start
    let origin = args.obj.basePlane.origin.value
    let v1 = new THREE.Vector3(0,0,1)
    let v2 = new THREE.Vector3()
    v2.fromArray(args.obj.basePlane.normal.value)
    let q = new THREE.Quaternion()
    q.setFromUnitVectors(v1, v2)
    let geometry = new THREE.BoxGeometry(width, height, depth)
    let box = new THREE.Mesh(geometry, args.layer.threeMeshMaterial )
    box.rotation.setFromQuaternion(q)
    box.position.set(origin[0],origin[1],origin[2])
    box.hash = args.obj.hash
    cb( null, box  )
  },

  Polyline( args, cb ) {
    let geometry = new THREE.Geometry()
      if( !args.obj.value ) return console.warn( 'Strange polyline.' )
        for(let i = 2; i < args.obj.value.length; i += 3 )
          geometry.vertices.push( new THREE.Vector3( args.obj.value[ i - 2 ], args.obj.value[ i - 1 ], args.obj.value[ i ] ) )

            let polyline = new THREE.Line( geometry, args.layer.threeLineMaterial )
            polyline.hash = args.obj.hash
            cb( null, polyline )
  },
  Polycurve ( args, cb ){
    console.warn('TODO', args.obj.type)
  },
  Annotation ( args, cb ){
    console.warn('TODO', args.obj.type)
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
