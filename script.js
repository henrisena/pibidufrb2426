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
