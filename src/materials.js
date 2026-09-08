import * as T from 'three';

export function materials(){
 // Porsche Fjord Green: solid gloss (not metallic). Digital approximation of the reference swatch.
 // https://www.carpaints.co/paints/detail/fjord-green
 // Very subtle surface microstructure beneath a smooth clear coat.
 const n=128,data=new Uint8Array(n*n*4);let seed=1976;for(let i=0;i<n*n;i++){seed=(1664525*seed+1013904223)>>>0;const v=124+(seed%9);data.set([v,v,255,255],i*4);}const normal=new T.DataTexture(data,n,n,T.RGBAFormat);normal.wrapS=normal.wrapT=T.RepeatWrapping;normal.repeat.set(90,90);normal.needsUpdate=true;
 return {
 paint:new T.MeshPhysicalMaterial({color:0x102e33,metalness:0,roughness:.19,clearcoat:1,clearcoatRoughness:.065,normalMap:normal,normalScale:new T.Vector2(.025,.025),envMapIntensity:1.15}),
 rubber:new T.MeshStandardMaterial({color:0x111416,roughness:.86,metalness:0}),
 trim:new T.MeshStandardMaterial({color:0x111b1e,metalness:.12,roughness:.48}),
 chrome:new T.MeshStandardMaterial({color:0xe2e6e7,metalness:1,roughness:.115,envMapIntensity:1.2}),
 glass:new T.MeshPhysicalMaterial({color:0x07181e,metalness:.08,roughness:.065,ior:1.52,clearcoat:1,clearcoatRoughness:.025,envMapIntensity:1.7}),
 light:new T.MeshPhysicalMaterial({color:0xd7e2e8,metalness:.35,roughness:.14,clearcoat:1}),
 amber:new T.MeshPhysicalMaterial({color:0xe38217,roughness:.24,clearcoat:1,emissive:0x7b3104,emissiveIntensity:.13}),
 red:new T.MeshPhysicalMaterial({color:0xa90814,roughness:.22,clearcoat:1,emissive:0x67030a,emissiveIntensity:.1})
 };
}

export function studioEnvironment(){
 const s=new T.Scene();s.background=new T.Color('#3c484e');
 function panel(w,h,pos,target,intensity,color){const m=new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity),side:T.DoubleSide});const o=new T.Mesh(new T.PlaneGeometry(w,h),m);o.position.set(...pos);o.lookAt(...target);s.add(o);}
 panel(18,9,[-3,10,1],[0,0,0],2.1,'#fff8ed');
 panel(16,3.5,[1,4.5,8],[0,1,0],2.2,'#f4f7f6');
 panel(12,1.2,[0,2,-7],[0,1,0],2.8,'#ffffff');
 panel(3,7,[-8,3,-3],[0,1,0],2,'#f2f5f4');
 panel(4,6,[8,2,1],[0,1,0],1.7,'#f4e9d8');
 return s;
}
