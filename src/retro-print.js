// A reproducible canvas interpretation of the supplied six-step Photoshop recipe:
// grain (100/25/50), gray fill, dot halftone (2/12), craquelure (35/15/3),
// Lighter Color at 60%, threshold 161, then an ink-color gradient map.
export const RETRO_DEFAULTS={enabled:true,color:'#2866d6',threshold:161,grain:100,texture:60};
function noise(x,y,seed=0){let n=Math.imul(x^seed,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
export function retroPixels(data,width,height,settings){
 const {color,threshold,grain,texture}=settings;
 const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 const out=new Uint8ClampedArray(data.length),amount=grain/100,mix=texture/100;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,alpha=data[i+3];if(!alpha)continue;
  const luminance=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
  // Fine and clustered grain retain tonal shading without adding a background.
  const g=(noise(x,y,23)-.5)*83+(noise(x>>1,y>>1,51)-.5)*31;
  const toned=Math.max(0,Math.min(255,luminance+g*amount));
  // Distort a four-pixel dot screen with irregular cracked-cell boundaries.
  const gx=x/13,gy=y/13,ix=Math.floor(gx),iy=Math.floor(gy);let first=100,second=100;
  for(let cy=iy-1;cy<=iy+1;cy++)for(let cx=ix-1;cx<=ix+1;cx++){
   const dx=gx-cx-noise(cx,cy,71),dy=gy-cy-noise(cx,cy,93),d=dx*dx+dy*dy;
   if(d<first){second=first;first=d;}else if(d<second)second=d;
  }
  const crack=Math.max(0,1-(Math.sqrt(second)-Math.sqrt(first))*8);
  const warp=(noise(ix,iy,19)-.5)*2.5;
  const dot=Math.cos((x+warp)*Math.PI/2)*Math.cos((y-warp)*Math.PI/2);
  const plate=Math.max(0,Math.min(255,128+dot*58+crack*46+(noise(x,y,7)-.5)*25));
  const lighter=toned+(Math.max(toned,plate)-toned)*mix;
  out[i]=rgb[0];out[i+1]=rgb[1];out[i+2]=rgb[2];
  out[i+3]=lighter<threshold?alpha:0;
 }
 return out;
}
