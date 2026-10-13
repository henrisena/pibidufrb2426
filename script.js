// Dados demonstrativos. Na próxima etapa, esta fonte será substituída pelos dados do formulário/planilha.
const contributions=[
{area:"História",title:"Memórias da comunidade",text:"Estudantes entrevistam moradores, registram fotografias e documentos e constroem um mapa digital das memórias da comunidade.",product:"Memorial digital",tags:["memória","história local","mapa"],institution:"UFRB",school:"Escola A",reflection:"Os estudantes deixam de ser apenas consumidores e passam a produzir um acervo sobre sua comunidade."},
{area:"Biologia",title:"Biodiversidade no entorno da escola",text:"A turma registra espécies encontradas no território, reúne imagens e informações e constrói coletivamente um inventário digital.",product:"Inventário digital",tags:["território","fotografia","meio ambiente"],institution:"UFRB",school:"Escola B",reflection:"O ambiente digital permite reunir observações produzidas por diferentes estudantes em uma investigação comum."},
{area:"Matemática",title:"A escola em dados",text:"Estudantes levantam dados sobre os espaços e rotinas escolares, organizam as informações e produzem visualizações para discutir a própria escola.",product:"Painel de dados",tags:["dados","escola","visualização"],institution:"UFRB",school:"Escola C",reflection:"Produzir e interpretar dados da própria realidade transforma o estudante em autor da investigação."},
{area:"Letras",title:"Vozes e narrativas do território",text:"Estudantes registram narrativas orais, editam os áudios e organizam uma coleção digital sobre modos de falar e contar histórias.",product:"Acervo sonoro",tags:["oralidade","território","arquivo"],institution:"UFRB",school:"Escola D",reflection:"O conhecimento produzido pela turma passa a circular para além da sala de aula."}
];
let current="Todos";
const uniq=a=>[...new Set(a.filter(Boolean))];
function counts(field){return Object.entries(contributions.reduce((o,x)=>(o[x[field]]=(o[x[field]]||0)+1,o),{})).sort((a,b)=>b[1]-a[1])}
function render(){
 const data=current==="Todos"?contributions:contributions.filter(x=>x.area===current);
 document.querySelector("#cards").innerHTML=data.map(x=>`<article class="card"><span class="area">${x.area.toUpperCase()}</span><h3>${x.title}</h3><p>${x.text}</p><div class="chips">${x.tags.map(t=>`<span>${t}</span>`).join("")}</div><div class="meta"><b>Produção:</b> ${x.product}<br>${x.area} · ${x.institution}</div></article>`).join("");
 const areas=["Todos",...uniq(contributions.map(x=>x.area))];
 document.querySelector("#filters").innerHTML=areas.map(a=>`<button class="${a===current?"active":""}" data-area="${a}">${a}</button>`).join("");
 document.querySelectorAll("#filters button").forEach(b=>b.onclick=()=>{current=b.dataset.area;render()});
}
function init(){
 document.querySelector("#nContrib").textContent=contributions.length;
 document.querySelector("#nAreas").textContent=uniq(contributions.map(x=>x.area)).length;
 document.querySelector("#nInstit").textContent=uniq(contributions.map(x=>x.institution)).length;
 document.querySelector("#nEscolas").textContent=uniq(contributions.map(x=>x.school)).length;
 document.querySelector("#quotes").innerHTML=contributions.slice(0,3).map(x=>`<div class="quote">“${x.reflection}”</div>`).join("");
 const tagCounts={}; contributions.flatMap(x=>x.tags).forEach(t=>tagCounts[t]=(tagCounts[t]||0)+1);
 document.querySelector("#tags").innerHTML=Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`<span style="font-size:${1+Math.min(n,4)*.18}rem">${t}</span>`).join("");
 document.querySelector("#areaList").innerHTML=counts("area").map(([x,n])=>`<div class="rank"><span>${x}</span><b>${n}</b></div>`).join("");
 document.querySelector("#instList").innerHTML=counts("institution").map(([x,n])=>`<div class="rank"><span>${x}</span><b>${n}</b></div>`).join("");
 render();
}
init();