import * as THREE             from 'three'

export default ( args ) => {
  if( !args ) return console.error( 'Can\'t create default layer material object without streamid and layer guid.' )
  return {
    color: { hex: '#B3B3B3', a: 1 },
    visible: true,
    smooth: true,
    shininess: 5,
    linewidth: 2,
    pointsize: 3,
    type: 'default',
    guid: args.guid,
    streamId: args.streamId,
    showEdges: true,
    wireframe: false,
    vertexColors: false,
    threeMeshMaterial: new THREE.MeshPhongMaterial( {
      color: new THREE.Color('#B4B8B9'),
      specular: new THREE.Color('#FFECB3'),
      shininess: 30,
      side: THREE.DoubleSide,
      transparent: true,
      shading: THREE.SmoothShading,
      wireframe: false,
      vertexColors: false
    } ),
    threeMeshVertexColorsMaterial: new THREE.MeshPhongMaterial( {
      color: new THREE.Color('#B4B8B9'),
      specular: new THREE.Color('#FFECB3'),
      shininess: 30,
      side: THREE.DoubleSide,
      transparent: true,
      shading: THREE.SmoothShading,
      wireframe: false,
      vertexColors: true
    } ),
    threeLineMaterial: new THREE.LineBasicMaterial( { 
      color : new THREE.Color("#B4B8B9"), 
      linewidth: 1 
    } ),
    threeEdgesMaterial: new THREE.LineBasicMaterial( { 
      color : new THREE.Color("#FFFFFF"), 
      linewidth: 1
    } ),
    threePointMaterial: new THREE.PointsMaterial( { 
      color: new THREE.Color("#B4B8B9"), 
      sizeAttenuation: false, 
      transparent: true,
      size: 3
    } )
  }
}