import { PANELS, pathData } from './panels.js';

// One coordinate system in metres, rather than a separate image transform for
// each panel. Side elevations follow the actual bus X/Y dimensions; door leaves
// and their surround therefore sample the same artwork at the same location.
// The body belt unfolds driver -> rear -> entry -> front. Its closing cut wraps
// periodically. Roofs/caps remain projected outlines, as in the panel viewer.
const X_MIN=-4.065,X_MAX=4.055,WIDTH=2.43,TOP=3.075;
const LENGTH=X_MAX-X_MIN;
export const BELT_PERIOD=2*(LENGTH+WIDTH);

export const WRAP_VIEWS=[
 {id:'driver',name:'Driver side',view:'side'},
 {id:'passenger',name:'Entry side',view:'passenger'},
 {id:'rear',name:'Rear',view:'rear'},
 {id:'front',name:'Front',view:'front'},
 {id:'roof',name:'Coach roof & cap',view:'top'},
 {id:'hood',name:'Hood',view:'hero'},
 {id:'cab-roof',name:'Cab roof',view:'top'},
 {id:'wrap',name:'Whole exterior · unfolded',view:'hero'}
];

function family(panel){
 if(panel.id==='hood'||panel.id==='cab-roof')return panel.id;
 if(panel.view==='top')return 'roof';
 if(['passenger','rear','front'].includes(panel.view))return panel.view;
 return 'driver';
}
function chartPoint(group,[x,y,z]){
 switch(group){
  case 'driver':return [x-X_MIN,WIDTH+TOP-y];
  case 'rear':return [LENGTH+WIDTH/2-z,WIDTH+TOP-y];
  case 'passenger':return [LENGTH+WIDTH+X_MAX-x,WIDTH+TOP-y];
  case 'front':return [2*LENGTH+WIDTH+z+WIDTH/2,WIDTH+TOP-y];
  case 'roof':return [x-X_MIN,z+WIDTH/2];
  // These surfaces lie underneath the overhang in plan view. Separate islands
  // avoid falsely superimposing physically different surfaces in the canvas.
  case 'hood':return [x+3.965,z-.96-1.0];
  case 'cab-roof':return [x+2.345+1.65,z-.995-1.0];
 }
}
export const PLACEMENTS=PANELS.map(panel=>{
 const group=family(panel),at=chartPoint(group,panel.map(0,0));
 return {panel,group,x:at[0],y:at[1],w:panel.w,h:panel.h,belt:['driver','rear','passenger','front'].includes(group)};
});
export const placementFor=id=>PLACEMENTS.find(p=>p.panel.id===(typeof id==='string'?id:id.id));
export function viewPlacements(view){return view==='wrap'?PLACEMENTS:PLACEMENTS.filter(p=>p.group===view);}
export function viewBounds(view){
 const ps=viewPlacements(view),x=Math.min(...ps.map(p=>p.x)),y=Math.min(...ps.map(p=>p.y));
 return {x,y,w:Math.max(...ps.map(p=>p.x+p.w))-x,h:Math.max(...ps.map(p=>p.y+p.h))-y};
}
export function localToWrap(panel,u,v){const p=placementFor(panel);return [p.x+u,p.y+v];}
export function wrapToLocal(panel,x,y){const p=placementFor(panel);return [x-p.x,y-p.y];}
export function artworkBounds(layer,asset){
 const h=layer.width*asset.height/asset.width,a=layer.rotation*Math.PI/180;
 const w=Math.abs(Math.cos(a))*layer.width+Math.abs(Math.sin(a))*h;
 const height=Math.abs(Math.sin(a))*layer.width+Math.abs(Math.cos(a))*h;
 return {x:layer.x-w/2,y:layer.y-height/2,w,h:height};
}
export function intersects(a,b){const epsilon=1e-7;return a.x+a.w>b.x+epsilon&&a.x<b.x+b.w-epsilon&&a.y+a.h>b.y+epsilon&&a.y<b.y+b.h-epsilon;}
export function layerShifts(layer,asset,placement){
 if(layer.clipPanel&&layer.clipPanel!==placement.panel.id)return [];
 const bounds=artworkBounds(layer,asset),shifts=placement.belt&&!layer.clipPanel?[0,-BELT_PERIOD,BELT_PERIOD]:[0];
 return shifts.filter(shift=>intersects({...bounds,x:bounds.x+shift},placement));
}
export function panelLayers(project,panel){
 const placement=placementFor(panel),assets=new Map(project.assets.map(a=>[a.id,a]));
 return project.layers.flatMap(layer=>layerShifts(layer,assets.get(layer.asset),placement).map(shift=>({...layer,x:layer.x+shift-placement.x,y:layer.y-placement.y,wrapShift:shift})));
}
export function coveredPanels(project,layer){const asset=project.assets.find(a=>a.id===layer.asset);return PLACEMENTS.filter(p=>layerShifts(layer,asset,p).length).map(p=>p.panel.id);}
export function pathAt(placement){return {d:pathData(placement.panel),transform:`translate(${placement.x} ${placement.y})`};}

// Preserve every v1 image's position, appearance and panel clipping. Unchecking
// "Clip to one panel" releases a migrated layer into the connected canvas.
export function migrateProject(project){
 if(project.version===2)return project;
 const layers=[];
 for(const [id,list] of Object.entries(project.layers)){
  const p=placementFor(id);
  for(const layer of list)layers.push({...layer,x:layer.x+p.x,y:layer.y+p.y,clipPanel:id});
 }
 return {...project,version:2,view:placementFor(project.panel).group,layers};
}
