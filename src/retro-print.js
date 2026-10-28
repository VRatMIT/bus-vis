// Explicit equivalents of the reference stack. The comment corrects the fourth
// filter to Reticulation. Gallery order is bottom-up: gray -> reticulation -> dot.
// Adobe's grain/filter kernels are proprietary, so these are visual equivalents;
// layer order, whole-RGB blend selection, opacity and threshold are direct.
export const RETRO_DEFAULTS={enabled:true,color:'#2866d6',mode:'color',paper:'white',threshold:161,grain:100,grainSize:25,grainRoughness:50,texture:60,halftoneSize:2,halftoneContrast:12,reticulationDensity:35,reticulationForeground:15,reticulationBackground:3,removeBackground:true,backgroundTolerance:24};
const clamp=(v,a=0,b=255)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export function normalizeRetro(settings={}){
 const s={...RETRO_DEFAULTS,...settings};if(!/^#[0-9a-f]{6}$/i.test(s.color))s.color=RETRO_DEFAULTS.color;
 for(const [key,min,max] of [['threshold',0,255],['grain',0,100],['grainSize',0,100],['grainRoughness',0,100],['texture',0,100],['halftoneSize',1,12],['halftoneContrast',0,50],['reticulationDensity',0,50],['reticulationForeground',0,50],['reticulationBackground',0,50],['backgroundTolerance',0,100]])s[key]=clamp(Number.isFinite(s[key])?s[key]:RETRO_DEFAULTS[key],min,max);
 s.mode=s.mode==='mono'?'mono':'color';s.paper=s.paper==='transparent'?'transparent':'white';s.removeBackground=s.removeBackground!==false;return s;
}
function noise(x,y,seed=0){let n=Math.imul(x^seed,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function valueNoise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),a=smooth(0,1,x-ix),b=smooth(0,1,y-iy);return (noise(ix,iy,seed)*(1-a)+noise(ix+1,iy,seed)*a)*(1-b)+(noise(ix,iy+1,seed)*(1-a)+noise(ix+1,iy+1,seed)*a)*b;}
function normalNoise(x,y,seed){return (noise(x,y,seed)+noise(x,y,seed+11)+noise(x,y,seed+29)+noise(x,y,seed+47)-2)*1.732050808;}

// Subject alpha is independent of printed white. Existing cutouts are retained;
// opaque uploads use only a dominant, edge-connected flat background as a key.
export function subjectMask(data,width,height,settings){
 const alpha=new Uint8ClampedArray(width*height);for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];
 if(!settings.removeBackground)return {alpha,kind:'source alpha',background:null};
 let transparent=0,total=0;const bins=new Map();
 function sample(x,y){const i=(y*width+x)*4;total++;if(data[i+3]<250){transparent++;return;}const key=(data[i]>>4)*256+(data[i+1]>>4)*16+(data[i+2]>>4);const bin=bins.get(key)||[0,0,0,0];bin[0]++;for(let c=0;c<3;c++)bin[c+1]+=data[i+c];bins.set(key,bin);}
 for(let x=0;x<width;x++){sample(x,0);if(height>1)sample(x,height-1);}for(let y=1;y<height-1;y++){sample(0,y);if(width>1)sample(width-1,y);}
 if(transparent/total>.02)return {alpha,kind:'existing transparency',background:null};
 const dominant=[...bins.values()].sort((a,b)=>b[0]-a[0])[0];if(!dominant||dominant[0]<total*.6)return {alpha,kind:'no flat edge background',background:null};
 const background=dominant.slice(1).map(v=>v/dominant[0]),tolerance=settings.backgroundTolerance,visited=new Uint8Array(alpha.length),queue=new Uint32Array(alpha.length);let tail=0;
 const distance=i=>Math.max(Math.abs(data[i*4]-background[0]),Math.abs(data[i*4+1]-background[1]),Math.abs(data[i*4+2]-background[2]));
 function add(i){if(visited[i]||distance(i)>tolerance)return;visited[i]=1;queue[tail++]=i;}
 for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}for(let y=1;y<height-1;y++){add(y*width);add(y*width+width-1);}
 for(let head=0;head<tail;head++){const i=queue[head],x=i%width;alpha[i]=0;if(x)add(i-1);if(x<width-1)add(i+1);if(i>=width)add(i-width);if(i+width<alpha.length)add(i+width);}
 // Feather the immediate boundary only; never key out interior white detail.
 for(let i=0;i<alpha.length;i++){if(visited[i])continue;const x=i%width,edge=(x>0&&visited[i-1])||(x<width-1&&visited[i+1])||(i>=width&&visited[i-width])||(i+width<alpha.length&&visited[i+width]);if(edge)alpha[i]*=smooth(tolerance,tolerance+18,distance(i));}
 return {alpha,kind:'edge background removed',background};
}
export function filmGrain(data,width,height,s){
 const result=new Uint8ClampedArray(data.length),size=.6+s.grainSize*.035,rough=s.grainRoughness/100,amount=s.grain/100,soften=amount*clamp((s.grainSize-20)/80,0,.4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;result[i+3]=data[i+3];if(!data[i+3])continue;
  const fine=normalNoise(x,y,137),cluster=(valueNoise(x/size,y/size,211)-.5)*4,n=fine*(.75+rough*.25)+cluster*(.25+rough*.5);
  const tone=(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255,amplitude=amount*(2+58*Math.sqrt(tone*(1-tone)));
  for(let c=0;c<3;c++){let base=data[i+c];if(soften){const left=(y*width+Math.max(0,x-1))*4,right=(y*width+Math.min(width-1,x+1))*4,top=(Math.max(0,y-1)*width+x)*4,bottom=(Math.min(height-1,y+1)*width+x)*4;let sum=0,count=0;for(const j of [left,right,top,bottom])if(data[j+3]){sum+=data[j+c];count++;}if(count)base=base*(1-soften)+sum/count*soften;}result[i+c]=clamp(base+n*amplitude);}
 }return result;
}
export function solidGray(width,height){return new Uint8ClampedArray(width*height).fill(128);}
export function reticulation(input,width,height,s){
 const out=new Uint8ClampedArray(input.length),scale=4.8-s.reticulationDensity*.075,foreground=s.reticulationForeground/50,background=s.reticulationBackground/50;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,tone=input[i]/255;
  // Correlated emulsion islands and light stipple, not Voronoi cracks/relief.
  const warpX=(valueNoise(x/7,y/7,307)-.5)*1.2,warpY=(valueNoise(x/7,y/7,331)-.5)*1.2,lump=valueNoise(x/scale+warpX,y/scale+warpY,359),emulsion=lump*.78+noise(x,y,383)*.22;
  const coverage=1-tone+foreground*(1-tone)*.38-background*tone*.38,edge=.16-foreground*.06;
  out[i]=255*smooth(coverage-edge,coverage+edge,emulsion);
 }return out;
}
function dotQuantile(x,y){const r=Math.hypot(x,y);if(r<=.5)return Math.PI*r*r;return Math.PI*r*r-4*(r*r*Math.acos(.5/r)-.5*Math.sqrt(r*r-.25));}
export function halftonePattern(input,width,height,s){
 const out=new Uint8ClampedArray(input.length),period=Math.max(2,Math.round(s.halftoneSize*2)),screen=[];
 for(let y=0;y<period;y++)for(let x=0;x<period;x++){const thresholds=[];for(const sy of [.25,.75])for(const sx of [.25,.75])thresholds.push(dotQuantile((x+sx)/period-.5,(y+sy)/period-.5));screen.push(thresholds);}
 const edge=.18/(1+s.halftoneContrast/3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x,coverage=1-input[i]/255;let value=0;for(const threshold of screen[(y%period)*period+x%period])value+=smooth(-edge,edge,threshold-coverage);out[i]=value*255/4;}return out;
}
// Lighter Color selects the entire RGB color with the higher channel sum,
// unlike Lighten's independent channel maxima. Opacity follows that selection.
export function lighterColor(base,plate,opacity){
 const result=new Uint8ClampedArray(base.length);for(let i=0;i<plate.length;i++){const j=i*4,lighter=plate[i]*3>base[j]+base[j+1]+base[j+2];for(let c=0;c<3;c++)result[j+c]=lighter?base[j+c]*(1-opacity)+plate[i]*opacity:base[j+c];result[j+3]=base[j+3];}return result;
}
export function thresholdPixels(data,threshold){
 const result=new Uint8ClampedArray(data.length);for(let i=0;i<data.length;i+=4){const v=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]>=threshold?255:0;result[i]=result[i+1]=result[i+2]=v;result[i+3]=data[i+3];}return result;
}
function grayRGBA(gray){const out=new Uint8ClampedArray(gray.length*4);for(let i=0;i<gray.length;i++){out[i*4]=out[i*4+1]=out[i*4+2]=gray[i];out[i*4+3]=255;}return out;}
function recolor(binary,mask,s){
 const rgb=s.mode==='mono'?[0,0,0]:[1,3,5].map(i=>parseInt(s.color.slice(i,i+2),16)),out=new Uint8ClampedArray(binary.length);
 for(let i=0;i<mask.length;i++){const j=i*4,white=binary[j]===255;out[j]=white?255:rgb[0];out[j+1]=white?255:rgb[1];out[j+2]=white?255:rgb[2];out[j+3]=white&&s.paper==='transparent'?0:mask[i];}return out;
}
function stagePreview(pixels,width,height,maxEdge){
 const scale=Math.min(1,maxEdge/Math.max(width,height)),w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale)),out=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const src=(Math.min(height-1,Math.floor((y+.5)/scale))*width+Math.min(width-1,Math.floor((x+.5)/scale)))*4;out.set(pixels.subarray(src,src+4),(y*w+x)*4);}return {pixels:out,width:w,height:h};
}
export function renderRetro(data,width,height,settings={},options={}){
 const s=normalizeRetro(settings),matte=subjectMask(data,width,height,s),stages=[];
 function capture(id,title,pixels,note){if(options.stages)stages.push({id,title,note,...stagePreview(typeof pixels==='function'?pixels():pixels,width,height,options.maxPreviewEdge||600)});}
 if(!s.enabled){const pixels=new Uint8ClampedArray(data);for(let i=0;i<matte.alpha.length;i++)pixels[i*4+3]=matte.alpha[i];return {pixels,stages,maskKind:matte.kind};}
 const grain=filmGrain(data,width,height,s);capture('grain','1 · Grain',grain,`Amount ${s.grain} · Size ${s.grainSize} · Roughness ${s.grainRoughness}`);
 const fill=solidGray(width,height);capture('solid','2 · Solid Color',()=>grayRGBA(fill),'#808080 · separate Smart Object layer');
 if(options.stages)capture('halftone-only','3 · Halftone alone',grayRGBA(halftonePattern(fill,width,height,s)),`Dot · Size ${s.halftoneSize} · Contrast ${s.halftoneContrast} · black / white`);
 const emulsion=reticulation(fill,width,height,s);capture('reticulation','4a · Reticulation',()=>grayRGBA(emulsion),`Density ${s.reticulationDensity} · Foreground ${s.reticulationForeground} · Background ${s.reticulationBackground}`);
 const plate=halftonePattern(emulsion,width,height,s);capture('gallery','4b · Filter Gallery stack',()=>grayRGBA(plate),'Reticulation below Halftone · rendered bottom to top');
 const blended=lighterColor(grain,plate,s.texture/100);capture('blend','5 · Lighter Color',blended,`Whole-color RGB selection · layer opacity ${s.texture}%`);
 const binary=thresholdPixels(blended,s.threshold);capture('threshold','6 · Threshold',binary,`Level ${s.threshold} · pure black and white`);
 const pixels=recolor(binary,matte.alpha,s);capture('output','7 · Color & subject mask',pixels,`${s.mode==='mono'?'Black':s.color} + ${s.paper==='white'?'white':'transparent highlights'} · ${matte.kind}`);
 return {pixels,stages,maskKind:matte.kind};
}
export function retroPixels(data,width,height,settings){return renderRetro(data,width,height,settings).pixels;}
