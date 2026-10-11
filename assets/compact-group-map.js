/* HIGH OS · compact Group map, read-only; shares Mission Planner's GTA tile projection. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 let map,marker,lastKey='',coords=null,observer;
 const empty='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
 const status=msg=>{if($('compactMapStatus'))$('compactMapStatus').textContent=msg};
 function findCoords(){
  const mount=$('groupProfileMount');
  if(!mount)return null;
  const text=mount.innerText||'';
  // Only read the explicitly labeled principal/QG coordinate, not arbitrary recipe quantities.
  const patterns=[
   /(?:LOCALIZAÇÃO PRINCIPAL|COORDENADAS(?: DO QG)?|CDS(?: DO QG)?)[\s\S]{0,120}?(-?\d{2,5}(?:\.\d+)?)[,;\s]+(-?\d{2,5}(?:\.\d+)?)[,;\s]+(-?\d{1,5}(?:\.\d+)?)/i,
   /\{\s*(-?\d{2,5}\.\d+)\s*,\s*(-?\d{2,5}\.\d+)\s*,\s*(-?\d{1,5}\.\d+)/i
  ];
  for(const re of patterns){const m=text.match(re);if(m){const values=m.slice(1,4).map(Number);if(values.every(Number.isFinite)&&Math.abs(values[0])<10000&&Math.abs(values[1])<10000)return values;}}
  return null;
 }
 function ensureMap(){
  if(map||!window.L||!$('compactGroupMap'))return;
  const crs=L.extend({},L.CRS.Simple,{projection:L.Projection.LonLat,scale:z=>Math.pow(2,z),zoom:s=>Math.log(s)/Math.LN2,distance:(a,b)=>Math.hypot(b.lng-a.lng,b.lat-a.lat),transformation:new L.Transformation(.02072,117.3,-.0205,172.8),infinite:true});
  const Safe=L.TileLayer.extend({getTileUrl(c){const max=2**c.z-1;if(c.x<0||c.y<0||c.x>max||c.y>max)return empty;return 'https://cdn.jsdelivr.net/gh/Trusted-Studios/mapStyles@main/styleAtlas/'+c.z+'/'+c.x+'/'+c.y+'.jpg'}});
  map=L.map('compactGroupMap',{crs,minZoom:1,maxZoom:5,zoomControl:true,attributionControl:false}).setView([0,0],2);
  new Safe('',{minZoom:0,maxZoom:5,noWrap:true,errorTileUrl:empty}).addTo(map);
  setTimeout(()=>map&&map.invalidateSize(),100);
 }
 function refresh(){
  const page=$('page-group-profile');if(!page||!page.classList.contains('active'))return;
  const next=findCoords(),title=$('groupProfilePageTitle')?.textContent?.trim()||'Group';
  const key=title+'|'+(next?next.join(','):'none');
  ensureMap();if(!map)return;
  if(key!==lastKey){
   lastKey=key;coords=next;
   if(marker){map.removeLayer(marker);marker=null;}
   if(next){
    const [x,y,z]=next;
    marker=L.circleMarker([y,x],{radius:9,color:'#fff',weight:2,fillColor:'#a239ff',fillOpacity:.9}).addTo(map);
    marker.bindPopup('<strong>'+title.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</strong><br>QG: '+x+', '+y+', '+z);
    map.setView([y,x],4);status('QG: '+next.join(', ')+' · Marcador de consulta');
   }else{map.setView([0,0],2);status('Sem coordenadas principais reconhecidas neste cadastro. O mapa continua disponível para consulta.');}
  }
  map.invalidateSize();
 }
 document.addEventListener('DOMContentLoaded',()=>{
  $('compactMapFocus')?.addEventListener('click',()=>{refresh();if(map&&coords)map.setView([coords[1],coords[0]],5)});
  $('compactMapCopy')?.addEventListener('click',async()=>{refresh();if(!coords){status('Nenhuma CDS principal disponível para copiar.');return;}try{await navigator.clipboard.writeText(coords.join(', '));status('CDS copiada: '+coords.join(', '))}catch(e){status('CDS: '+coords.join(', '))}});
  observer=new MutationObserver(()=>{if($('page-group-profile')?.classList.contains('active'))requestAnimationFrame(refresh)});
  observer.observe($('page-group-profile')||document.body,{subtree:true,childList:true,attributes:false});
  document.addEventListener('click',()=>setTimeout(refresh,120));
  setInterval(()=>{if($('page-group-profile')?.classList.contains('active'))refresh()},2000);
 });
})();
