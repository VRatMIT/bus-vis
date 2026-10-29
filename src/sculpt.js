import * as T from 'three';

// Rounded rectangular stations with independent roof and chin radii. Interpolate
// dimensions at actual X positions so long straight panels meet curved ends cleanly.
// Sections: x, half-width, bottom, top, upper radius, lower radius.
export function roundedLoft(sections,slices=160,cornerSteps=16,crown=.025){
 const p=[],uv=[],ix=[],rings=4*(cornerSteps+1)+7,slopes=sections.map(()=>[]);
 for(let n=1;n<6;n++)for(let k=0;k<sections.length;k++){
  const delta=i=>(sections[i+1][n]-sections[i][n])/(sections[i+1][0]-sections[i][0]);
  const a=delta(Math.max(0,k-1)),b=delta(Math.min(sections.length-2,k));
  slopes[k][n]=a*b<=0?0:2*a*b/(a+b);
 }
 for(let j=0;j<=slices;j++){
  const x=T.MathUtils.lerp(sections[0][0],sections.at(-1)[0],j/slices);
  let k=0;while(k<sections.length-2&&x>sections[k+1][0])k++;
  const a=sections[k],b=sections[k+1],dx=b[0]-a[0],t=(x-a[0])/dx;
  const v=[x];for(let n=1;n<6;n++)v[n]=(2*t**3-3*t*t+1)*a[n]+(t**3-2*t*t+t)*dx*slopes[k][n]+(-2*t**3+3*t*t)*b[n]+(t**3-t*t)*dx*slopes[k+1][n];
  const [,w,bottom,top]=v,rt=Math.min(v[4],w,(top-bottom)/2),rb=Math.min(v[5],w,(top-bottom)/2);
  const rise=Math.min(crown,(top-bottom)/8);
  const corners=[[w-rt,top-rt-rise,rt],[-w+rt,top-rt-rise,rt],[-w+rb,bottom+rb,rb],[w-rb,bottom+rb,rb]];
  const ring=[];for(let c=0;c<4;c++)for(let i=0;i<=cornerSteps;i++){
   const [z,y,r]=corners[c],theta=(c+i/cornerSteps)*Math.PI/2;
   ring.push([x,y+r*Math.sin(theta),z+r*Math.cos(theta)]);
   if(c===0&&i===cornerSteps)for(let q=1;q<8;q++)ring.push([x,top-rise*(2*q/8-1)**2,T.MathUtils.lerp(w-rt,-w+rt,q/8)]);
  }
  ring.push(ring[0]);ring.forEach((point,i)=>{p.push(...point);uv.push(j/slices,i/rings);});
 }
 for(let j=0;j<slices;j++)for(let i=0;i<rings;i++){const a=j*(rings+1)+i,b=a+rings+1;ix.push(a,b,a+1,b,b+1,a+1);}
 for(const end of [0,slices]){const start=p.length/3,sec=sections[end?sections.length-1:0];p.push(sec[0],(sec[2]+sec[3])/2,0);uv.push(.5,.5);for(let i=0;i<=rings;i++){const n=(end*(rings+1)+i)*3;p.push(p[n],p[n+1],p[n+2]);uv.push(0,0);if(i)end?ix.push(start,start+i+1,start+i):ix.push(start,start+i,start+i+1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}

// Closed, smoothly shaded loft. Sections: x, half-width, bottom, top.
export function loft(sections,roundness=.38,slices=64,rings=96){
 const p=[],uv=[],ix=[];
 for(let j=0;j<=slices;j++){
  const t=j/slices*(sections.length-1),k=Math.min(sections.length-2,Math.floor(t)),f=t-k;
  const v=sections[k].map((a,n)=>T.MathUtils.lerp(a,sections[k+1][n],f*f*(3-2*f)));
  for(let i=0;i<=rings;i++){const a=i/rings*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(v[0],(v[2]+v[3])/2+Math.sign(s)*Math.pow(Math.abs(s),roundness)*(v[3]-v[2])/2,Math.sign(c)*Math.pow(Math.abs(c),roundness)*v[1]);uv.push(j/slices,i/rings);}
 }
 for(let j=0;j<slices;j++)for(let i=0;i<rings;i++){const a=j*(rings+1)+i,b=a+rings+1;ix.push(a,b,a+1,b,b+1,a+1);}
 // Separate cap vertices keep the end-face normals distinct from the curved shell.
 for(const end of [0,slices]){const start=p.length/3,sec=sections[end?sections.length-1:0];p.push(sec[0],(sec[2]+sec[3])/2,0);uv.push(.5,.5);for(let i=0;i<=rings;i++){const n=(end*(rings+1)+i)*3;p.push(p[n],p[n+1],p[n+2]);uv.push(0,0);if(i)end?ix.push(start,start+i+1,start+i):ix.push(start,start+i,start+i+1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}

export function surface(fn,nu=40,nv=24){const p=[],uv=[],ix=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...fn(i/nu,j/nv));uv.push(i/nu,j/nv);}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;ix.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}

export function labelMaterial(text,{color='#d9e1df',background=null,size=512,italic=false}={}){
 const c=document.createElement('canvas');c.width=size;c.height=128;const ctx=c.getContext('2d');if(background){ctx.fillStyle=background;ctx.fillRect(0,0,size,128);}ctx.fillStyle=color;ctx.font=`${italic?'italic ':''}600 76px ${italic?'serif':'sans-serif'}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,size/2,67,size-24);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map,transparent:true,roughness:.35,metalness:.35,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
}
