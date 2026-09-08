import * as T from 'three';

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
