import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { renderRetro, normalizeRetro, subjectMask } from '../src/retro-print.js';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const input=process.argv[2]||'/tmp/agentd-images/2ce36a9c-d11f-552a-b74a-175c2dc82b1f_1793223239936.png';
const output=process.env.RETRO_PROOF_DIR||'/tmp/retro-calibration';await mkdir(output,{recursive:true});
const settings=normalizeRetro({...JSON.parse(process.env.RETRO_SETTINGS||'{}'),color:'#302586',paper:'transparent'});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/home/mehek/.cache/ms-playwright/chromium-1148/chrome-linux/chrome',args:['--no-sandbox'],env:{...process.env,LD_LIBRARY_PATH:process.env.LD_LIBRARY_PATH||'/tmp/bus-browser-deps/usr/lib/x86_64-linux-gnu'}});
const page=await browser.newPage({viewport:{width:1500,height:860}});
const decoded=await page.evaluate(async base64=>{
 const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);window.referenceImage=image;
 const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let binary='';for(let i=0;i<data.length;i+=32768)binary+=String.fromCharCode(...data.subarray(i,i+32768));return {width:canvas.width,height:canvas.height,raw:btoa(binary)};
},(await readFile(input)).toString('base64'));
const rgba=new Uint8ClampedArray(Buffer.from(decoded.raw,'base64')),W=decoded.width,H=decoded.height;
function crop(x,y,w,h){const data=new Uint8ClampedArray(w*h*4);for(let row=0;row<h;row++)data.set(rgba.subarray(((row+y)*W+x)*4,((row+y)*W+x+w)*4),row*w*4);return {data,width:w,height:h,x,y};}
function largest(mask,w,h){const visited=new Uint8Array(mask.length),queue=new Uint32Array(mask.length);let best=[];for(let first=0;first<mask.length;first++){if(visited[first]||mask[first]<128)continue;let head=0,tail=1;queue[0]=first;visited[first]=1;while(head<tail){const i=queue[head++],x=i%w;for(const n of [x?i-1:-1,x<w-1?i+1:-1,i>=w?i-w:-1,i+w<mask.length?i+w:-1])if(n>=0&&!visited[n]&&mask[n]>=128){visited[n]=1;queue[tail++]=n;}}if(tail>best.length)best=Array.from(queue.subarray(0,tail));}const result=new Uint8ClampedArray(mask.length);for(const i of best)result[i]=mask[i];return result;}
const source=crop(70,45,620,1175),target=crop(590,45,640,1175);
const bg=[0,0,0];let count=0;for(let y=10;y<45;y++)for(let x=10;x<100;x++){const i=(y*W+x)*4;for(let c=0;c<3;c++)bg[c]+=rgba[i+c];count++;}for(let c=0;c<3;c++)bg[c]/=count;
// For this calibration photograph, the silver subject is neutral while the
// backdrop has a pink chroma. This extracts an independent reference silhouette
// without relying on the filter's background-removal implementation.
const sourceMatte=new Uint8ClampedArray(source.width*source.height);
for(let i=0;i<sourceMatte.length;i++){const j=i*4;sourceMatte[i]=255*Math.max(0,Math.min(1,1-(source.data[j]-source.data[j+1])/(bg[0]-bg[1])));}
const mask=largest(sourceMatte,source.width,source.height);
// The attachment is a layout, not a single asset: keep only the silver screw,
// excluding the arrow, caption and the edge of the neighboring blue example.
for(let i=0;i<mask.length;i++)if(!mask[i])source.data.set([...bg,255],i*4);
const inkSamples=[];for(let y=90;y<310;y++)for(let x=690;x<960;x++){const i=(y*W+x)*4;if(rgba[i+2]>rgba[i]+40&&rgba[i]<80)inkSamples.push([rgba[i],rgba[i+1],rgba[i+2]]);}
const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];const ink=[0,1,2].map(c=>median(inkSamples.map(p=>p[c])));
const inkHex='#'+ink.map(v=>v.toString(16).padStart(2,'0')).join('');settings.color=inkHex;
const axis=bg.map((v,c)=>v-ink[c]),den=axis.reduce((n,v)=>n+v*v,0);
function inkCoverage(data,i){return Math.max(0,Math.min(1,axis.reduce((n,v,c)=>n+(bg[c]-data[i+c])*v,0)/den));}
const targetInk=new Float32Array(target.width*target.height);for(let i=0;i<targetInk.length;i++)targetInk[i]=inkCoverage(target.data,i*4);
function sample(x,y){x-=target.x;y-=target.y;if(x<0||y<0||x>=target.width-1||y>=target.height-1)return 0;const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy;return targetInk[iy*target.width+ix]*(1-a)*(1-b)+targetInk[iy*target.width+ix+1]*a*(1-b)+targetInk[(iy+1)*target.width+ix]*(1-a)*b+targetInk[(iy+1)*target.width+ix+1]*a*b;}
// Geometric registration is independent of the print settings. The two screws
// are slightly sheared/scaled in the supplied layout, not exact translations.
let transform={a:1.007,c:.013,d:1.01,tx:510,ty:-7.7};
const samples=[];for(let y=3;y<source.height-3;y+=5)for(let x=3;x<source.width-3;x+=5){const i=y*source.width+x;if(mask[i]<250)continue;const gray=(source.data[i*4]+source.data[i*4+1]+source.data[i*4+2])/3;samples.push({x:x+source.x,y:y+source.y,gray,bin:Math.min(15,Math.floor(gray/16)),index:i});}
function registrationCost(t){const bins=Array.from({length:16},()=>[0,0,0]);for(const p of samples){const v=sample(t.a*p.x+t.c*p.y+t.tx,t.d*p.y+t.ty),b=bins[p.bin];b[0]+=v;b[1]+=v*v;b[2]++;}let error=0;for(const [sum,squared,n]of bins)if(n)error+=squared-sum*sum/n;return error/samples.length;}
for(const scale of [1,.5,.25])for(let iter=0;iter<5;iter++){let moved=false;for(const [key,step]of [['a',.005],['c',.005],['d',.005],['tx',2],['ty',2]]){let best=registrationCost(transform),next=transform;for(const dir of [-1,1]){const trial={...transform,[key]:transform[key]+step*scale},cost=registrationCost(trial);if(cost<best){best=cost;next=trial;}}if(next!==transform){transform=next;moved=true;}}if(!moved)break;}
const toneBins=Array.from({length:16},(_,i)=>({from:i*16,to:i*16+15,count:0,target:0,current:0}));
const flatToneBins=Array.from({length:16},(_,i)=>({from:i*16,to:i*16+15,count:0,target:0,current:0,baseline:0}));
const result=renderRetro(source.data,source.width,source.height,settings).pixels;
const baselineModule=await import('data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show','f169bb0:src/retro-print.js'],{encoding:'utf8'})).toString('base64'));
const baseline=baselineModule.renderRetro(source.data,source.width,source.height,settings).pixels;
for(const p of samples){const b=toneBins[p.bin];b.count++;b.target+=sample(transform.a*p.x+transform.c*p.y+transform.tx,transform.d*p.y+transform.ty);b.current+=result[p.index*4+3]/255;}
for(const b of toneBins){b.target=b.count?b.target/b.count:0;b.current=b.count?b.current/b.count:0;}
for(let y=4;y<source.height-4;y+=2)for(let x=4;x<source.width-4;x+=2){const i=y*source.width+x;if(mask[i]<250)continue;let min=255,max=0,valid=true;for(let dy=-3;dy<=3;dy+=3)for(let dx=-3;dx<=3;dx+=3){const index=(y+dy)*source.width+x+dx,j=index*4;if(mask[index]<250)valid=false;const gray=(source.data[j]+source.data[j+1]+source.data[j+2])/3;min=Math.min(min,gray);max=Math.max(max,gray);}if(!valid||max-min>22)continue;const gray=(source.data[i*4]+source.data[i*4+1]+source.data[i*4+2])/3,b=flatToneBins[Math.min(15,Math.floor(gray/16))];b.count++;let v=0;for(const dy of [-2,0,2])for(const dx of [-2,0,2])v+=sample(transform.a*(x+source.x)+transform.c*(y+source.y)+transform.tx+dx,transform.d*(y+source.y)+transform.ty+dy)/9;b.target+=v;b.current+=result[i*4+3]/255;b.baseline+=baseline[i*4+3]/255;}
for(const b of flatToneBins){b.target=b.count?b.target/b.count:0;b.current=b.count?b.current/b.count:0;b.baseline=b.count?b.baseline/b.count:0;}
let weightedError=0,weightedBaselineError=0,baselineDensityError=0,n=0,roughCount=0,refSum=0,currentSum=0,refSq=0,currentSq=0;
for(const b of flatToneBins){weightedError+=(b.target-b.current)**2*b.count;baselineDensityError+=(b.target-b.baseline)**2*b.count;n+=b.count;}
for(const p of samples){const expected=sample(transform.a*p.x+transform.c*p.y+transform.tx,transform.d*p.y+transform.ty);weightedBaselineError+=(expected-baseline[p.index*4+3]/255)**2;}
for(let y=5;y<source.height-5;y++)for(let x=5;x<source.width-5;x++){const i=y*source.width+x,j=i*4,gray=(source.data[j]+source.data[j+1]+source.data[j+2])/3;if(mask[i]<250||gray<208||gray>223)continue;const t=sample(transform.a*(x+source.x)+transform.c*(y+source.y)+transform.tx,transform.d*(y+source.y)+transform.ty),v=result[j+3]/255;refSum+=t;currentSum+=v;refSq+=t*t;currentSq+=v*v;roughCount++;}
const engineMask=subjectMask(source.data,source.width,source.height,settings).alpha;let intersection=0,union=0,outsideInk=0;for(let i=0;i<mask.length;i++){intersection+=Math.min(mask[i],engineMask[i]);union+=Math.max(mask[i],engineMask[i]);if(!mask[i]&&result[i*4+3])outsideInk++;}
const report={background:bg,ink,inkHex,transform,settings,registrationCost:registrationCost(transform),densityRMSE:Math.sqrt(weightedError/n),baselineDensityRMSE:Math.sqrt(baselineDensityError/n),baselinePixelRMSE:Math.sqrt(weightedBaselineError/samples.length),maskIoU:intersection/union,outsideInk,texture:{count:roughCount,targetMean:refSum/roughCount,currentMean:currentSum/roughCount,targetSD:Math.sqrt(refSq/roughCount-(refSum/roughCount)**2),currentSD:Math.sqrt(currentSq/roughCount-(currentSum/roughCount)**2)},toneBins,flatToneBins};
const targetAligned=new Float32Array(mask.length);for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)targetAligned[y*source.width+x]=sample(transform.a*(x+source.x)+transform.c*(y+source.y)+transform.tx,transform.d*(y+source.y)+transform.ty);
await writeFile(output+'/target-aligned.f32',targetAligned);
await writeFile(output+'/source.rgba',source.data);await writeFile(output+'/mask.rgba',mask);await writeFile(output+'/target-ink.f32',targetInk);await writeFile(output+'/report.json',JSON.stringify(report,null,2));
const to64=data=>Buffer.from(data.buffer,data.byteOffset,data.byteLength).toString('base64');
const pngs=await page.evaluate(({source,result,baseline,mask,engineMask,bg,ink,target,transform})=>{
 const decode=b64=>Uint8ClampedArray.from(atob(b64),c=>c.charCodeAt(0));const raw=decode(source.raw),out=decode(result),alpha=decode(mask);
 document.body.innerHTML='';document.body.style.cssText='margin:0;padding:28px;background:#101719;color:#e4ecdf;font:14px system-ui';const header=document.createElement('h1');header.textContent='Actual screw calibration · original / target / previous filter / revised filter';header.style.cssText='font-size:21px;font-weight:500;margin:0 0 10px';document.body.append(header);const note=document.createElement('p');note.textContent='Pink is only the comparison backdrop. The exported screw PNGs have transparent backgrounds.';note.style.cssText='font-size:12px;color:#a5b9a0;margin:0 0 20px';document.body.append(note);const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:18px';document.body.append(grid);
 for(const [title,kind]of [['Silver source · pink removed','source'],['Supplied blue target · registered','target'],['Previous filter','baseline'],['Revised filter','result']]){const figure=document.createElement('figure');figure.style.cssText='margin:0;background:#202b28;border-radius:8px;overflow:hidden';const caption=document.createElement('figcaption');caption.textContent=title;caption.style.cssText='padding:12px';figure.append(caption);const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;canvas.style.cssText='width:100%;display:block';const ctx=canvas.getContext('2d');ctx.fillStyle=`rgb(${bg.join(',')})`;ctx.fillRect(0,0,canvas.width,canvas.height);
  const layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;const lc=layer.getContext('2d');if(kind==='target'){lc.setTransform(1/transform.a,0,-transform.c/(transform.a*transform.d),1/transform.d,(transform.c*transform.ty/transform.d-transform.tx)/transform.a-source.x,-transform.ty/transform.d-source.y);lc.drawImage(window.referenceImage,0,0);lc.resetTransform();const pixels=lc.getImageData(0,0,canvas.width,canvas.height);for(let i=0;i<alpha.length;i++)pixels.data[i*4+3]=alpha[i];lc.putImageData(pixels,0,0);}else{const pixels=kind==='source'?raw.slice():kind==='baseline'?decode(baseline):out.slice();if(kind==='source')for(let i=0;i<alpha.length;i++)pixels[i*4+3]=alpha[i];lc.putImageData(new ImageData(pixels,canvas.width,canvas.height),0,0);}ctx.drawImage(layer,0,0);figure.append(canvas);grid.append(figure);}
 const png=data=>{const c=document.createElement('canvas');c.width=source.width;c.height=source.height;c.getContext('2d').putImageData(new ImageData(data,source.width,source.height),0,0);return c.toDataURL().split(',')[1];};const cutout=raw.slice(),actualAlpha=decode(engineMask);for(let i=0;i<actualAlpha.length;i++)cutout[i*4+3]=actualAlpha[i];return {source:png(cutout),result:png(out)};
}, {source:{...source,data:undefined,raw:to64(source.data)},result:to64(result),baseline:to64(baseline),mask:to64(mask),engineMask:to64(engineMask),bg,ink,target:undefined,transform});
await writeFile(output+'/silver-screw.png',Buffer.from(pngs.source,'base64'));await writeFile(output+'/silver-screw-retro.png',Buffer.from(pngs.result,'base64'));
await page.screenshot({path:output+'/comparison.png',fullPage:true});console.log(JSON.stringify(report));await browser.close();
if(process.argv.includes('--check')){assert.ok(report.densityRMSE<.03,'Reference tonal density match');assert.ok(Math.abs(report.texture.currentMean-report.texture.targetMean)<.02,'Reference head ink coverage');assert.ok(Math.abs(report.texture.currentSD-report.texture.targetSD)<.025,'Reference grain contrast');assert.ok(report.maskIoU>.97,'Pink removal preserves the screw silhouette');assert.equal(report.outsideInk,0,'No pink/background/annotation pixels survive');assert.ok(report.densityRMSE<report.baselineDensityRMSE*.2,'Substantial improvement over the previous filter');}
