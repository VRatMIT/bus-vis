// Fit the grain's photographic-density characteristic, not a spatial copy of
// the target. This 1D response generalizes to other images and other ink colors.
import { grainNoise, solidGray, reticulation, halftonePattern, normalizeRetro } from '../src/retro-print.js';
const w=256,h=256,s=normalizeRetro(),input=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)input.set([128,128,128,255],i*4);
const plate=halftonePattern(reticulation(solidGray(w,h),w,h,s),w,h,s);
const noise=Array.from({length:w*h},(_,i)=>grainNoise(i%w,Math.floor(i/w),s));
// Monotone density estimates from flat, interior regions of the supplied
// registered silver/blue pair; high-gradient boundaries are excluded.
const desired=[[0,1],[24,.997],[40,.994],[56,.992],[72,.98],[88,.924],[104,.905],[120,.85],[136,.814],[160,.76],[184,.586],[200,.489],[216,.347],[232,.196],[248,.079],[255,0]];
const profile=[];
for(const [gray,target]of desired){if(gray===0||gray===255){profile.push([gray,gray]);continue;}const sigma=2+58*Math.sqrt(gray/255*(1-gray/255));let low=-100,high=355;for(let j=0;j<15;j++){const mean=(low+high)/2;let count=0;for(let i=0;i<noise.length;i++){const g=Math.round(Math.max(0,Math.min(255,mean+noise[i]*sigma))),v=Math.max(g,plate[i])*.6+g*.4;if(v<161)count++;}if(count/noise.length>target)low=mean;else high=mean;}profile.push([gray,Math.round((low+high)/2*100)/100]);}
console.log(JSON.stringify({desired,profile}));
