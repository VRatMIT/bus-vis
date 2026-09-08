import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { studioEnvironment } from './materials.js';
import { createBus } from './bus.js';

try {
const host=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#e9e9e2');scene.fog=new THREE.Fog('#e9e9e2',30,85);
const pmrem=new THREE.PMREMGenerator(renderer);const env=studioEnvironment();scene.environment=pmrem.fromScene(env,.015).texture;env.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});pmrem.dispose();scene.environmentIntensity=1;
const camera=new THREE.PerspectiveCamera(34,host.clientWidth/host.clientHeight,.1,120);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=5;controls.maxDistance=48;controls.maxPolarAngle=Math.PI*.485;controls.autoRotateSpeed=.7;controls.target.set(0,innerWidth<760?2.1:1.25,0);
const bus=createBus();scene.add(bus);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xe9e9e2,roughness:.92}));floor.rotation.x=-Math.PI/2;floor.position.y=-.006;floor.receiveShadow=true;scene.add(floor);
const sun=new THREE.DirectionalLight(0xfff8ea,2.1);sun.position.set(-3,10,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:6,bottom:-6,near:.5,far:30});sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=4;scene.add(sun);
const fill=new THREE.HemisphereLight(0xe1eefc,0xa4aa91,.75);scene.add(fill);
const ring=new THREE.Mesh(new THREE.RingGeometry(5.45,5.46,128),new THREE.MeshBasicMaterial({color:0x9da99c,transparent:true,opacity:.2,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;scene.add(ring);
const views={hero:{pos:[-11,6.3,12],name:'Front three-quarter'},side:{pos:[0,3.5,17],name:'Driver side'},passenger:{pos:[-5,4,-16],name:'Passenger entry'},rear:{pos:[12,5.4,-10],name:'Rear three-quarter'},top:{pos:[-6,17,7],name:'Roof details'}};
let transition=null;
function selectView(key,instant=false){const v=views[key];const pos=new THREE.Vector3(...v.pos);if(innerWidth<760)pos.multiplyScalar(1.95);transition=instant?null:{from:camera.position.clone(),to:pos,target:controls.target.clone(),time:performance.now()};if(instant){camera.position.copy(pos);controls.target.set(0,innerWidth<760?2.1:1.25,0);controls.update();}document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===key));document.querySelector('#view-name').textContent=v.name;}
selectView('hero',true);
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>selectView(b.dataset.view));
document.querySelector('#reset').onclick=()=>{controls.autoRotate=false;document.querySelector('#rotate').setAttribute('aria-pressed','false');selectView('hero');};
document.querySelector('#rotate').onclick=e=>{controls.autoRotate=!controls.autoRotate;transition=null;e.currentTarget.setAttribute('aria-pressed',String(controls.autoRotate));};
controls.addEventListener('start',()=>{transition=null;document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));document.querySelector('#view-name').textContent='Your perspective';});
document.querySelector('#lighting').onclick=e=>{const dusk=document.body.classList.toggle('dusk');e.currentTarget.setAttribute('aria-pressed',String(dusk));e.currentTarget.querySelector('span').textContent=dusk?'Switch to daylight':'Switch to dusk';scene.background.set(dusk?'#253b40':'#e9e9e2');scene.fog.color.copy(scene.background);floor.material.color.set(dusk?0x253b40:0xe9e9e2);sun.intensity=dusk?.9:2.1;fill.intensity=dusk?.3:.75;renderer.toneMappingExposure=dusk?.9:1.15;};
window.addEventListener('resize',()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);});
const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.1);if(transition){const t=Math.min((performance.now()-transition.time)/950,1);const s=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,s);controls.target.lerpVectors(transition.target,new THREE.Vector3(0,innerWidth<760?2.1:1.25,0),s);if(t===1)transition=null;}controls.update(dt);renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;});
document.querySelector('#loading').remove();
window.__busStudio={scene,camera,controls,renderer,bus};
} catch(error){document.querySelector('#loading')?.remove();document.querySelector('#error').hidden=false;console.error(error);}
