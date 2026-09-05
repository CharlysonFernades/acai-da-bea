import { loadData, saveData, resetData, brl, escapeHTML, slugId } from '../js/demo-store.js';
let data=loadData();
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
function toast(msg){const el=$('#admin-toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2200)}
function persist(msg='Alterações salvas'){saveData(data);renderAll();toast(msg)}
function toPrice(cents){return (Number(cents||0)/100).toFixed(2).replace('.',',')}
function parsePrice(value){const normalized=String(value).trim().replace(/\./g,'').replace(',','.');const n=Number(normalized);return Number.isFinite(n)?Math.round(n*100):0}
function switchHTML(checked,attrs=''){return `<label class="switch"><input type="checkbox" ${checked?'checked':''} ${attrs}><span></span></label>`}

function renderMetrics(){
 const total=data.products.length,available=data.products.filter(p=>p.available).length,ingOut=data.ingredients.filter(i=>!i.available).length;
 $('#metrics').innerHTML=[['Produtos',total,'cadastrados'],['Disponíveis',available,'no cardápio'],['Ingredientes',data.ingredients.length,'itens de demonstração'],['Em falta',ingOut,'bloqueados agora']].map(([a,b,c])=>`<article class="metric"><small>${a}</small><strong>${b}</strong><em>${c}</em></article>`).join('');
 $('#quick-products').innerHTML=[...data.products].sort((a,b)=>a.order-b.order).map(p=>`<div class="quick-row"><img src="../${escapeHTML(p.image)}" alt=""><div class="row-info"><strong>${escapeHTML(p.name)}</strong><small>${brl(p.priceCents)}</small></div>${switchHTML(p.available,`data-quick-product="${p.id}"`)}</div>`).join('');
 $$('[data-quick-product]').forEach(el=>el.onchange=()=>toggleProduct(el.dataset.quickProduct,el.checked));
}
function renderProducts(){
 $('#product-list').innerHTML=[...data.products].sort((a,b)=>a.order-b.order).map(p=>`<div class="admin-row"><img src="../${escapeHTML(p.image)}" alt=""><div class="row-info"><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.description)}</small></div><div class="price-chip">${brl(p.priceCents)}</div><div class="row-actions">${switchHTML(p.available,`data-product-toggle="${p.id}"`)}<button class="small-btn" data-edit-product="${p.id}">Editar</button></div></div>`).join('');
 $$('[data-product-toggle]').forEach(el=>el.onchange=()=>toggleProduct(el.dataset.productToggle,el.checked));$$('[data-edit-product]').forEach(el=>el.onclick=()=>openProductModal(el.dataset.editProduct));
}
function renderIngredients(){
 $('#ingredient-groups').innerHTML=data.groups.map(g=>{const items=data.ingredients.filter(i=>i.groupId===g.id);return `<section class="ingredient-section"><div class="ingredient-head"><div><h3>${escapeHTML(g.name)}</h3><small>${escapeHTML(g.note||'')}</small></div><small>${items.filter(i=>i.available).length}/${items.length} disponíveis</small></div><div class="ingredient-list">${items.map(i=>`<div class="ingredient-row"><div><strong>${escapeHTML(i.name)}</strong>${i.demo?'<br><small>item demonstrativo</small>':''}</div>${switchHTML(i.available,`data-ingredient-toggle="${i.id}"`)}</div>`).join('')}</div></section>`}).join('');
 $$('[data-ingredient-toggle]').forEach(el=>el.onchange=()=>{const i=data.ingredients.find(x=>x.id===el.dataset.ingredientToggle);if(i){i.available=el.checked;persist(`${i.name}: ${el.checked?'disponível':'esgotado'}`)}})
}
function renderStore(){const f=$('#store-form');Object.entries(data.store).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v??''})}
function renderAll(){data=loadData();renderMetrics();renderProducts();renderIngredients();renderStore()}
function toggleProduct(id,available){const p=data.products.find(x=>x.id===id);if(!p)return;p.available=available;persist(`${p.name}: ${available?'disponível':'esgotado'}`)}

function openProductModal(id=null){
 const f=$('#product-form');f.reset();const p=id?data.products.find(x=>x.id===id):null;$('#product-modal-title').textContent=p?'Editar produto':'Novo produto';
 const values=p?{id:p.id,name:p.name,price:toPrice(p.priceCents),order:p.order,description:p.description,image:p.image,bases:p.rules?.bases||0,adicionais:p.rules?.adicionais||0,coberturas:p.rules?.coberturas||0,available:p.available}:{id:'',name:'',price:'',order:data.products.length+1,description:'',image:'assets/images/acai-330.svg',bases:0,adicionais:0,coberturas:0,available:true};
 Object.entries(values).forEach(([k,v])=>{const el=f.elements[k];if(!el)return;if(el.type==='checkbox')el.checked=Boolean(v);else el.value=v});$('#product-modal').showModal();
}
$('#product-form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),id=String(fd.get('id')||'').trim();const existing=id?data.products.find(p=>p.id===id):null;const product={id:existing?.id||slugId('produto'),name:String(fd.get('name')).trim(),priceCents:parsePrice(fd.get('price')),description:String(fd.get('description')||'').trim(),note:existing?.note||'Produto cadastrado pelo painel demonstrativo.',image:String(fd.get('image')||'assets/images/acai-330.svg').trim(),available:f.elements.available.checked,order:Number(fd.get('order')||99),rules:{bases:Number(fd.get('bases')||0),adicionais:Number(fd.get('adicionais')||0),coberturas:Number(fd.get('coberturas')||0)}};if(existing)Object.assign(existing,product);else data.products.push(product);saveData(data);$('#product-modal').close();renderAll();toast(existing?'Produto atualizado':'Produto cadastrado')};
$('#ingredient-form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f);data.ingredients.push({id:slugId('ingrediente'),name:String(fd.get('name')).trim(),groupId:String(fd.get('groupId')),available:f.elements.available.checked,demo:false});saveData(data);f.reset();$('#ingredient-modal').close();renderAll();toast('Ingrediente cadastrado')};
$('#store-form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);['name','whatsapp','whatsappDisplay','instagram','tagline','instagramUrl','mapsUrl','statusText'].forEach(k=>data.store[k]=String(fd.get(k)||'').trim());persist('Dados da loja atualizados')};
$('#reset-demo').onclick=()=>{if(confirm('Restaurar todos os produtos, ingredientes e dados do protótipo?')){data=resetData();renderAll();toast('Protótipo restaurado')}};
$('#add-product').onclick=()=>openProductModal();$('#add-ingredient').onclick=()=>$('#ingredient-modal').showModal();$$('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());

const titles={dashboard:'Visão geral',products:'Produtos',ingredients:'Ingredientes',store:'Dados da loja'};$$('.nav-link').forEach(btn=>btn.onclick=()=>{const v=btn.dataset.view;$$('.nav-link').forEach(x=>x.classList.toggle('active',x===btn));$$('.view').forEach(x=>x.classList.toggle('active',x.id===`view-${v}`));$('#page-title').textContent=titles[v];closeMenu()});
function closeMenu(){$('#sidebar').classList.remove('open');$('#mobile-backdrop').classList.remove('show')}$('#menu-btn').onclick=()=>{$('#sidebar').classList.add('open');$('#mobile-backdrop').classList.add('show')};$('#mobile-backdrop').onclick=closeMenu;
window.addEventListener('storage',e=>{if(e.key?.includes('acai-da-bea-demo-store'))renderAll()});window.addEventListener('acai-demo-data-changed',renderAll);renderAll();
