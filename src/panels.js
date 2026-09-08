import * as THREE from 'three';

// Planning geometry in metres, referenced to the same X/Y/Z dimensions as bus.js.
// Curved caps and hood are projected templates, not developable fabrication patterns.
export const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
export function rounded(x,y,w,h,r=.07){const p=[];for(const [cx,cy,a] of [[x+w-r,y+r,-Math.PI/2],[x+w-r,y+h-r,0],[x+r,y+h-r,Math.PI/2],[x+r,y+r,Math.PI]])for(let i=0;i<=8;i++){const t=a+i*Math.PI/16;p.push([cx+Math.cos(t)*r,cy+Math.sin(t)*r]);}return p;}
const panels=[];
function add(id,name,w,h,at,map,outer=rect(0,0,w,h),holes=[],view='side',note=''){panels.push({id,name,w,h,at,map,outer,holes,view,note});}
const sideMap=(x,top,z)=>(u,v)=>[x+u,top-v,z];
const windows=(xs,x0,top)=>xs.map(x=>rounded(x-.3425-x0,top-2.63,.685,1.04,.085));
// The roof joins both complete coach elevations at a consistent metre scale.
const sideX=.3,driverY=.3,roofY=2.59,entryY=5.06;
function archOutline(w,h,center,r){const p=[[0,0],[w,0],[w,h],[center+r,h],[center+r,h-.04]];for(let i=0;i<=40;i++){const a=i*Math.PI/40;p.push([center+r*Math.cos(a),h-.04-r*Math.sin(a)]);}p.push([center-r,h],[0,h]);return p;}
add('driver-coach','Driver side · window surround',5.56,1.38,[sideX,driverY],sideMap(-1.66,2.78,1.284),undefined,windows([-1.16,-.42,.32,1.06,1.8,2.54,3.28],-1.66,2.78));
add('driver-skirt-front','Driver side · forward skirt',3.08,.87,[sideX,driverY+1.38],sideMap(-1.66,1.4,1.265));
add('driver-wheel-arch','Driver side · wheel arch',1.2,.87,[sideX+3.08,driverY+1.38],sideMap(1.42,1.4,1.272),archOutline(1.2,.87,.6,.6));
add('driver-skirt-rear','Driver side · rear skirt',1.28,.87,[sideX+4.28,driverY+1.38],sideMap(2.62,1.4,1.27),undefined,[rounded(.23,.295,.16,.23,.025)]);
add('roof','Coach roof',5.56,2.43,[sideX,roofY],(u,v)=>[-1.66+u,3.075,1.215-v],rounded(0,0,5.56,2.43,.12),[rounded(1.59,.945,.54,.54,.023),rounded(3.5,.79,1.06,.85,.075)],'top','Projected roof; equipment footprints are excluded.');
// Passenger shell is cut around the discrete entry and lift-door leaves.
const passengerOuter=archOutline(5.56,2.25,3.68,.6);
const passengerHoles=[...windows([1.06,1.8,2.54,3.28],-1.66,2.78),rect(.135,.295,.73,1.93),rect(1.005,.05,1.37,2.12),rounded(2.44,-.035,1.34,.2,.04)];
// Destination panel is an edge cut, represented by a notch instead of an out-of-bounds hole.
passengerHoles.pop();
passengerOuter.splice(1,0,[2.44,0],[2.44,.13],[3.78,.13],[3.78,0]);
add('passenger-coach','Entry side · coach shell',5.56,2.25,[sideX,entryY],sideMap(-1.66,2.78,-1.285),passengerOuter,passengerHoles,'passenger');
for(const [n,x] of [[1,-1.34],[2,-.98]])add('entry-'+n,'Entry door · '+(n===1?'front leaf':'rear leaf'),.321,1.78,[sideX+x-.1605+1.66,entryY+2.78-2.44],sideMap(x-.1605,2.44,-1.321),undefined,[rounded(.0265,.035,.268,1.25,.035)],'passenger');
for(const [n,x] of [[1,-.31],[2,.37]])add('lift-'+n,'Lift door · '+(n===1?'front leaf':'rear leaf'),.653,2.065,[sideX+x-.3265+1.66,entryY+.0775],sideMap(x-.3265,2.7025,-1.338),undefined,[rounded(.1065,.1925,.44,.82,.085)],'passenger');
// Cab side parts flank the hood as a compact unfolded group.
const cabY=7.7;
for(const [side,at] of [[1,.3],[-1,3.82]]){
 const prefix=side===1?'driver':'passenger',view=side===1?'hero':'passenger';
 const doorOuter=[[.59,0],[1.23,0],[1.23,1.76],[.56,1.76],[.56,1.16],[.18,.70],[0,.68]];
 add(prefix+'-cab-door',(side===1?'Driver':'Passenger')+' cab door',1.23,1.76,[at+1.02,cabY],sideMap(-2.89,2.32,side*1.075),doorOuter,[[[.2,.65],[.66,.09],[1.10,.09],[1.10,.65]]],view,'Door outline follows the cab silhouette; verify curved edge allowances.');
 const fender=[[0,.20],[1.03,0],[1.525,.55],[1.525,1.09]];
 for(let i=0;i<=40;i++){const a=i*Math.PI/40;fender.push([.96+.565*Math.cos(a),1.09-.565*Math.sin(a)]);}fender.push([0,1.09]);
 add(prefix+'-fender',(side===1?'Driver':'Passenger')+' front fender',1.525,1.09,[at,cabY+.67],sideMap(-3.91,1.65,side*1.10),fender,[],view,'Projected curved fender; not a flat-cut template.');
}
add('hood','Hood',1.185,1.92,[2.6,cabY],(u,v)=>[-3.965+u,1.60+.15*u/1.185,(v-.96)],[[0,.08],[.12,0],[1.185,0],[1.185,1.92],[.12,1.92],[0,1.84]],[],'hero','Projected curved hood. Allow for crown and edge returns.');
add('cab-roof','Cab roof',.71,1.99,[2.83,9.67],(u,v)=>[-2.345+u,2.375,v-.995],rounded(0,0,.71,1.99,.045),[],'top','Partially covered by the coach overhang.');
// Rear elevation: central emergency door plus its surrounding painted shell.
const rearAt=[.3,9.76],rearMap=(u,v)=>[4.055,2.78-v,u-1.215];
const rearHoles=[rect(.755,.085,.92,2.05),rounded(.115,.125,.55,.91,.075),rounded(1.765,.125,.55,.91,.075)];
for(const z of [-.98,-.75,.75,.98])rearHoles.push(rounded(z+1.215-.079,1.791,.158,.158,.079));
for(const z of [-.84,.84])rearHoles.push(rounded(z+1.215-.084,2.016,.168,.168,.084));
add('rear-shell','Rear body surround',2.43,2.25,rearAt,rearMap,rounded(0,0,2.43,2.25,.06),rearHoles,'rear');
add('rear-door','Rear emergency door',.86,1.995,[rearAt[0]+.785,rearAt[1]+.1125],(u,v)=>[4.073,2.6675-v,u-.43],undefined,[rounded(.06,.1225,.74,.75,.075),rounded(.065,1.3575,.73,.34,.06)],'rear');
add('brow-front','Over-cab cap · front',2.05,.32,[3.7,9.76],(u,v)=>[-3.157,2.86-v,u-1.025],rounded(0,0,2.05,.32,.09),[rounded(.435,.012,1.18,.26,.03)],'front','Projected curved cap; destination display excluded.');
add('brow-roof','Over-cab cap · top',1.425,2.43,[3.7,10.14],(u,v)=>[-3.085+u,3.065,v-1.215],rounded(0,0,1.425,2.43,.13),[],'top','Projected cap surface; its compound curves need stretch allowances.');
for(const [side,x] of [[1,.3],[-1,1.85]])add('brow-'+(side===1?'driver':'passenger'),'Over-cab cap · '+(side===1?'driver side':'entry side'),1.425,.64,[x,12.66],sideMap(-3.085,3.025,side*1.25),rounded(0,0,1.425,.64,.13),[],side===1?'hero':'passenger','Projected curved cap side.');
add('front-header','Front grille surround',1.97,.64,[3.5,12.66],(u,v)=>[-4.065,1.36-v,u-.985],[[0,.5],[.35,.5],[.35,0],[.37,0],[.37,.565],[1.6,.565],[1.6,0],[1.62,0],[1.62,.5],[1.97,.5],[1.97,.64],[0,.64]],[],'front','Painted front surround; grille and lamps excluded.');
// Templates face outward: reflect contours and their world map together so
// the 2D orientation changes without moving the corresponding 3D highlight.
function reflect(panel,axis){
 const map=panel.map,flip=([u,v])=>axis==='x'?[panel.w-u,v]:[u,panel.h-v];
 panel.outer=panel.outer.map(flip);panel.holes=panel.holes.map(h=>h.map(flip));
 panel.map=(u,v)=>map(...flip([u,v]));
}
for(const panel of panels){
 if(panel.view==='passenger'){
  reflect(panel,'x');
  // Mirror nested leaves with their shell, and the cab as one assembly.
  const group=panel.id==='passenger-coach'||/^(entry|lift)-/.test(panel.id)?[sideX,5.56]:
   /^passenger-(cab-door|fender)$/.test(panel.id)?[3.82,2.25]:null;
  if(group)panel.at[0]=group[0]+group[1]-(panel.at[0]-group[0])-panel.w;
 }
 if(panel.view==='rear')reflect(panel,'x');
 if(panel.id==='roof')reflect(panel,'y');
}
export const PANELS=panels;
export const SHEET={width:6.35,height:13.58};
export function pathData(panel){return [panel.outer,...panel.holes].map(p=>'M'+p.map(([x,y])=>`${x.toFixed(4)},${y.toFixed(4)}`).join('L')+'Z').join('');}
export function highlightGeometry(panel){const shape=new THREE.Shape(panel.outer.map(p=>new THREE.Vector2(...p)));shape.holes=panel.holes.map(h=>new THREE.Path(h.map(p=>new THREE.Vector2(...p))));const geometry=new THREE.ShapeGeometry(shape);const a=geometry.attributes.position;for(let i=0;i<a.count;i++){const p=panel.map(a.getX(i),a.getY(i));a.setXYZ(i,...p);}geometry.computeVertexNormals();return geometry;}
