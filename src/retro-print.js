// Explicit equivalents of the reference stack. The comment corrects the fourth
// filter to Reticulation. Gallery order is bottom-up: gray -> reticulation -> dot.
// Adobe's grain/filter kernels are proprietary, so these are visual equivalents;
// layer order, whole-RGB blend selection, opacity and threshold are direct.
export const RETRO_DEFAULTS={enabled:true,color:'#27247d',paperColor:'#ffffff',mode:'color',paper:'transparent',printResolution:2400,threshold:161,grain:100,grainSize:25,grainRoughness:50,texture:60,halftoneSize:2,halftoneContrast:12,reticulationDensity:35,reticulationForeground:15,reticulationBackground:3,removeBackground:true,backgroundTolerance:24};
// A photographic grain-density characteristic calibrated from the tonal bins
// of the supplied silver/blue reference, not from its geometry or pixel layout.
// The former zero-mean additive grain left ~215-gray metal effectively blank.
export const FILM_DENSITY_CURVE=[[0,0],[24,-22.04],[40,-26.69],[56,-29.16],[72,-23.12],[88,-1.49],[104,2.77],[120,16.51],[136,24.49],[160,36.95],[184,118.95],[200,138.81],[216,156.07],[232,168.91],[248,173.09],[255,255]];
function densityTone(gray){for(let i=1;i<FILM_DENSITY_CURVE.length;i++){const [x,y]=FILM_DENSITY_CURVE[i],previous=FILM_DENSITY_CURVE[i-1];if(gray<=x)return previous[1]+(y-previous[1])*(gray-previous[0])/(x-previous[0]);}return 255;}
const clamp=(v,a=0,b=255)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export function normalizeRetro(settings={}){
 const s={...RETRO_DEFAULTS,...settings};if(!/^#[0-9a-f]{6}$/i.test(s.color))s.color=RETRO_DEFAULTS.color;
 if(!/^#[0-9a-f]{6}$/i.test(s.paperColor))s.paperColor=RETRO_DEFAULTS.paperColor;
 for(const [key,min,max] of [['printResolution',32,2400],['threshold',0,255],['grain',0,100],['grainSize',0,100],['grainRoughness',0,100],['texture',0,100],['halftoneSize',1,12],['halftoneContrast',0,50],['reticulationDensity',0,50],['reticulationForeground',0,50],['reticulationBackground',0,50],['backgroundTolerance',0,100]])s[key]=clamp(Number.isFinite(s[key])?s[key]:RETRO_DEFAULTS[key],min,max);
 s.mode=s.mode==='mono'?'mono':'color';s.paper=s.paper==='transparent'?'transparent':'white';s.removeBackground=s.removeBackground!==false;return s;
}
function noise(x,y,seed=0){let n=Math.imul(x^seed,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function valueNoise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),a=smooth(0,1,x-ix),b=smooth(0,1,y-iy);return (noise(ix,iy,seed)*(1-a)+noise(ix+1,iy,seed)*a)*(1-b)+(noise(ix,iy+1,seed)*(1-a)+noise(ix+1,iy+1,seed)*a)*b;}
function normalNoise(x,y,seed){return (noise(x,y,seed)+noise(x,y,seed+11)+noise(x,y,seed+29)+noise(x,y,seed+47)-2)*1.732050808;}
export function grainNoise(x,y,s){const size=.6+s.grainSize*.035,rough=s.grainRoughness/100;return normalNoise(x,y,137)*(.75+rough*.25)+(valueNoise(x/size,y/size,211)-.5)*4*(.25+rough*.5);}

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
 const colored=Math.max(...background)-Math.min(...background)>12,chromaTolerance=Math.max(3,tolerance*.25);
 const distance=i=>{const j=i*4,r=data[j],g=data[j+1],b=data[j+2],rgb=Math.max(Math.abs(r-background[0]),Math.abs(g-background[1]),Math.abs(b-background[2]));if(!colored)return rgb;const chroma=Math.max(Math.abs((r-g)-(background[0]-background[1])),Math.abs((b-g)-(background[2]-background[1])));return Math.max(rgb,chroma/chromaTolerance*tolerance);};
 function add(i){if(visited[i]||distance(i)>tolerance)return;visited[i]=1;queue[tail++]=i;}
 for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}for(let y=1;y<height-1;y++){add(y*width);add(y*width+width-1);}
 for(let head=0;head<tail;head++){const i=queue[head],x=i%width;alpha[i]=0;if(x)add(i-1);if(x<width-1)add(i+1);if(i>=width)add(i-width);if(i+width<alpha.length)add(i+width);}
 // Feather the immediate boundary only; never key out interior white detail.
 for(let i=0;i<alpha.length;i++){if(visited[i])continue;const x=i%width,edge=(x>0&&visited[i-1])||(x<width-1&&visited[i+1])||(i>=width&&visited[i-width])||(i+width<alpha.length&&visited[i+width]);if(edge)alpha[i]*=smooth(tolerance,tolerance+18,distance(i));}
 return {alpha,kind:'edge background removed',background};
}
export function filmGrain(data,width,height,s){
 const result=new Uint8ClampedArray(data.length),amount=s.grain/100,soften=amount*clamp((s.grainSize-20)/80,0,.4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;result[i+3]=data[i+3];if(!data[i+3])continue;
  const n=grainNoise(x,y,s),tone=(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255,amplitude=amount*(2+58*Math.sqrt(tone*(1-tone))),densityShift=amount*(densityTone(tone*255)-tone*255);
  for(let c=0;c<3;c++){let base=data[i+c];if(soften){const left=(y*width+Math.max(0,x-1))*4,right=(y*width+Math.min(width-1,x+1))*4,top=(Math.max(0,y-1)*width+x)*4,bottom=(Math.min(height-1,y+1)*width+x)*4;let sum=0,count=0;for(const j of [left,right,top,bottom])if(data[j+3]){sum+=data[j+c];count++;}if(count)base=base*(1-soften)+sum/count*soften;}result[i+c]=clamp(base+densityShift+n*amplitude);}
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
export function resolvePrint(binary,width,height,mask){
 const out=new Uint8ClampedArray(binary.length),weights=[.10,.80,.10];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;let tone=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const n=clamp(y+dy,0,height-1)*width+clamp(x+dx,0,width-1);tone+=(mask[n]?binary[n*4]:255)*weights[dx+1]*weights[dy+1];}out[i*4]=out[i*4+1]=out[i*4+2]=tone;out[i*4+3]=binary[i*4+3];}return out;
}
export function gradientMap(tones,mask,settings){
 const s=normalizeRetro(settings),rgb=s.mode==='mono'?[0,0,0]:[1,3,5].map(i=>parseInt(s.color.slice(i,i+2),16)),paper=s.mode==='mono'?[255,255,255]:[1,3,5].map(i=>parseInt(s.paperColor.slice(i,i+2),16)),out=new Uint8ClampedArray(tones.length);
 for(let i=0;i<mask.length;i++){const j=i*4,t=tones[j]/255;for(let c=0;c<3;c++)out[j+c]=s.paper==='transparent'?rgb[c]:rgb[c]*(1-t)+paper[c]*t;out[j+3]=mask[i]*(s.paper==='transparent'?1-t:1);}return out;
}
function stagePreview(pixels,width,height,maxEdge){
 const scale=Math.min(1,maxEdge/Math.max(width,height)),w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale)),out=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const src=(Math.min(height-1,Math.floor((y+.5)/scale))*width+Math.min(width-1,Math.floor((x+.5)/scale)))*4;out.set(pixels.subarray(src,src+4),(y*w+x)*4);}return {pixels:out,width:w,height:h};
}
function printInput(data,width,height,mask,resolution){
 const scale=Math.max(1,Math.min(4,resolution/Math.max(width,height))),w=Math.round(width*scale),h=Math.round(height*scale);if(w===width&&h===height)return {data,width,height,mask};
 const out=new Uint8ClampedArray(w*h*4),alpha=new Uint8ClampedArray(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const sx=clamp((x+.5)*width/w-.5,0,width-1),sy=clamp((y+.5)*height/h-.5,0,height-1),ix=Math.floor(sx),iy=Math.floor(sy),a=sx-ix,b=sy-iy,i=y*w+x;
  const samples=[[iy*width+ix,(1-a)*(1-b)],[iy*width+Math.min(width-1,ix+1),a*(1-b)],[Math.min(height-1,iy+1)*width+ix,(1-a)*b],[Math.min(height-1,iy+1)*width+Math.min(width-1,ix+1),a*b]];
  let coverage=0,sourceAlpha=0;for(const [n,k]of samples){coverage+=mask[n]*k;sourceAlpha+=data[n*4+3]*k;}alpha[i]=coverage;out[i*4+3]=sourceAlpha;
  for(let c=0;c<3;c++){let value=0;for(const [n,k]of samples)value+=data[n*4+c]*data[n*4+3]*k;out[i*4+c]=sourceAlpha?value/sourceAlpha:0;}
 }return {data:out,width:w,height:h,mask:alpha};
}
function resolveSampling(binary,work,width,height){
 if(work.width===width&&work.height===height)return binary;
 const result=new Uint8ClampedArray(width*height*4),sx=work.width/width,sy=work.height/height;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const x0=x*sx,x1=(x+1)*sx,y0=y*sy,y1=(y+1)*sy;let tone=0,area=0;
  for(let iy=Math.floor(y0);iy<Math.min(work.height,Math.ceil(y1));iy++)for(let ix=Math.floor(x0);ix<Math.min(work.width,Math.ceil(x1));ix++){const a=(Math.min(x1,ix+1)-Math.max(x0,ix))*(Math.min(y1,iy+1)-Math.max(y0,iy)),n=iy*work.width+ix;tone+=(work.mask[n]?binary[n*4]:255)*a;area+=a;}
  const j=(y*width+x)*4;result[j]=result[j+1]=result[j+2]=tone/area;result[j+3]=255;
 }return result;
}
export function renderRetro(data,width,height,settings={},options={}){
 const s=normalizeRetro(settings),matte=subjectMask(data,width,height,s),stages=[];
 let captureWidth=width,captureHeight=height;
 function capture(id,title,pixels,note){if(options.stages)stages.push({id,title,note,...stagePreview(typeof pixels==='function'?pixels():pixels,captureWidth,captureHeight,options.maxPreviewEdge||600)});}
 if(!s.enabled){const pixels=new Uint8ClampedArray(data);for(let i=0;i<matte.alpha.length;i++)pixels[i*4+3]=matte.alpha[i];return {pixels,stages,maskKind:matte.kind};}
 const work=printInput(data,width,height,matte.alpha,s.printResolution);captureWidth=work.width;captureHeight=work.height;
 const grain=filmGrain(work.data,work.width,work.height,s);capture('grain','1 · Grain',grain,`Amount ${s.grain} · Size ${s.grainSize} · Roughness ${s.grainRoughness}`);
 const fill=solidGray(work.width,work.height);capture('solid','2 · Solid Color',()=>grayRGBA(fill),'#808080 · separate Smart Object layer');
 if(options.stages)capture('halftone-only','3 · Halftone alone',grayRGBA(halftonePattern(fill,work.width,work.height,s)),`Dot · Size ${s.halftoneSize} · Contrast ${s.halftoneContrast} · black / white`);
 const emulsion=reticulation(fill,work.width,work.height,s);capture('reticulation','4a · Reticulation',()=>grayRGBA(emulsion),`Density ${s.reticulationDensity} · Foreground ${s.reticulationForeground} · Background ${s.reticulationBackground}`);
 const plate=halftonePattern(emulsion,work.width,work.height,s);capture('gallery','4b · Filter Gallery stack',()=>grayRGBA(plate),'Reticulation below Halftone · rendered bottom to top');
 const blended=lighterColor(grain,plate,s.texture/100);capture('blend','5 · Lighter Color',blended,`Whole-color RGB selection · layer opacity ${s.texture}%`);
 const binary=thresholdPixels(blended,s.threshold);capture('threshold','6 · Threshold',binary,`Level ${s.threshold} · pure black and white`);
 const sampled=resolveSampling(binary,work,width,height),resolved=resolvePrint(sampled,width,height,matte.alpha),pixels=gradientMap(resolved,matte.alpha,s);captureWidth=width;captureHeight=height;capture('output','7 · Gradient map & subject mask',pixels,`${s.mode==='mono'?'Black → white':s.color+' → '+(s.paper==='white'?s.paperColor:'transparent')} · ${matte.kind}`);
 return {pixels,stages,maskKind:matte.kind};
}
export function retroPixels(data,width,height,settings){return renderRetro(data,width,height,settings).pixels;}
