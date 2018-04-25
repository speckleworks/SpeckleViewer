import * as THREE from 'three'
import Converter from '../converter/converter'

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
    let v = new THREE.Vector3( ...args.obj.value )
    //can't render this, vectors do not have origin point
    console.warn( 'TODO', args.obj.type )
  },
  Plane( args, cb ) {
    //make planeSize a setting in the viewer
    let planeSize = 20
    let v1 = new THREE.Vector3( 0, 0, 1 )
    let v2 = new THREE.Vector3( ...args.obj.Normal.value )
    let q = new THREE.Quaternion( )
    q.setFromUnitVectors( v1, v2 )
    let geometry = new THREE.PlaneGeometry( planeSize, planeSize )
    let plane = new THREE.Mesh( geometry, args.layer.threeMeshMaterial )
    plane.geometry.applyMatrix( new THREE.Matrix4( ).makeRotationFromQuaternion( q ) );
    plane.geometry.applyMatrix( new THREE.Matrix4( ).makeTranslation( ...args.obj.Origin.value ) );
    plane.hash = args.obj.hash
    cb( null, plane )
  },
  Line( args, cb ) {
    let geometry = new THREE.Geometry( )
    geometry.vertices.push( new THREE.Vector3( args.obj.start.value[ 0 ], args.obj.start.value[ 1 ], args.obj.start.value[ 2 ] ) )
    geometry.vertices.push( new THREE.Vector3( args.obj.end.value[ 0 ], args.obj.end.value[ 1 ], args.obj.end.value[ 2 ] ) )
    let line = new THREE.Line( geometry, args.layer.threeLineMaterial )
    line.hash = args.obj.hash
    cb( null, line )
  },
  Rectangle( obj, cb ) {
    console.warn( 'TODO', args.obj.type )
  },
  Circle( args, cb ) {
    let origin = args.obj.center.value
    let radius = args.obj.radius
    let v1 = new THREE.Vector3( 0, 0, 1 )
    let v2 = new THREE.Vector3( ...args.obj.normal.value )
    let q = new THREE.Quaternion( )
    q.setFromUnitVectors( v1, v2 )
    let curve = new THREE.EllipseCurve( 0, 0, radius, radius, 0, 2 * Math.PI, false, 0 )
    let points = curve.getPoints( 50 )
    let geometry = new THREE.Geometry( ).setFromPoints( points )
    let circle = new THREE.Line( geometry, args.layer.threeLineMaterial )
    circle.geometry.applyMatrix( new THREE.Matrix4( ).makeRotationFromQuaternion( q ) );
    circle.geometry.applyMatrix( new THREE.Matrix4( ).makeTranslation( ...origin ) );
    circle.hash = args.obj.hash
    cb( null, circle )
  },
  Arc( args, cb ) {
    let radius = args.obj.radius
    let startAngle = args.obj.startAngle
    let endAngle = args.obj.endAngle
    let v1 = new THREE.Vector3( 0, 0, 1 )
    let v2 = new THREE.Vector3( ...args.obj.plane.normal.value )
    let q = new THREE.Quaternion( )
    q.setFromUnitVectors( v1, v2 )
    let curve = new THREE.EllipseCurve( 0, 0, radius, radius, startAngle, endAngle, false, 0 )
    let points = curve.getPoints( 50 )
    let geometry = new THREE.Geometry( ).setFromPoints( points )
    let arc = new THREE.Line( geometry, args.layer.threeLineMaterial )
    arc.geometry.applyMatrix( new THREE.Matrix4( ).makeRotationFromQuaternion( q ) );
    arc.geometry.applyMatrix( new THREE.Matrix4( ).makeTranslation( ...args.obj.plane.origin.value ) );
    arc.hash = args.obj.hash
    cb( null, arc )
  },
  Ellipse( args, cb ) {
    let xRadius = args.obj.firstRadius
    let yRadius = args.obj.secondRadius
    let startAngle = args.obj.startAngle
    let endAngle = args.obj.endAngle
    let v1 = new THREE.Vector3( 0, 0, 1 )
    let v2 = new THREE.Vector3( ...args.obj.plane.Normal.value )
    let q = new THREE.Quaternion( )
    q.setFromUnitVectors( v1, v2 )
    let curve = new THREE.EllipseCurve( 0, 0, radius, radius, startAngle, endAngle, false, 0 )
    let points = curve.getPoints( 50 )
    let geometry = new THREE.Geometry( ).setFromPoints( points )
    let arc = new THREE.Line( geometry, args.layer.threeLineMaterial )
    arc.geometry.applyMatrix( new THREE.Matrix4( ).makeRotationFromQuaternion( q ) );
    arc.geometry.applyMatrix( new THREE.Matrix4( ).makeTranslation( ...args.obj.plane.Origin.value ) );
    arc.hash = args.obj.hash
    cb( null, arc )
  },
  Extrusion ( args, cb ) {
    let m = new THREE.Matrix4()
    let mInverse = new THREE.Matrix4()
    let xform = Object.values(args.obj.profileTransformation)
    m.fromArray(xform.slice(0,16))
    m.transpose()
    mInverse = m.clone()
    mInverse.getInverse(m)
    let type = args.obj.profile.type
    let pts = []
    if (type == 'Polyline'){
      this.Polyline( { obj: args.obj.profile, layer: args.layer }, (err,poly) => {
        poly.geometry.applyMatrix(mInverse)
        let values = poly.geometry.vertices
        for(var i = 0, l = values.length; i < l; ++i){
          pts.push(new THREE.Vector2(values[i].x,values[i].y))
        }
      })
    }
    else if (type == 'Arc'){
      this.Arc( { obj: args.obj.profile, layer: args.layer }, (err, arc) => {
        arc.geometry.applyMatrix(mInverse)
        let values = arc.geometry.vertices
        for(var i = 0, l = values.length; i < l; ++i){
          pts.push(new THREE.Vector2(values[i].x,values[i].y))
        }
      })
    }
    else if (type == 'Curve'){
      this.Polyline( { obj: args.obj.profile.displayValue, layer: args.layer }, ( err, poly ) => {
        poly.geometry.applyMatrix(mInverse)
        let values = poly.geometry.vertices
        for(var i = 0, l = values.length; i < l; ++i){
          pts.push(new THREE.Vector2(values[i].x,values[i].y))
        }
      } )
    }
    else {
      console.log('Non-arc:',args.obj)
      let values = args.obj.profile.displayValue.value
      for(var i = 0, l = values.length; i < l; ++i){
        if (i%3 === 0){
          // pts.push([values[i],values[i+1],values[i+2]])
          pts.push(new THREE.Vector2(values[i],values[i+1]))
        }
      }
    }
    let shape = new THREE.Shape(pts)
    for (var i = 1; i < args.obj.profiles.length; i++){
      let holeProfile = null
      let holePts = []
      if (args.obj.profiles[i].type == 'Arc'){
        this.Arc( { obj: args.obj.profiles[i], layer: args.layer }, (err, arc) => {
          holeProfile = arc
        })
      }
      else if (args.obj.profiles[i].type == 'Polyline'){
        this.Polyline( { obj: args.obj.profiles[i], layer: args.layer }, (err, polyline) => {
          holeProfile = polyline
        })
      }
      else {
        console.log(args.obj.profiles[i])
        this.Polyline( { obj: args.obj.profiles[i].displayValue, layer: args.layer }, (err, polyline) => {
          holeProfile = polyline
        })
      }
      holeProfile.geometry.applyMatrix(mInverse)
      console.log('holeProfile:',holeProfile)
      holeProfile.geometry.vertices.forEach( function (vertex) {
        holePts.push(new THREE.Vector2(vertex.x, vertex.y))
      })
      let holePath= new THREE.Path(holePts)
      shape.holes.push(holePath)
    }
    let path = new THREE.LineCurve(args.obj.pathStart, args.obj.pathEnd)
    let extrudePath = new THREE.CurvePath()
    extrudePath.add(path)
    let extrudeSettings = {
      amount: args.obj.length,
      bevelEnabled: false,
    }
    let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.applyMatrix(m)
    let extrusion = new THREE.Mesh(geometry, args.layer.threeMeshMaterial)
    extrusion.hash = args.obj.hash
    console.log('extrusion:',extrusion)
    cb ( null, extrusion )
  },
  Box( args, cb ) {
    let width = args.obj.xSize.end - args.obj.xSize.start
    let height = args.obj.ySize.end - args.obj.ySize.start
    let depth = args.obj.zSize.end - args.obj.zSize.start
    let origin = args.obj.basePlane.Origin.value
    let v1 = new THREE.Vector3( 0, 0, 1 )
    let v2 = new THREE.Vector3( ...args.obj.basePlane.Normal.value )
    let q = new THREE.Quaternion( )
    q.setFromUnitVectors( v1, v2 )
    let geometry = new THREE.BoxGeometry( width, height, depth )
    let box = new THREE.Mesh( geometry, args.layer.threeMeshMaterial )
    box.geometry.applyMatrix( new THREE.Matrix4( ).makeRotationFromQuaternion( q ) )
    box.geometry.applyMatrix( new THREE.Matrix4( ).makeTranslation( ...origin ) )
    box.geometry.verticesNeedUpdate = true
    box.hash = args.obj.hash
    cb( null, box )
  },

  Polyline( args, cb ) {
    let geometry = new THREE.Geometry( )
    if ( !args.obj.value ) return console.warn( 'Strange polyline.' )
    for ( let i = 2; i < args.obj.value.length; i += 3 )
      geometry.vertices.push( new THREE.Vector3( args.obj.value[ i - 2 ], args.obj.value[ i - 1 ], args.obj.value[ i ] ) )
    let polyline = new THREE.Line( geometry, args.layer.threeLineMaterial )
    polyline.hash = args.obj.hash
    cb( null, polyline )
  },
  Polycurve( args, cb ) {
    for ( let i in args.obj.segments ) {
      let segment = args.obj.segments[ i ]
      this.Polyline( { obj: segment.displayValue, layer: args.layer }, ( err, poly ) => {
        if ( err ) return cb( err )
        return cb( null, poly )
      } )
    }
  },
  Annotation( args, cb ) {
    console.warn( 'TODO', args.obj.type )
  },
  Curve( args, cb ) {
    this.Polyline( { obj: args.obj.displayValue, layer: args.layer }, ( err, poly ) => {
      if ( err ) return cb( err )
      return cb( null, poly )
    } )
  },

  Mesh( args, cb ) {
    let obj = args.obj
    let geometry = new THREE.Geometry( )
    for ( let i = 2; i < obj.vertices.length; i += 3 )
      geometry.vertices.push( new THREE.Vector3( obj.vertices[ i - 2 ], obj.vertices[ i - 1 ], obj.vertices[ i ] ) )

    let k = 0
    while ( k < obj.faces.length ) {
      // QUAD FACE
      if ( obj.faces[ k ] === 1 ) {
        geometry.faces.push( new THREE.Face3( obj.faces[ k + 1 ], obj.faces[ k + 2 ], obj.faces[ k + 3 ] ) )
        geometry.faces.push( new THREE.Face3( obj.faces[ k + 1 ], obj.faces[ k + 3 ], obj.faces[ k + 4 ] ) )
        k += 5
      }
      // TRIANGLE FACE
      if ( obj.faces[ k ] === 0 ) {
        geometry.faces.push( new THREE.Face3( obj.faces[ k + 1 ], obj.faces[ k + 2 ], obj.faces[ k + 3 ] ) )
        k += 4
      }
    }

    if ( args.obj.colors ) {
      geometry.faces.forEach( face => {
        let colorA = new THREE.Color( argbToRGB( args.obj.colors[ face.a ] ) )
        face.vertexColors.push( colorA )
        let colorB = new THREE.Color( argbToRGB( args.obj.colors[ face.b ] ) )
        face.vertexColors.push( colorB )
        let colorC = new THREE.Color( argbToRGB( args.obj.colors[ face.c ] ) )
        face.vertexColors.push( colorC )
      } )
    }

    geometry.computeFaceNormals( )
    geometry.computeVertexNormals( )

    let mesh = new THREE.Mesh( geometry, args.layer.threeMeshMaterial )
    mesh.hasVertexColors = false

    if ( args.obj.colors.length > 0 ) {
      mesh.hasVertexColors = true
      mesh.material = args.layer.threeMeshVertexColorsMaterial
    }
    mesh.hash = obj.hash

    return cb( null, mesh )
  },

  Brep( args, cb ) {
    this.Mesh( { layer: args.layer, obj: args.obj.displayValue }, ( err, obj ) => {
      if ( err ) return cb( err, null )
      return cb( null, obj )
    } )
  }
}
