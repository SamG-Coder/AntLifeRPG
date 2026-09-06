import * as T from 'three/webgpu';
export function random(seed=417){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function capsuleBetween(a,b,r,material){const mesh=new T.Mesh(new T.CylinderGeometry(r*.68,r,a.distanceTo(b),7),material);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());mesh.castShadow=true;return mesh;}
export function setSegment(mesh,a,b){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());}
