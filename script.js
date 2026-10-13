// Integração do mural ao vivo.
const DATA_ENDPOINT = "https://script.google.com/macros/s/AKfycbwKPkvD3zo9JrQHUG83GFrA8g0C-QAAeaRKoT67025Ztl2ffeUaSPv959vgUxaspztsGA/exec";
const REFRESH_MS = 10000;

const demoContributions=[
 {area:"História",title:"Memórias da comunidade",text:"Estudantes entrevistam moradores, registram fotografias e documentos e constroem um mapa digital das memórias da comunidade.",product:"Memorial digital",tags:["memória","história local","mapa"],institution:"UFRB",school:"Escola A",reflection:"Os estudantes deixam de ser apenas consumidores e passam a produzir um acervo sobre sua comunidade."},
 {area:"Biologia",title:"Biodiversidade no entorno da escola",text:"A turma registra espécies encontradas no território, reúne imagens e informações e constrói coletivamente um inventário digital.",product:"Inventário digital",tags:["território","fotografia","meio ambiente"],institution:"UFRB",school:"Escola B",reflection:"O ambiente digital permite reunir observações produzidas por diferentes estudantes em uma investigação comum."},
 {area:"Matemática",title:"A escola em dados",text:"Estudantes levantam dados sobre os espaços e rotinas escolares, organizam as informações e produzem visualizações para discutir a própria escola.",product:"Painel de dados",tags:["dados","escola","visualização"],institution:"UFRB",school:"Escola C",reflection:"Produzir e interpretar dados da própria realidade transforma o estudante em autor da investigação."},
 {area:"Letras",title:"Vozes e narrativas do território",text:"Estudantes registram narrativas orais, editam os áudios e organizam uma coleção digital sobre modos de falar e contar histórias.",product:"Acervo sonoro",tags:["oralidade","território","arquivo"],institution:"UFRB",school:"Escola D",reflection:"O conhecimento produzido pela turma passa a circular para além da sala de aula."}
];

let contributions=[], current="Todos", usingLiveData=false;
const mapCoordinates={"cruz das almas":[-12.6703,-39.1144]};
const geocodePending=new Set();
let bahiaMap=null, mapMarkers=null;
const cityKey=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s*[-,]\s*(bahia|ba)$/i,"").trim();
function initMap(){
 if(bahiaMap||!window.L)return;
 bahiaMap=L.map("bahiaMap",{scrollWheelZoom:false,zoomControl:true,minZoom:5,maxZoom:12,maxBounds:[[-19,-47.5],[-8,-36.5]],maxBoundsViscosity:0.8}).setView([-12.7,-41.5],6);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:"&copy; OpenStreetMap contributors"}).addTo(bahiaMap);
 mapMarkers=L.layerGroup().addTo(bahiaMap);
}
async function locateCity(name){
 const key=cityKey(name);
 if(mapCoordinates[key]||geocodePending.has(key))return;
 geocodePending.add(key);
 try{
  const url="https://nominatim.openstreetmap.org/search?city="+encodeURIComponent(name)+"&state=Bahia&country=Brazil&format=json&limit=3";
  const res=await fetch(url);if(!res.ok)throw new Error("geocodificação indisponível");
  const places=await res.json();
  const place=places.find(p=>/Bahia/i.test(p.display_name||"") && Number(p.lat)<-8.4 && Number(p.lat)>-18.4 && Number(p.lon)<-37 && Number(p.lon)>-47);
  if(place){mapCoordinates[key]=[Number(place.lat),Number(place.lon)];renderMap()}
 }catch(e){console.warn("Não foi possível localizar o município:",name,e)}
 finally{geocodePending.delete(key)}
}
function renderMap(){
 initMap();if(!bahiaMap)return;
 mapMarkers.clearLayers();
 const groups=new Map();
 contributions.forEach(x=>{if(!x.city)return;const key=cityKey(x.city);if(!groups.has(key))groups.set(key,{name:x.city,items:[]});groups.get(key).items.push(x)});
 let located=0;
 groups.forEach((group,key)=>{
  const coords=mapCoordinates[key];if(!coords){locateCity(group.name);return}
  located++;
  const items=group.items.map(x=>`<li><strong>${esc(x.title)}</strong><br><small>${esc(x.area)} · ${esc(x.school)}</small></li>`).join("");
  const popup=`<div class="map-popup"><strong>${esc(group.name)}</strong><p>${group.items.length} ${group.items.length===1?"contribuição":"contribuições"}</p><ul>${items}</ul></div>`;
  L.circleMarker(coords,{radius:Math.min(16,8+group.items.length*2),color:"#fffdf8",weight:2,fillColor:"#bd4b32",fillOpacity:0.95}).addTo(mapMarkers).bindPopup(popup,{maxWidth:300});
 });
 document.querySelector("#mapStatus").textContent=located?`${located} ${located===1?"município representado":"municípios representados"} no mapa. Clique nos pontos para ver as propostas.`:"Ainda não há municípios localizados no mapa.";
}

