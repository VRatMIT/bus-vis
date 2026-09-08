import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { studioEnvironment } from './materials.js';
import { createBus } from './bus.js';
import { createFloorGrid } from './floor-grid.js';

try {
const host=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#111619');scene.fog=new THREE.Fog('#111619',30,85);
const pmrem=new THREE.PMREMGenerator(renderer);const env=studioEnvironment();scene.environment=pmrem.fromScene(env,.015).texture;env.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});pmrem.dispose();scene.environmentIntensity=1;
const camera=new THREE.PerspectiveCamera(34,host.clientWidth/host.clientHeight,.1,120);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=5;controls.maxDistance=48;controls.maxPolarAngle=Math.PI*.485;controls.autoRotateSpeed=.7;controls.target.set(0,innerWidth<760?1.85:1.25,0);
const bus=createBus();scene.add(bus);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x111619,roughness:.92}));floor.rotation.x=-Math.PI/2;floor.position.y=-.006;floor.receiveShadow=true;scene.add(floor);
const sun=new THREE.DirectionalLight(0xfff8ea,2.1);sun.position.set(-3,10,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:6,bottom:-6,near:.5,far:30});sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=4;scene.add(sun);
const fill=new THREE.HemisphereLight(0xe1eefc,0xa4aa91,.75);scene.add(fill);
const floorGrid=createFloorGrid();scene.add(floorGrid.mesh);
const views={hero:{pos:[-11,6.3,12],name:'Front three-quarter'},side:{pos:[0,3.5,17],name:'Driver side'},passenger:{pos:[-5,4,-16],name:'Passenger entry'},rear:{pos:[12,5.4,-10],name:'Rear three-quarter'},top:{pos:[-6,17,7],name:'Roof details'}};
let transition=null;
function selectView(key,instant=false){const v=views[key];const pos=new THREE.Vector3(...v.pos);if(innerWidth<760)pos.multiplyScalar(1.95);transition=instant?null:{from:camera.position.clone(),to:pos,target:controls.target.clone(),time:performance.now()};if(instant){camera.position.copy(pos);controls.target.set(0,innerWidth<760?2.1:1.25,0);controls.update();}document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===key));}
selectView('hero',true);
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>selectView(b.dataset.view));
document.querySelector('#reset').onclick=()=>{controls.autoRotate=false;document.querySelector('#rotate').setAttribute('aria-pressed','false');selectView('hero');};
document.querySelector('#rotate').onclick=e=>{controls.autoRotate=!controls.autoRotate;transition=null;e.currentTarget.setAttribute('aria-pressed',String(controls.autoRotate));};
controls.addEventListener('start',()=>{transition=null;document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));});
window.addEventListener('resize',()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);});
const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.1);if(transition){const t=Math.min((performance.now()-transition.time)/950,1);const s=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,s);controls.target.lerpVectors(transition.target,new THREE.Vector3(0,innerWidth<760?2.1:1.25,0),s);if(t===1)transition=null;}controls.update(dt);floorGrid.update(clock.elapsedTime);renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;});
document.querySelector('#loading').remove();
window.__busStudio={scene,camera,controls,renderer,bus,floorGrid};
} catch(error){document.querySelector('#loading')?.remove();document.querySelector('#error').hidden=false;console.error(error);}
