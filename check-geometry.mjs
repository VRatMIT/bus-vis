import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { roundedLoft } from './src/sculpt.js';
import { CAP, ROOF_SECTIONS } from './src/body-profile.js';
import { PANELS } from './src/panels.js';

// The closed shell must have outward winding, finite normals and no overshoot.
const slices=240,geometry=roundedLoft(ROOF_SECTIONS,slices),position=geometry.attributes.position,normal=geometry.attributes.normal;
let ringSize=1;while(position.getX(ringSize)===position.getX(0))ringSize++;
assert.ok([...position.array,...normal.array].every(Number.isFinite));
geometry.computeBoundingBox();assert.ok(geometry.boundingBox.min.x>=CAP.front-1e-6);assert.ok(geometry.boundingBox.max.y<=CAP.top+1e-6);
for(let j=0;j<=slices;j++){
 const x=position.getX(j*ringSize);
 if(j)assert.ok(x>position.getX((j-1)*ringSize),'longitudinal sampling stays monotonic');
 for(let i=0;i<ringSize;i++)assert.ok(Math.abs(position.getZ(j*ringSize+i))<=1.225001,'roof stays within body width');
}
// Cap vertices are separate from the shell so the destination face stays flat.
const capStart=(slices+1)*ringSize;
assert.ok(normal.getX(capStart)<-.999);assert.ok(normal.getX(capStart+ringSize+1)>.999);
const box=roundedLoft([[0,1,0,1,.1,.1],[2,1,0,1,.1,.1]],8);
const p=box.attributes.position,n=box.attributes.normal;
for(let i=ringSize;i<8*ringSize;i++){
 const radial=new Vector3(0,p.getY(i)-.5,p.getZ(i)),outward=new Vector3().fromBufferAttribute(n,i);
 assert.ok(radial.dot(outward)>0,'shell normals face outward');
}
const cap=PANELS.find(p=>p.id==='brow-roof'),roof=PANELS.find(p=>p.id==='roof');
assert.deepEqual(cap.map(cap.w,1),roof.map(0,1),'cap art meets the coach roof at the same world point');
geometry.dispose();box.dispose();console.log(JSON.stringify({shell:'finite and outward',roof:'continuous',capArtwork:'aligned'}));
