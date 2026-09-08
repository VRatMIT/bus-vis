import * as T from 'three';
import { loft, surface, labelMaterial } from './sculpt.js';
import { materials } from './materials.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Metres. X runs from the Ford nose (-X) to the rear; Y is up.
export function createBus(){
 const bus=new T.Group(); bus.name='2016 Ford E-450 · painted exterior';
 const {paint,rubber,trim,chrome,glass,light,amber,red}=materials();
 function mesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;bus.add(o);return o;}
 function box(w,h,d,x,y,z,m=paint,r=.025){
  if(d<.08&&w>.25&&h>.2){const s=new T.Shape(),a=-w/2,b=-h/2,q=Math.min(r,w/3,h/3);s.moveTo(a+q,b);s.lineTo(a+w-q,b);s.quadraticCurveTo(a+w,b,a+w,b+q);s.lineTo(a+w,b+h-q);s.quadraticCurveTo(a+w,b+h,a+w-q,b+h);s.lineTo(a+q,b+h);s.quadraticCurveTo(a,b+h,a,b+h-q);s.lineTo(a,b+q);s.quadraticCurveTo(a,b,a+q,b);const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:10});g.translate(0,0,-d/2);return mesh(g,m,x,y,z);}
  if(Math.min(w,h,d)<.025)return mesh(new T.BoxGeometry(w,h,d),m,x,y,z);
  return mesh(new RoundedBoxGeometry(w,h,d,6,Math.min(r,w/3,h/3,d/3)),m,x,y,z);
 }
 function profile(points,depth,z,m=paint,bevel=.025){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:32}),m,0,0,z);}
 function line(points,m=trim,r=.012){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(2,points.length*8),r,8,false),m);}
 function cyl(radius,depth,x,y,z,m=chrome){const o=mesh(new T.CylinderGeometry(radius,radius,depth,48),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
 // Full-width upper coach, rounded roof, and the characteristic over-cab brow.
 box(5.58,1.64,2.43,1.12,2.05,0,paint,.13);
 mesh(loft([[-1.74,1.13,2.72,2.985],[-1.57,1.225,2.72,3.035],[.2,1.225,2.72,3.05],[2.9,1.225,2.72,3.05],[3.72,1.205,2.73,3.015],[3.925,1.11,2.77,2.94]],.48),paint);
 mesh(loft([[-3.085,1.025,2.54,2.86],[-3.025,1.15,2.46,2.95],[-2.88,1.22,2.39,3.015],[-2.47,1.225,2.37,3.04],[-1.74,1.225,2.41,3.035],[-1.57,1.225,2.52,3.035]],.45),paint);
 // Lower side panels have actual wheel openings, not tires hidden in a box.
 for(const side of [-1,1]){
  const s=new T.Shape();s.moveTo(-1.66,.53);s.lineTo(1.42,.53);s.lineTo(1.42,.57);s.absarc(2.02,.57,.60,Math.PI,0,true);s.lineTo(2.62,.53);s.lineTo(3.9,.53);s.lineTo(3.9,1.4);s.lineTo(-1.66,1.4);s.closePath();
  mesh(new T.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,bevelSize:.014,bevelThickness:.014,bevelSegments:3,curveSegments:40}),paint,0,0,side>0?1.14:-1.215);
  const arc=[];for(let i=0;i<=48;i++){const a=Math.PI-i*Math.PI/48;arc.push([2.02+.615*Math.cos(a),.57+.615*Math.sin(a),side*1.235]);}line(arc,paint,.035);
  box(3.08,.037,.035,-.08,.87,side*1.247,trim,.008);box(1.23,.037,.035,3.245,.87,side*1.247,trim,.008);
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
 mesh(loft([[-3.965,.88,1.235,1.48],[-3.87,.969,1.20,1.54],[-3.49,1.005,1.22,1.60],[-2.99,1.015,1.28,1.675],[-2.78,.963,1.36,1.69]],.48,56),paint);
 for(const side of [-1,1]){
  line([[-3.89,1.492,side*.72],[-3.55,1.583,side*.75],[-3.16,1.654,side*.77],[-2.84,1.68,side*.79]],trim,.004);
  // Broad flared fender lip blends into the pressed cab panel.
  mesh(surface((u,v)=>{const a=.03+u*(Math.PI-.06),rad=.565+v*.12;return [-2.95+Math.cos(a)*rad,.56+Math.sin(a)*rad,side*(1.017+.055*Math.sin(v*Math.PI))];},64,10),paint).material.side=T.DoubleSide;
 }
 box(.13,.64,1.97,-3.88,1.04,0,paint,.045);
 // Windshield is a single raked surface spanning the cab.
 const screen=(u,v,offset=0)=>{const z=(u*2-1)*(.94-v*.065);return [-2.925+v*.665+.074*Math.pow(z/.94,2)+offset,1.652+v*.642,z];};
 mesh(surface((u,v)=>screen(u,v),48,28),trim);
 mesh(surface((u,v)=>screen(.024+u*.952,.034+v*.932,-.014),48,28),glass);
 box(.71,.12,1.99,-1.99,2.29,0,paint,.05);
 for(const z of [-.44,.4]){line([[-2.91,1.685,z-.18],[-2.869,1.74,z],[-2.86,1.755,z+.31]],trim,.011);line([[-2.875,1.752,z-.1],[-2.861,1.763,z+.35]],rubber,.015);}
 box(.17,.035,1.7,-2.83,1.67,0,trim,.012);
 for(let i=0;i<36;i++)box(.1,.01,.013,-2.835,1.69,-.77+i*.044,rubber,.003);
 // Ford's rectangular chrome grille and stacked headlamp assemblies.
 box(.075,.65,1.23,-3.969,1.14,0,chrome,.045);box(.024,.54,1.1,-4.011,1.14,0,trim,.03);
 for(let i=0;i<7;i++)box(.02,.015,1.05,-4.03,.923+i*.071,0,chrome,.004);
 for(const y of [.92,1.34])box(.032,.034,1.12,-4.045,y,0,chrome,.006);
 const badge=cyl(.073,.018,-4.069,1.16,0,new T.MeshStandardMaterial({color:0x0b3550,metalness:.4,roughness:.25}));badge.rotation.set(0,0,Math.PI/2);badge.scale.z=1.9;
 for(const side of [-1,1]){box(.06,.54,.35,-3.979,1.13,side*.82,chrome,.035);box(.021,.2,.29,-4.015,1.27,side*.82,light,.02);box(.023,.085,.28,-4.018,1.115,side*.82,amber,.013);box(.02,.145,.29,-4.016,.985,side*.82,light,.018);for(let i=0;i<4;i++)box(.024,.005,.265,-4.03,1.22+i*.032,side*.82,chrome,.001);}
 mesh(loft([[-4.095,.89,.64,.82],[-4.055,1.01,.62,.84],[-3.95,1.055,.63,.84],[-3.82,1.035,.65,.81]],.48,24),chrome);box(.16,.15,1.94,-3.955,.558,0,trim,.025);
 box(.025,.15,.31,-4.079,.693,0,light,.009);
 // Wheels, dual rear tires, steel hubs, circular vents and eight lugs.
 for(const x of [-2.95,2.02])for(const side of [-1,1]){
  const z=side*(x<0?1.005:1.115); cyl(.551,.035,x,.55,z-side*.17,rubber);
  const tire=mesh(new T.TorusGeometry(.351,.125,20,64),rubber,x,.481,z);tire.scale.z=1.2;
  if(x>0)mesh(new T.TorusGeometry(.351,.125,16,64),rubber,x,.481,z-side*.25);
  cyl(.277,.17,x,.481,z,trim);
  const rimProfile=[[.092,.035],[.11,.049],[.17,.044],[.225,.083],[.249,.105],[.265,.113],[.278,.103],[.281,.088]].map(p=>new T.Vector2(...p));
  const rim=mesh(new T.LatheGeometry(rimProfile.reverse(),72),chrome,x,.481,z);rim.rotation.x=side*Math.PI/2;
  for(const radius of [.272,.252]){const lip=mesh(new T.TorusGeometry(radius,.008,8,72),chrome,x,.481,z+side*.101);}
  cyl(.098,.224,x,.481,z,chrome);const hub=mesh(new T.SphereGeometry(.094,32,16),chrome,x,.481,z+side*.115);hub.scale.z=.55;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(.033,.012,x+Math.sin(a)*.22,.481+Math.cos(a)*.22,z+side*.098,trim);cyl(.018,.017,x+Math.sin(a)*.127,.481+Math.cos(a)*.127,z+side*.118,chrome);}
  for(let i=0;i<64;i++){const a=i*Math.PI*2/64;for(const lane of [-1,1]){const t=box(.034,.009,.07,x+Math.sin(a)*.476,.481+Math.cos(a)*.476,z+lane*.052,rubber,.002);t.rotation.z=-a;t.rotation.y=lane*.2;}}
  for(const radius of [.322,.427])mesh(new T.TorusGeometry(radius,.0028,6,72),rubber,x,.481,z+side*.121);
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
 function rearWindow(y,z,w,h){const a=box(w,h,.045,0,0,0,trim,.075);a.rotation.y=Math.PI/2;a.position.set(3.958,y,z);const b=box(w-.065,h-.065,.026,0,0,0,glass,.06);b.rotation.y=Math.PI/2;b.position.set(3.985,y,z);}
 rearWindow(2.17,0,.74,.75);rearWindow(1.14,0,.73,.34);
 for(const side of [-1,1]){rearWindow(2.2,side*.825,.55,.91);for(const z of [.75,.98]){const o=cyl(.079,.028,3.985,.91,side*z,red);o.rotation.set(0,0,Math.PI/2);}const o=cyl(.084,.023,3.986,.68,side*.84,light);o.rotation.set(0,0,Math.PI/2);box(.06,.042,.13,3.944,2.75,side*.95,red,.012);}
 box(.05,.037,.14,4.009,1.46,-.34,chrome,.007);
 box(.16,.15,2.5,3.94,.48,0,trim,.03);
 for(const z of [-.32,0,.32]){box(.055,.04,.1,3.96,2.85,z,red,.013);box(.07,.04,.1,-3.09,2.86,z,amber,.014);}
 box(.045,.26,1.18,-3.112,2.718,0,trim,.03);box(.022,.2,1.05,-3.14,2.718,0,glass,.02);
 box(1.06,.17,.85,2.37,3.09,0,paint,.075);box(.7,.028,.65,2.37,3.19,0,trim,.024);
 for(let i=0;i<9;i++)box(.045,.02,.59,2.08+i*.073,3.208,0,paint,.006);
 box(.54,.047,.54,.2,3.055,0,paint,.023);
 box(.16,.23,.025,2.93,.99,1.262,trim,.025);

 // Fine exterior hardware remains readable when inspecting close-up.
 for(const side of [-1,1]){
  for(const x of [-1.52,3.72])for(const y of [.65,1.04,1.46,2.66])cyl(.009,.008,x,y,side*1.24,chrome);
  for(const x of side===1?[-1.16,-.42,.32,1.06,1.8,2.54,3.28]:[1.06,1.8,2.54,3.28]){
   box(.1,.027,.015,x+.2,2.34,side*1.286,trim,.004);
   for(const dx of [-.28,.28])cyl(.006,.006,x+dx,1.67,side*1.288,chrome);
  }
  for(let i=0;i<7;i++)box(.48,.008,.009,-2.0,.497,side*(1.05+i*.02),rubber,.002);
  const badge=mesh(new T.PlaneGeometry(.22,.044),labelMaterial('E450'),-2.97,1.535,side*1.074);if(side<0)badge.rotation.y=Math.PI;
 }
 for(const x of [-.615,.695])for(const y of [.92,1.57,2.43]){box(.042,.115,.035,x,y,-1.306,chrome,.012);box(.008,.083,.042,x,y,-1.326,trim,.003);}
 for(const y of [1.0,1.74,2.48]){box(.06,.1,.045,4.012,y,.444,chrome,.013);}
 // Round lenses have individual reflector elements behind their clear faces.
 for(const side of [-1,1])for(const z of [.75,.98])for(let j=0;j<3;j++)for(let i=0;i<3;i++){const o=cyl(.01,.007,4.003,.884+j*.025,side*z+(i-1)*.025,red);o.rotation.set(0,0,Math.PI/2);}
 const ford=mesh(new T.PlaneGeometry(.19,.068),labelMaterial('Ford',{italic:true}),-4.082,1.16,0);ford.rotation.y=-Math.PI/2;
 for(const side of [-1,1]){line([[-3.94,.54,side*.59],[-3.97,.49,side*.59],[-4.01,.49,side*.59]],trim,.022);}
 // Roof vent flange, fasteners, weather seals, and rear bumper ribs.
 for(const x of [1.88,2.86])for(const z of [-.36,.36]){const screw=cyl(.012,.008,x,3.105,z,chrome);screw.rotation.x=0;}
 for(const y of [.445,.49,.535])box(.012,.008,2.38,4.025,y,0,rubber,.002);

 // Static parts share a draw call per material for smooth orbiting on mobile.
 const batches=new Map();for(const part of [...bus.children]){part.updateMatrix();const g=(part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrix);if(!batches.has(part.material))batches.set(part.material,[]);batches.get(part.material).push(g);part.geometry.dispose();bus.remove(part);}
 for(const [material,parts] of batches){const merged=mergeGeometries(parts);const part=new T.Mesh(merged,material);part.castShadow=true;part.receiveShadow=true;bus.add(part);parts.forEach(g=>g.dispose());}
 return bus;
}
