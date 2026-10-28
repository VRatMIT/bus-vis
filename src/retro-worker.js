import { retroPixels } from './retro-print.js';
self.onmessage=({data:{id,pixels,width,height,settings}})=>{
 try{const output=retroPixels(new Uint8ClampedArray(pixels),width,height,settings);self.postMessage({id,pixels:output.buffer,width,height},[output.buffer]);}
 catch(error){self.postMessage({id,error:error.message});}
};