const uniq=a=>[...new Set(a.filter(Boolean))];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function counts(field){return Object.entries(contributions.reduce((o,x)=>{const v=x[field];if(v)o[v]=(o[v]||0)+1;return o},{})).sort((a,b)=>b[1]-a[1])}
function render(){
 const data=current==="Todos"?contributions:contributions.filter(x=>x.area===current);
 document.querySelector("#cards").innerHTML=data.map(x=>`<article class="card">${x.image?`<img class="card-image" src="${esc(x.image)}" alt="Imagem da atividade ${esc(x.title)}" loading="lazy">`:""}<span class="area">${esc(x.area).toUpperCase()}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><div class="chips">${(x.tags||[]).map(t=>`<span>${esc(t)}</span>`).join("")}</div><div class="meta"><b>Produção:</b> ${esc(x.product)}<br>${esc(x.area)}${x.school?" · "+esc(x.school):""}</div></article>`).join("") || '<p>Aguardando as primeiras contribuições.</p>';
 const areas=["Todos",...uniq(contributions.map(x=>x.area))];
 document.querySelector("#filters").innerHTML=areas.map(a=>`<button class="${a===current?"active":""}" data-area="${esc(a)}">${esc(a)}</button>`).join("");
 document.querySelectorAll("#filters button").forEach(b=>b.onclick=()=>{current=b.dataset.area;render()});
 document.querySelector("#nContrib").textContent=contributions.length;
 document.querySelector("#nAreas").textContent=uniq(contributions.map(x=>x.area)).length;
 document.querySelector("#nInstit").textContent=uniq(contributions.map(x=>x.institution)).length;
 document.querySelector("#nEscolas").textContent=uniq(contributions.map(x=>x.school)).length;
 document.querySelector("#quotes").innerHTML=contributions.filter(x=>x.reflection).slice(0,6).map(x=>`<div class="quote">“${esc(x.reflection)}”</div>`).join("");
 const tagCounts={}; contributions.flatMap(x=>x.tags||[]).forEach(t=>tagCounts[t]=(tagCounts[t]||0)+1);
 document.querySelector("#tags").innerHTML=Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`<span style="font-size:${1+Math.min(n,4)*.18}rem">${esc(t)}</span>`).join("");
 document.querySelector("#areaList").innerHTML=counts("area").map(([x,n])=>`<div class="rank"><span>${esc(x)}</span><b>${n}</b></div>`).join("");
 document.querySelector("#instList").innerHTML=counts("institution").map(([x,n])=>`<div class="rank"><span>${esc(x)}</span><b>${n}</b></div>`).join("");
 renderMap();
}
async function loadLive(){
 if(!DATA_ENDPOINT){document.querySelector("#updated").textContent="dados demonstrativos";return}
 try{
   const res=await fetch(DATA_ENDPOINT+"?t="+Date.now(),{cache:"no-store"});
   if(!res.ok) throw new Error("HTTP "+res.status);
   const json=await res.json();
   const rows=Array.isArray(json)?json:(json.contributions||[]);
   contributions=rows.map(x=>({
     area:String(x.area||"").trim(), school:String(x.school||"").trim(),
     title:String(x.title||"Sem título").trim(), text:String(x.description||x.text||"").trim(),
     product:String(x.product||"").trim(), reflection:String(x.reflection||"").trim(),
     institution:String(x.institution||"").trim(), city:String(x.city||"").trim(),
     image:String(x.image||"").trim(),
     tags:Array.isArray(x.tags)?x.tags:String(x.tags||"").split(",").map(t=>t.trim()).filter(Boolean)
   })).filter(x=>x.area||x.title||x.text);
   usingLiveData=true; if(current!=="Todos" && !contributions.some(x=>x.area===current))current="Todos"; render();
   document.querySelector("#updated").textContent="atualizado agora";
 }catch(e){
   document.querySelector("#updated").textContent=usingLiveData?"falha temporária · mantendo últimos dados":"aguardando conexão com a planilha";
 }
}
render(); loadLive(); setInterval(loadLive,REFRESH_MS);
