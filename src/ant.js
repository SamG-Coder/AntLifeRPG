import * as T from 'three/webgpu';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {setSegment} from './math.js';
let bodyTemplate;
const shell=new T.MeshStandardMaterial({color:0x3b1b0d,roughness:.34,metalness:.13});
const limbGeometry=new T.CylinderGeometry(.022,.036,1,7);
export async function loadAnt(){
 const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/worker-ant.glb`);gltf.scene.updateMatrixWorld(true);const groups=new Map();
 gltf.scene.traverse(o=>{if(!o.isMesh)return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,geometries:[]});const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);groups.get(key).geometries.push(geometry);});
 bodyTemplate=new T.Group();for(const {material,geometries}of groups.values()){const mesh=new T.Mesh(mergeGeometries(geometries),material);mesh.castShadow=true;mesh.receiveShadow=true;bodyTemplate.add(mesh);}
}
export class Ant{
 constructor(scene,x,z,height){this.root=new T.Group();this.body=bodyTemplate.clone();this.root.add(this.body);scene.add(this.root);this.root.position.set(x,height(x,z),z);this.previous=this.root.position.clone();this.phase=0;this.legs=[];this.height=height;
  for(let side=-1;side<=1;side+=2)for(let i=0;i<3;i++){const hip=new T.Vector3(side*.20,.45,-.28+i*.25);const foot=new T.Vector3(x+side*.73,height(x+side*.73,z)+.025,z-.5+i*.52);const segments=[new T.Mesh(limbGeometry,shell),new T.Mesh(limbGeometry,shell),new T.Mesh(limbGeometry,shell)];for(const m of segments){m.castShadow=true;scene.add(m);}this.legs.push({side,index:i,hip,foot,start:foot.clone(),target:foot.clone(),swing:false,segments,group:(i+(side===1?1:0))%2});}
  this.cargo=new T.Mesh(new T.IcosahedronGeometry(.23,1),new T.MeshStandardMaterial({color:0x987040,roughness:1}));this.cargo.position.set(0,.52,-1.18);this.cargo.visible=false;this.root.add(this.cargo);
 }
 update(x,z,yaw,dt,carrying=false){
  this.root.position.set(x,this.height(x,z),z);this.root.rotation.y=yaw;const travel=this.root.position.distanceTo(this.previous);this.phase+=travel*5.6;this.root.updateMatrixWorld(true);this.cargo.visible=carrying;
  for(const leg of this.legs){const phase=(this.phase+leg.group*Math.PI)%(Math.PI*2);const swing=phase<Math.PI;const moving=travel>.0001;const ideal=new T.Vector3(leg.side*.78,0,-.58+leg.index*.52).applyAxisAngle(new T.Vector3(0,1,0),yaw).add(this.root.position);ideal.y=this.height(ideal.x,ideal.z)+.025;
   if(moving&&swing&&!leg.swing){leg.start.copy(leg.foot);leg.target.copy(ideal).add(new T.Vector3(-Math.sin(yaw)*.32,0,-Math.cos(yaw)*.32));leg.target.y=this.height(leg.target.x,leg.target.z)+.025;}
   if(moving&&swing){const t=phase/Math.PI;leg.foot.lerpVectors(leg.start,leg.target,t*t*(3-2*t));leg.foot.y+=Math.sin(t*Math.PI)*.17;}
   if(leg.foot.distanceTo(ideal)>1.4)leg.foot.copy(ideal);
   leg.swing=moving&&swing;const hip=leg.hip.clone().applyMatrix4(this.root.matrixWorld);const ankle=leg.foot.clone().add(new T.Vector3(0,.065,0));const midpoint=hip.clone().lerp(ankle,.5);const direction=ankle.clone().sub(hip);const bend=new T.Vector3(leg.side*Math.cos(yaw),.9,-leg.side*Math.sin(yaw)).normalize();const length=.57;const offset=Math.sqrt(Math.max(.02,length*length-direction.lengthSq()/4));const knee=midpoint.addScaledVector(bend,offset);
   setSegment(leg.segments[0],hip,knee);setSegment(leg.segments[1],knee,ankle);setSegment(leg.segments[2],ankle,leg.foot);
  }
  this.body.position.y=travel>.0001?Math.sin(this.phase*2)*.012:Math.sin(performance.now()*.0018)*.006;this.previous.copy(this.root.position);
 }
}
