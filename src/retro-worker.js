import { renderRetro } from './retro-print.js';
self.onmessage=({data:{id,pixels,width,height,settings,stages=false}})=>{
 try{const result=renderRetro(new Uint8ClampedArray(pixels),width,height,settings,{stages,maxPreviewEdge:600});const previews=result.stages.map(s=>({...s,pixels:s.pixels.buffer}));self.postMessage({id,pixels:result.pixels.buffer,width,height,stages:previews,maskKind:result.maskKind},[result.pixels.buffer,...previews.map(s=>s.pixels)]);}
 catch(error){self.postMessage({id,error:error.message});}
};
