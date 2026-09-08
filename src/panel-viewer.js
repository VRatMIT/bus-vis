import * as THREE from 'three';
import { PANELS, SHEET, pathData, highlightGeometry } from './panels.js';
import './panel-viewer.css';

const NS='http://www.w3.org/2000/svg';
const cameraViews={side:[0,4,13],hero:[-9,5,10],passenger:[-3,4,-13],rear:[12,4,5],front:[-12,4,2],top:[0,15,.1]};
const dimensions=p=>`${Math.round(p.w*1000)} × ${Math.round(p.h*1000)} mm`;
export function createPanelViewer({scene,camera,controls,renderer,bus,floor,floorGrid,resize,cancelTransition}){
 let open=false,selected=null,saved=null,scroll=0,highlight=null;
 const toggle=document.createElement('button');toggle.id='panel-toggle';toggle.textContent='PANEL VIEWER';toggle.setAttribute('aria-expanded','false');document.querySelector('#app').append(toggle);
 const root=document.createElement('section');root.id='panel-viewer';root.hidden=true;root.setAttribute('aria-label','Exterior panel viewer');
 root.innerHTML=`<header class="panel-header"><div class="panel-heading"><button id="panel-back" hidden>← All panels</button><strong id="panel-title">Exterior panels</strong><span id="panel-count"></span></div><div class="panel-actions"><button id="panel-export">Download SVG</button><button id="panel-close">Back to 3D ↗</button></div></header><div class="panel-info"><span id="panel-description">Same-scale panel net · Hover to highlight · Click to isolate</span><span>Approximate model dimensions · Verify on the bus before cutting</span></div><div class="panel-scroll"><div id="panel-drawing"></div></div><div class="panel-status" aria-live="polite">Choose a panel</div><div class="mini-caption" hidden>3D location · Drag to orbit</div>`;
 document.querySelector('#app').append(root);
 const drawing=root.querySelector('#panel-drawing'),scroller=root.querySelector('.panel-scroll'),status=root.querySelector('.panel-status');
 root.querySelector('#panel-count').textContent=`${PANELS.length} panels`;
 function svgElement(name,attrs={}){const el=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;}
 function draw(panel=null,exporting=false){
  const padding=panel?.18:0;const w=panel?panel.w+padding*2:SHEET.width,h=panel?panel.h+padding*2:SHEET.height;
  const svg=svgElement('svg',{xmlns:NS,viewBox:`0 0 ${w} ${h}`,width:exporting?`${w*1000}mm`:'100%',height:exporting?`${h*1000}mm`:'auto','aria-label':panel?panel.name:'All exterior panels at a consistent scale'});
  if(!exporting){const defs=svgElement('defs');const pattern=svgElement('pattern',{id:'panel-paper',width:.1,height:.1,patternUnits:'userSpaceOnUse'});pattern.append(svgElement('circle',{cx:0,cy:0,r:.003,fill:'#506663'}));defs.append(pattern);svg.append(defs,svgElement('rect',{width:w,height:h,fill:'url(#panel-paper)'}));}
  for(const p of panel?[panel]:PANELS){
   const [x,y]=panel?[padding,padding]:p.at;const g=svgElement('g',{transform:`translate(${x} ${y})`,'data-panel':p.id});
   const path=svgElement('path',{d:pathData(p),'fill-rule':'evenodd',fill:exporting?'none':'#182a2b',stroke:exporting?'#111111':'#8aaca7','stroke-width':exporting?.004:.009,'stroke-linejoin':'round','data-panel-path':p.id});
   const title=svgElement('title');title.textContent=`${p.name} — ${dimensions(p)}`;path.append(title);g.append(path);
   if(!exporting){g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',`${p.name}, ${dimensions(p)}. Open panel.`);
    g.addEventListener('pointerenter',()=>{status.textContent=`${p.name} · ${dimensions(p)}`;});g.addEventListener('focus',()=>{status.textContent=`${p.name} · ${dimensions(p)}`;});
    g.addEventListener('click',()=>select(p));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p);}});
   }
   // Labels are outside the cut geometry and never exported into wrap outlines.
   if(!exporting){const label=svgElement('text',{x:.025,y:.085,'font-size':Math.min(.075,p.w/13),fill:'#d0e1dd','pointer-events':'none'});label.textContent=p.name;g.append(label);}
   svg.append(g);
  }
  return svg;
 }
 function clearHighlight(){if(!highlight)return;scene.remove(highlight);highlight.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});highlight=null;}
 function mark(panel){clearHighlight();highlight=new THREE.Group();highlight.name='Selected panel: '+panel.id;
  const geometry=highlightGeometry(panel);const material=new THREE.MeshBasicMaterial({color:0x50ffcf,transparent:true,opacity:.62,side:THREE.DoubleSide,depthTest:false,depthWrite:false});const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=100;highlight.add(mesh);
  for(const contour of [panel.outer,...panel.holes]){const points=[...contour,contour[0]].map(([u,v])=>new THREE.Vector3(...panel.map(u,v)));const outline=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xbaffee,depthTest:false,transparent:true,opacity:1}));outline.renderOrder=101;highlight.add(outline);}
  scene.add(highlight);
 }
 function select(panel){if(!selected)scroll=scroller.scrollTop;selected=panel;document.body.classList.add('panel-detail');root.querySelector('#panel-back').hidden=false;root.querySelector('.mini-caption').hidden=false;root.querySelector('#panel-title').textContent=panel.name;root.querySelector('#panel-count').textContent=dimensions(panel);root.querySelector('#panel-description').textContent=panel.note||'Paintable panel outline · Windows and openings are punched out';drawing.replaceChildren(draw(panel));scroller.scrollTop=0;mark(panel);
  camera.position.set(...cameraViews[panel.view]);controls.target.set(0,1.4,0);controls.minDistance=6;controls.maxDistance=22;controls.update();resize();status.textContent='Selected panel highlighted on the 3D bus';
 }
 function overview(){selected=null;clearHighlight();document.body.classList.remove('panel-detail');root.querySelector('#panel-back').hidden=true;root.querySelector('.mini-caption').hidden=true;root.querySelector('#panel-title').textContent='Exterior panels';root.querySelector('#panel-count').textContent=`${PANELS.length} panels`;root.querySelector('#panel-description').textContent='Same-scale panel net · Hover to highlight · Click to isolate';drawing.replaceChildren(draw());scroller.scrollTop=scroll;status.textContent='Choose a panel';}
 function show(){if(open)return;cancelTransition();open=true;saved={position:camera.position.clone(),target:controls.target.clone(),auto:controls.autoRotate,min:controls.minDistance,max:controls.maxDistance};controls.autoRotate=false;root.hidden=false;document.body.classList.add('panel-mode');toggle.setAttribute('aria-expanded','true');floor.visible=false;floorGrid.mesh.visible=false;floorGrid.terrain.visible=false;overview();root.querySelector('#panel-close').focus();}
 function close(){if(!open)return;open=false;clearHighlight();root.hidden=true;document.body.classList.remove('panel-mode','panel-detail');toggle.setAttribute('aria-expanded','false');camera.position.copy(saved.position);controls.target.copy(saved.target);controls.autoRotate=saved.auto;controls.minDistance=saved.min;controls.maxDistance=saved.max;floor.visible=true;floorGrid.mesh.visible=true;floorGrid.terrain.visible=true;controls.update();resize();toggle.focus();}
 toggle.onclick=show;root.querySelector('#panel-close').onclick=close;root.querySelector('#panel-back').onclick=overview;
 root.querySelector('#panel-export').onclick=()=>{const svg=draw(selected,true);const description=svgElement('desc');description.textContent='Approximate bus-model panel projections in millimetres. Verify dimensions and curved-surface allowances on the vehicle before printing or cutting.';svg.prepend(description);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=url;a.download=selected?`bus-panel-${selected.id}.svg`:'bus-panel-sheet.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 document.addEventListener('keydown',e=>{if(open&&e.key==='Escape'){selected?overview():close();}});
 return {get active(){return open;},get selected(){return selected;},get render3D(){return !open||!!selected;},select,close,show};
}
