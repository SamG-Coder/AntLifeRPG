import * as T from 'three/webgpu';
import {height,field} from './world.js';
export class CameraRig{
 constructor(camera,canvas){this.camera=camera;this.yaw=.2;this.pitch=.28;this.drag=false;this.first=false;this.distance=5.5;canvas.addEventListener('pointerdown',e=>{this.drag=true;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',()=>this.drag=false);canvas.addEventListener('pointermove',e=>{if(this.drag){this.yaw-=e.movementX*.004;this.pitch=T.MathUtils.clamp(this.pitch+e.movementY*.003,-.35,.85);}});canvas.addEventListener('wheel',e=>{this.distance=T.MathUtils.clamp(this.distance+e.deltaY*.003,2.4,8);},{passive:true});}
 update(player,dt){const target=new T.Vector3(player.x,height(player.x,player.z)+.63,player.z);const forward=new T.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw));let desired;
  if(this.first){desired=target.clone().addScaledVector(forward,.69);desired.y+=.04;this.camera.position.lerp(desired,1-Math.exp(-dt*18));this.camera.lookAt(desired.clone().addScaledVector(forward,6).add(new T.Vector3(0,-Math.sin(this.pitch)*3,0)));}
  else{let d=this.distance;while(d>1.15&&field(target.x+Math.sin(this.yaw)*d,target.z+Math.cos(this.yaw)*d)>-.2)d-=.15;desired=target.clone().add(new T.Vector3(Math.sin(this.yaw)*d,Math.sin(this.pitch)*d+1.1,Math.cos(this.yaw)*d));if(player.z<-5.5&&player.z>-10)desired.y=Math.min(desired.y,2.45);desired.y=Math.max(desired.y,height(desired.x,desired.z)+.32);this.camera.position.lerp(desired,1-Math.exp(-dt*8));this.camera.lookAt(target.clone().addScaledVector(forward,.7));}
 }
}
