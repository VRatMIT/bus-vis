import assert from 'node:assert/strict';
import { RETRO_DEFAULTS, normalizeRetro, subjectMask, filmGrain, solidGray, reticulation, halftonePattern, lighterColor, thresholdPixels, renderRetro } from './src/retro-print.js';
const s=normalizeRetro(),w=96,h=96,data=new Uint8ClampedArray(w*h*4);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;let v=255;if(x>=12&&x<84&&y>=12&&y<84)v=(x<16||x>=80||y<16||y>=80)?0:128;if(x>=36&&x<60&&y>=36&&y<60)v=255;data.set([v,v,v,255],i);}
const at=(pixels,x,y)=>[...pixels.slice((y*w+x)*4,(y*w+x)*4+4)];
const matte=subjectMask(data,w,h,s);assert.equal(matte.alpha[0],0);assert.equal(matte.alpha[45*w+45],255);assert.equal(matte.alpha[20*w+20],255);
const output=renderRetro(data,w,h,s,{stages:true,maxPreviewEdge:96});assert.equal(at(output.pixels,0,0)[3],0);assert.deepEqual(at(output.pixels,45,45),[255,255,255,255]);
const mono=renderRetro(data,w,h,{...s,mode:'mono'}).pixels;
let ink=0,white=0;for(let i=0;i<mono.length;i+=4){if(!mono[i+3])continue;assert.ok(mono[i]===0||mono[i]===255);assert.equal(mono[i],mono[i+1]);assert.equal(mono[i],mono[i+2]);if(mono[i])white++;else ink++;}assert.ok(ink>500&&white>500);
const colored=renderRetro(data,w,h,{...s,color:'#c64b92'}).pixels;for(let i=0;i<colored.length;i+=4){if(!colored[i+3])continue;assert.ok(colored[i]===255&&colored[i+1]===255&&colored[i+2]===255||colored[i]===198&&colored[i+1]===75&&colored[i+2]===146);}
assert.deepEqual([...lighterColor(new Uint8ClampedArray([255,0,0,255,200,100,50,255]),new Uint8Array([100,100]),.6)],[162,60,60,255,200,100,50,255]);
assert.deepEqual([...thresholdPixels(new Uint8ClampedArray([160,160,160,255,161,161,161,255]),161)],[0,0,0,255,255,255,255,255]);
const blackBlend=lighterColor(new Uint8ClampedArray([0,0,0,255]),new Uint8Array([255]),.6);assert.equal(blackBlend[0],153);assert.equal(thresholdPixels(blackBlend,161)[0],0);
const gray=solidGray(w,h),retic=reticulation(gray,w,h,s),dots=halftonePattern(gray,w,h,s),stack=halftonePattern(retic,w,h,s);assert.ok(new Set(retic).size>100);assert.ok(Math.max(...dots)-Math.min(...dots)>200);
for(let y=0;y<h;y++)for(let x=0;x<w-4;x++)assert.equal(dots[y*w+x],dots[y*w+x+4]);
assert.notDeepEqual(stack,reticulation(dots,w,h,s),'Filter Gallery order matters');
assert.deepEqual(output.stages.map(s=>s.id),['grain','solid','halftone-only','reticulation','gallery','blend','threshold','output']);
const actual=output.stages.find(s=>s.id==='gallery').pixels;for(let i=0;i<stack.length;i++)assert.equal(actual[i*4],stack[i]);
assert.deepEqual(filmGrain(data,w,h,{...s,grain:0}),data);assert.notDeepEqual(filmGrain(data,w,h,s),filmGrain(data,w,h,{...s,grainSize:80}));assert.notDeepEqual(filmGrain(data,w,h,s),filmGrain(data,w,h,{...s,grainRoughness:0}));
const cutout=new Uint8ClampedArray(data);for(let i=0;i<w;i++)cutout[i*4+3]=0;cutout[(30*w+30)*4+3]=128;const cut=renderRetro(cutout,w,h,s);assert.equal(at(cut.pixels,30,30)[3],128);assert.equal(at(cut.pixels,0,0)[3],0);
const raw=renderRetro(data,w,h,{...s,enabled:false});assert.equal(at(raw.pixels,0,0)[3],0);assert.deepEqual(at(raw.pixels,45,45),[255,255,255,255]);
assert.equal(renderRetro(data,w,h,{...s,removeBackground:false}).pixels[3],255);assert.equal(at(renderRetro(data,w,h,{...s,paper:'transparent'}).pixels,45,45)[3],0);
assert.deepEqual(renderRetro(data,w,h,s).pixels,output.pixels,'Noise must stay fixed while artwork moves or is cropped');
console.log(JSON.stringify({reticulation:'35/15/3',grain:'100/25/50',halftone:'dot 2/12',galleryOrder:'passed',lighterColor:'whole RGB, 60%',threshold:161,whiteDetail:'preserved',background:'removed',alpha:'preserved',deterministic:true,ink,white}));
