import assert from 'node:assert/strict';
import { PANELS } from './src/panels.js';
import { PLACEMENTS, BELT_PERIOD, localToWrap, panelLayers, coveredPanels, migrateProject } from './src/wrap-layout.js';
const p=id=>PANELS.find(p=>p.id===id),placement=id=>PLACEMENTS.find(p=>p.panel.id===id);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} should equal ${b}`);
const same=(a,b)=>a.forEach((v,i)=>near(v,b[i]));
// Adjacent body pieces use the exact same metre coordinate on either side of
// a seam. In particular, no image rescaling occurs at the long horizontal seam.
for(const [id,x] of [['driver-skirt-front',0],['driver-wheel-arch',3.08],['driver-skirt-rear',4.28]]){
 for(const u of [0,p(id).w/2,p(id).w])same(localToWrap(p('driver-coach'),x+u,1.38),localToWrap(p(id),u,0));
}
same(localToWrap(p('driver-skirt-front'),3.08,.4),localToWrap(p('driver-wheel-arch'),0,.4));
same(localToWrap(p('driver-wheel-arch'),1.2,.4),localToWrap(p('driver-skirt-rear'),0,.4));
same(localToWrap(p('brow-roof'),1.425,1),localToWrap(p('roof'),0,1));
// Entry/lift leaves occupy their real openings, not arbitrary thumbnail slots.
for(const id of ['entry-1','entry-2','lift-1','lift-2']){
 const a=placement(id),b=placement('passenger-coach'),world=p(id).map(0,0),local=p('passenger-coach').map(a.x-b.x,a.y-b.y);near(world[0],local[0]);near(world[1],local[1]);
}
// Every chart is a rigid translation of an exterior-facing template: preserve
// both lengths and orientation, including the mirrored passenger fender.
for(const q of PLACEMENTS){const [x,y]=localToWrap(q.panel,.3,.4);near(x-q.x,.3);near(y-q.y,.4);}
const image={id:'asset',width:500,height:600};
const front=placement('driver-skirt-front'),layer={id:'one-image',asset:'asset',x:front.x+1,y:front.y,width:1.5,originalWidth:1.5,rotation:17,opacity:1,hidden:false,clipPanel:null,effect:{enabled:false,color:'#2866d6',threshold:161,grain:100,texture:60}};
const project={version:2,panel:'driver-skirt-front',view:'driver',assets:[image],layers:[layer]};
assert.ok(coveredPanels(project,layer).includes('driver-coach'));assert.ok(coveredPanels(project,layer).includes('driver-skirt-front'));assert.equal(project.layers.length,1);
for(const id of ['driver-coach','driver-skirt-front']){const crop=panelLayers(project,p(id))[0],q=placement(id);near(crop.x+q.x,layer.x);near(crop.y+q.y,layer.y);near(crop.width,layer.width);near(crop.rotation,layer.rotation);}
layer.clipPanel='driver-skirt-front';assert.deepEqual(coveredPanels(project,layer),['driver-skirt-front']);layer.clipPanel=null;
// The belt's closing cut is periodic, so a single image can also cross front
// back to driver without manually placing a second copy.
const closing={...layer,x:0,y:4.5,width:1.1,rotation:0};assert.ok(panelLayers({...project,layers:[closing]},p('front-header')).some(l=>l.wrapShift===BELT_PERIOD));assert.ok(panelLayers({...project,layers:[closing]},p('driver-fender')).some(l=>l.wrapShift===0));
const old={version:1,panel:'driver-skirt-front',assets:[image],layers:{'driver-skirt-front':[{...layer,x:.6,y:.2}]}};
const migrated=migrateProject(old);near(migrated.layers[0].x,front.x+.6);near(migrated.layers[0].y,front.y+.2);assert.equal(migrated.layers[0].clipPanel,'driver-skirt-front');assert.equal(old.version,1);assert.equal(migrated.version,2);
console.log(JSON.stringify({seams:'continuous',scale:'metres',doorAlignment:'passed',sharedArtwork:'passed',periodicWrap:'passed',legacyMigration:'passed'}));
