import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Metres. X runs from the Ford nose (-X) to the rear; Y is up.
export function createBus(){
 const bus=new T.Group(); bus.name='2016 Ford E-450 · painted exterior';
 const paint=new T.MeshPhysicalMaterial({color:0x095168,metalness:.62,roughness:.22,clearcoat:1,clearcoatRoughness:.12});
 const rubber=new T.MeshStandardMaterial({color:0x161b1d,roughness:.83});
 const trim=new T.MeshStandardMaterial({color:0x202c30,metalness:.3,roughness:.33});
 const chrome=new T.MeshStandardMaterial({color:0xc9d1d4,metalness:.96,roughness:.19});
 const glass=new T.MeshPhysicalMaterial({color:0x10242c,metalness:.45,roughness:.14,clearcoat:1});
 const light=new T.MeshPhysicalMaterial({color:0xe4edf1,metalness:.25,roughness:.2,clearcoat:1});
 const amber=new T.MeshStandardMaterial({color:0xec9b31,emissive:0xae5410,emissiveIntensity:.2,roughness:.25});
 const red=new T.MeshPhysicalMaterial({color:0x9f2025,roughness:.24,clearcoat:1});
 function mesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;bus.add(o);return o;}
 function box(w,h,d,x,y,z,m=paint,r=.025){
  if(d<.08&&w>.25&&h>.2){const s=new T.Shape(),a=-w/2,b=-h/2,q=Math.min(r,w/3,h/3);s.moveTo(a+q,b);s.lineTo(a+w-q,b);s.quadraticCurveTo(a+w,b,a+w,b+q);s.lineTo(a+w,b+h-q);s.quadraticCurveTo(a+w,b+h,a+w-q,b+h);s.lineTo(a+q,b+h);s.quadraticCurveTo(a,b+h,a,b+h-q);s.lineTo(a,b+q);s.quadraticCurveTo(a,b,a+q,b);const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:10});g.translate(0,0,-d/2);return mesh(g,m,x,y,z);}
  if(Math.min(w,h,d)<.025)return mesh(new T.BoxGeometry(w,h,d),m,x,y,z);
  return mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),m,x,y,z);
 }
 function profile(points,depth,z,m=paint,bevel=.025){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:32}),m,0,0,z);}
 function line(points,m=trim,r=.012){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(2,points.length*8),r,8,false),m);}
 function cyl(radius,depth,x,y,z,m=chrome){const o=mesh(new T.CylinderGeometry(radius,radius,depth,48),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
 // Full-width upper coach, rounded roof, and the characteristic over-cab brow.
 box(5.58,1.64,2.43,1.12,2.05,0,paint,.13);
 box(5.67,.23,2.44,1.09,2.91,0,paint,.11);
 profile([[-2.85,2.47],[-2.94,2.7],[-2.89,2.94],[-2.7,3.01],[-1.45,3.01],[-1.43,2.37],[-2.28,2.37]],2.37,-1.185,paint,.065);
 // Lower side panels have actual wheel openings, not tires hidden in a box.
 for(const side of [-1,1]){
  const s=new T.Shape();s.moveTo(-1.66,.53);s.lineTo(1.42,.53);s.lineTo(1.42,.57);s.absarc(2.02,.57,.60,Math.PI,0,true);s.lineTo(2.62,.53);s.lineTo(3.9,.53);s.lineTo(3.9,1.4);s.lineTo(-1.66,1.4);s.closePath();
  mesh(new T.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,bevelSize:.014,bevelThickness:.014,bevelSegments:3,curveSegments:40}),paint,0,0,side>0?1.14:-1.215);
  const arc=[];for(let i=0;i<=48;i++){const a=Math.PI-i*Math.PI/48;arc.push([2.02+.615*Math.cos(a),.57+.615*Math.sin(a),side*1.235]);}line(arc,paint,.035);
  box(5.48,.037,.035,1.12,.87,side*1.247,trim,.008);
  box(5.48,.026,.03,1.12,2.79,side*1.233,paint,.01);
  // Seven sash windows on driver's side, six behind the passenger entrance.
  const centers=side===1?[-1.16,-.42,.32,1.06,1.8,2.54,3.28]:[1.06,1.8,2.54,3.28];
  for(const x of centers){box(.685,1.04,.048,x,2.11,side*1.231,trim,.085);box(.618,.973,.022,x,2.11,side*1.262,glass,.071);box(.62,.018,.018,x,2.355,side*1.279,chrome,.005);box(.62,.021,.023,x,2.337,side*1.282,trim,.003);}
  for(const x of [-1.5,3.58])box(.095,.048,.025,x,.99,side*1.268,amber,.016);
 }
 box(5.55,.16,2.18,1.1,.6,0,trim); // floor and concealed chassis
 box(6.75,.16,.13,.3,.48,.62,rubber);box(6.75,.16,.13,.3,.48,-.62,rubber);
 // Cutaway cab: short hood, sloped A-pillar and recessed door glazing.
 for(const side of [-1,1]){
  const s=new T.Shape();s.moveTo(-3.91,.68);s.lineTo(-3.5,.68);s.absarc(-2.95,.56,.565,Math.PI*.932,0,true);s.lineTo(-2.385,.56);s.lineTo(-1.66,.56);s.lineTo(-1.66,2.32);s.lineTo(-2.26,2.32);s.lineTo(-2.88,1.65);s.lineTo(-3.91,1.45);s.closePath();
  mesh(new T.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:3,curveSegments:40}),paint,0,0,side>0?.94:-1.015);
  profile([[-2.69,1.67],[-2.23,2.23],[-1.79,2.23],[-1.79,1.67]],.025,side>0?1.007:-1.032,trim,.025);
  profile([[-2.61,1.715],[-2.20,2.177],[-1.835,2.177],[-1.835,1.715]],.016,side>0?1.04:-1.056,glass,.012);
  line([[-2.77,1.62,side*1.047],[-2.43,1.57,side*1.047],[-1.76,1.57,side*1.047],[-1.76,.73,side*1.047],[-2.33,.73,side*1.047]],trim,.006);
  box(.055,.145,.028,-1.85,1.44,side*1.056,trim,.015);
  box(.13,.029,.019,-1.87,1.47,side*1.078,chrome,.006);
  box(.63,.08,.28,-1.99,.43,side*1.12,chrome,.035);box(.5,.025,.19,-1.99,.48,side*1.13,rubber);
  line([[-2.32,1.55,side*1.04],[-2.37,1.56,side*1.38],[-2.48,1.77,side*1.43]],trim,.024);
  box(.2,.39,.15,-2.48,1.93,side*1.43,trim,.065);box(.018,.31,.11,-2.369,1.94,side*1.43,chrome,.014);
  box(.22,.065,.018,-2.97,1.53,side*1.061,chrome,.007);
 }
 box(1.19,.36,1.92,-3.32,1.31,0,paint,.1);
 const hood=box(1.15,.095,1.91,-3.32,1.533,0,paint,.044);hood.rotation.z=.1;
 box(.13,.64,1.97,-3.88,1.04,0,paint,.045);
 // Windshield is a single raked surface spanning the cab.
 const windshield=box(.055,.82,1.82,-2.57,1.966,0,trim,.023);windshield.rotation.z=-.72;
 const windglass=box(.023,.727,1.73,-2.6,1.965,0,glass,.011);windglass.rotation.z=-.72;
 box(.71,.12,1.99,-1.99,2.29,0,paint,.05);
 for(const z of [-.48,.4])line([[-2.861,1.695,z-.19],[-2.87,1.721,z],[-2.807,1.795,z+.34]],trim,.01);
 // Ford's rectangular chrome grille and stacked headlamp assemblies.
 box(.075,.65,1.23,-3.969,1.14,0,chrome,.045);box(.024,.54,1.1,-4.011,1.14,0,trim,.03);
 for(let i=0;i<7;i++)box(.02,.015,1.05,-4.03,.923+i*.071,0,chrome,.004);
 for(const y of [.92,1.34])box(.032,.034,1.12,-4.045,y,0,chrome,.006);
 const badge=cyl(.073,.018,-4.069,1.16,0,new T.MeshStandardMaterial({color:0x0b3550,metalness:.4,roughness:.25}));badge.rotation.set(0,0,Math.PI/2);badge.scale.z=1.9;
 for(const side of [-1,1]){box(.06,.54,.35,-3.979,1.13,side*.82,chrome,.035);box(.021,.2,.29,-4.015,1.27,side*.82,light,.02);box(.023,.085,.28,-4.018,1.115,side*.82,amber,.013);box(.02,.145,.29,-4.016,.985,side*.82,light,.018);for(let i=0;i<4;i++)box(.024,.005,.265,-4.03,1.22+i*.032,side*.82,chrome,.001);}
 box(.21,.18,2.08,-3.96,.722,0,chrome,.055);box(.16,.15,1.94,-3.955,.558,0,trim,.025);
 box(.025,.15,.31,-4.079,.693,0,light,.009);
 // Wheels, dual rear tires, steel hubs, circular vents and eight lugs.
 for(const x of [-2.95,2.02])for(const side of [-1,1]){
  const z=side*(x<0?1.005:1.115); cyl(.551,.035,x,.55,z-side*.17,rubber);
  const tire=mesh(new T.TorusGeometry(.351,.125,20,64),rubber,x,.481,z);tire.scale.z=1.2;
  if(x>0)mesh(new T.TorusGeometry(.351,.125,16,64),rubber,x,.481,z-side*.25);
  cyl(.279,.18,x,.481,z,chrome);cyl(.221,.185,x,.481,z,trim);cyl(.184,.204,x,.481,z,chrome);cyl(.095,.235,x,.481,z,chrome);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(.033,.012,x+Math.sin(a)*.22,.481+Math.cos(a)*.22,z+side*.098,trim);cyl(.018,.017,x+Math.sin(a)*.127,.481+Math.cos(a)*.127,z+side*.118,chrome);}
  for(let i=0;i<52;i++){const a=i*Math.PI*2/52;const t=box(.028,.006,.19,x+Math.sin(a)*.475,.481+Math.cos(a)*.475,z,rubber,.002);t.rotation.z=-a;}
  box(.28,.24,.025,x+.48,.34,side*1.07,rubber,.01);
 }
 // Passenger lift doors and destination panel, matched to the walkaround video.
 box(1.37,2.12,.036,.03,1.67,-1.25,trim,.018);
 for(const x of [-.31,.37]){box(.653,2.065,.023,x,1.67,-1.277,paint,.012);box(.44,.82,.021,x,2.1,-1.294,trim,.085);box(.392,.765,.018,x,2.1,-1.31,glass,.07);box(.1,.06,.026,x,1.12,-1.31,chrome,.014);}
 box(.56,.33,.025,-.03,.72,-1.29,paint,.022);
 box(1.34,.2,.032,1.45,2.715,-1.238,trim,.055);box(1.26,.14,.02,1.45,2.715,-1.258,glass,.044);
 // Passenger entry and rear emergency exit.
 box(.73,1.93,.046,-1.16,1.52,-1.244,trim,.04);
 for(const x of [-1.34,-.98]){box(.321,1.78,.025,x,1.55,-1.279,paint,.014);box(.268,1.25,.02,x,1.78,-1.297,glass,.035);box(.21,.018,.035,x,.87,-1.314,chrome,.004);}
 box(.67,.055,.2,-1.16,.5,-1.28,chrome,.014);
 box(.08,.86,2.4,3.891,.92,0,paint,.035);
 box(.045,2.05,.92,3.948,1.67,0,trim,.025);box(.025,1.995,.86,3.978,1.67,0,paint,.018);
 function rearWindow(y,z,w,h){const a=box(w,h,.045,0,0,0,trim,.075);a.rotation.y=Math.PI/2;a.position.set(4.002,y,z);const b=box(w-.065,h-.065,.026,0,0,0,glass,.06);b.rotation.y=Math.PI/2;b.position.set(4.032,y,z);}
 rearWindow(2.17,0,.74,.75);rearWindow(1.14,0,.73,.34);
 for(const side of [-1,1]){rearWindow(2.2,side*.825,.55,.91);for(const z of [.75,.98]){const o=cyl(.079,.028,3.985,.91,side*z,red);o.rotation.set(0,0,Math.PI/2);}const o=cyl(.084,.023,3.986,.68,side*.84,light);o.rotation.set(0,0,Math.PI/2);box(.06,.042,.13,3.944,2.75,side*.95,red,.012);}
 box(.05,.037,.14,4.009,1.46,-.34,chrome,.007);
 box(.16,.15,2.5,3.94,.48,0,trim,.03);
 for(const z of [-.32,0,.32]){box(.055,.04,.1,3.96,2.85,z,red,.013);box(.07,.04,.1,-2.966,2.86,z,amber,.014);}
 box(.045,.26,1.18,-3.016,2.718,0,trim,.03);box(.022,.2,1.05,-3.045,2.718,0,glass,.02);
 box(1.06,.17,.85,2.37,3.09,0,paint,.075);box(.7,.028,.65,2.37,3.19,0,trim,.024);
 for(let i=0;i<9;i++)box(.045,.02,.59,2.08+i*.073,3.208,0,paint,.006);
 box(.54,.047,.54,.2,3.055,0,paint,.023);
 box(.16,.23,.025,2.93,.99,1.262,trim,.025);
 // Static parts share a draw call per material for smooth orbiting on mobile.
 const batches=new Map();for(const part of [...bus.children]){part.updateMatrix();const g=(part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrix);if(!batches.has(part.material))batches.set(part.material,[]);batches.get(part.material).push(g);part.geometry.dispose();bus.remove(part);}
 for(const [material,parts] of batches){const merged=mergeGeometries(parts);const part=new T.Mesh(merged,material);part.castShadow=true;part.receiveShadow=true;bus.add(part);parts.forEach(g=>g.dispose());}
 return bus;
}
