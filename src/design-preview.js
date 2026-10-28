import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createBus } from './bus.js';
import { studioEnvironment } from './materials.js';
import { highlightGeometry } from './panels.js';

const views={side:[0,3.7,12],hero:[-9,4.5,10],passenger:[0,3.7,-12],rear:[12,3.7,0],front:[-12,3.7,0],top:[0,13,.01]};
function normalFor(panel){if(panel.id==='hood'||panel.view==='top')return new T.Vector3(0,1,0);if(panel.view==='rear')return new T.Vector3(1,0,0);if(panel.view==='front')return new T.Vector3(-1,0,0);return new T.Vector3(0,0,panel.view==='passenger'?-1:1);}

// Project onto the actual painted body, including the crowned hood and fenders.
// A small spatial index keeps editing independent of the bus's triangle count.
function surfaceGeometry(panel,bus){
 const origin=new T.Vector3(...panel.map(0,0));
 const u=new T.Vector3(...panel.map(1,0)).sub(origin),v=new T.Vector3(...panel.map(0,1)).sub(origin),normal=normalFor(panel);
 const inverse=new T.Matrix4().makeBasis(u,v,normal).invert();
 const local=p=>p.clone().sub(origin).applyMatrix4(inverse).toArray();
 const bins=new Map(),cell=.18;
 bus.updateMatrixWorld(true);
 bus.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.material.isMeshPhysicalMaterial||!mesh.material.normalMap)return;
  const pos=mesh.geometry.attributes.position,idx=mesh.geometry.index;
  for(let i=0;i<(idx?idx.count:pos.count);i+=3){
   const a=new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(i):i).applyMatrix4(mesh.matrixWorld),b=new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld),c=new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
   if(b.clone().sub(a).cross(c.clone().sub(a)).normalize().dot(normal)<.12)continue;
   const points=[a,b,c].map(local),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),ds=points.map(p=>p[2]);
   if(Math.max(...ds)<-.5||Math.min(...ds)>.4||Math.max(...xs)<0||Math.min(...xs)>panel.w||Math.max(...ys)<0||Math.min(...ys)>panel.h)continue;
   for(let x=Math.max(0,Math.floor(Math.min(...xs)/cell));x<=Math.min(Math.ceil(panel.w/cell),Math.floor(Math.max(...xs)/cell));x++)for(let y=Math.max(0,Math.floor(Math.min(...ys)/cell));y<=Math.min(Math.ceil(panel.h/cell),Math.floor(Math.max(...ys)/cell));y++){
    const key=x+','+y;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(points);
   }
  }
 });
 const base=highlightGeometry(panel),pos=base.attributes.position,idx=base.index,vertices=[],uvs=[];
 function project([x,y]){
  let depth=-Infinity;
  for(const [a,b,c] of bins.get(Math.floor(Math.max(0,x)/cell)+','+Math.floor(Math.max(0,y)/cell))||[]){
   const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-10)continue;
   const p=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,q=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,r=1-p-q;
   if(p>=-1e-6&&q>=-1e-6&&r>=-1e-6)depth=Math.max(depth,p*a[2]+q*b[2]+r*c[2]);
  }
  const world=new T.Vector3(...panel.map(x,y)).addScaledVector(normal,(Number.isFinite(depth)?depth:0)+.007);
  vertices.push(...world.toArray());uvs.push(x/panel.w,1-y/panel.h);
 }
 function subdivide(a,b,c,level=0){
  const lengths=[Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(b[0]-c[0],b[1]-c[1]),Math.hypot(c[0]-a[0],c[1]-a[1])],edge=lengths.indexOf(Math.max(...lengths));
  if(lengths[edge]<.14||level>12){project(a);project(b);project(c);return;}
  if(edge===0){const m=a.map((n,i)=>(n+b[i])/2);subdivide(a,m,c,level+1);subdivide(m,b,c,level+1);}
  else if(edge===1){const m=b.map((n,i)=>(n+c[i])/2);subdivide(a,b,m,level+1);subdivide(a,m,c,level+1);}
  else{const m=c.map((n,i)=>(n+a[i])/2);subdivide(a,b,m,level+1);subdivide(m,b,c,level+1);}
 }
 for(let i=0;i<idx.count;i+=3)subdivide(...[0,1,2].map(j=>local(new T.Vector3().fromBufferAttribute(pos,idx.getX(i+j))).slice(0,2)));
 base.dispose();const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();return geometry;
}

export function createDesignPreview(host){
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,stencil:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;host.append(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#172122');
 const pmrem=new T.PMREMGenerator(renderer),env=studioEnvironment(),envMap=pmrem.fromScene(env,.025).texture;scene.environment=envMap;pmrem.dispose();env.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 const camera=new T.PerspectiveCamera(36,1,.1,100);camera.position.set(-10,5,12);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.5,0);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=60;controls.maxPolarAngle=Math.PI*.49;
 scene.add(new T.HemisphereLight(0xe7f4ff,0x7e968a,2));const light=new T.DirectionalLight(0xfff6e8,2);light.position.set(-4,9,5);scene.add(light);
 const bus=createBus();scene.add(bus);const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:0x172122,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.014;scene.add(floor);
 const grid=new T.GridHelper(30,30,0x36504a,0x263a35);grid.position.y=-.005;grid.material.transparent=true;grid.material.opacity=.4;scene.add(grid);
 const decals=new Map(),geometries=new Map();let active=true,outline=null;
 function fit(){const distance=Math.max(11,14/Math.max(.25,camera.aspect));camera.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);controls.update();}
 const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();fit();};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 renderer.setAnimationLoop(()=>{if(!active||document.hidden)return;controls.update();renderer.render(scene,camera);});
 return {
  scene,camera,renderer,decals,
  focus(panel,connected=[panel]){camera.position.set(...views[panel.view]);controls.target.set(0,1.5,0);fit();if(outline){scene.remove(outline);outline.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
   outline=new T.Group();outline.name='Connected panel outlines';
   for(const p of connected){let geometry=geometries.get(p.id);if(!geometry){geometry=surfaceGeometry(p,bus);geometries.set(p.id,geometry);}
    const line=new T.LineSegments(new T.EdgesGeometry(geometry,60),new T.LineBasicMaterial({color:p.id===panel.id?0xc4f7a0:0x88b4a3,transparent:true,opacity:p.id===panel.id?.6:.24,depthTest:true}));line.renderOrder=4;outline.add(line);
   }scene.add(outline);
  },
  update(panel,canvas){
   let mesh=decals.get(panel.id);
   if(!mesh){
    let geometry=geometries.get(panel.id);if(!geometry){geometry=surfaceGeometry(panel,bus);geometries.set(panel.id,geometry);}
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.025,roughness:.38,metalness:0,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false,stencilWrite:true,stencilRef:1,stencilFunc:T.NotEqualStencilFunc,stencilZPass:T.ReplaceStencilOp}));mesh.name='Design: '+panel.id;mesh.renderOrder=3;scene.add(mesh);decals.set(panel.id,mesh);
   }else{mesh.material.map.image=canvas;mesh.material.map.needsUpdate=true;}
  },
  remove(id){const mesh=decals.get(id);if(!mesh)return;scene.remove(mesh);mesh.material.map.dispose();mesh.material.dispose();decals.delete(id);},
  clear(){for(const mesh of decals.values()){scene.remove(mesh);mesh.material.map.dispose();mesh.material.dispose();}decals.clear();},
  screenshot(){renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');},
  pause(){active=false;},resume(){active=true;resize();},
  dispose(){active=false;renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();this.clear();for(const g of geometries.values())g.dispose();scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material?.normalMap?.dispose();o.material?.dispose();}});envMap.dispose();renderer.dispose();renderer.forceContextLoss();}
 };
}
