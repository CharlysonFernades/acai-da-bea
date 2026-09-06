import { auth, db, firebaseConfigured, STORE_ID } from '../js/firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { collection, doc, getDoc, getDocsFromServer, onSnapshot, query, setDoc, updateDoc, where, runTransaction } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { parseMoneyCents, escapeHTML, safeExternalUrl, safeImageSource, normalizeWhatsApp, normalizeGroupId, effectiveSelectionRules } from '../js/order-utils.js';

const $=id=>document.getElementById(id);
const e=escapeHTML;
const state={products:[],groups:[],options:[],unsub:[],loaded:new Set(),seeding:false};
const defaults={products:[{id:'acai-330',name:'Açaí de 330g',category:'Mais pedido',priceCents:1484,image:'assets/images/acai-330.webp',description:'Escolha até 4 opções entre açaí e cremes, 4 adicionais e 2 coberturas.',available:true,order:1,selectionRules:{'acai-cremes':4,adicionais:4,coberturas:2}},{id:'acai-750',name:'Açaí de 750g',category:'Tamanho família',priceCents:3374,image:'assets/images/acai-750.webp',description:'Escolha até 6 opções entre açaí e cremes, 6 adicionais e 2 coberturas.',available:true,order:2,selectionRules:{'acai-cremes':6,adicionais:6,coberturas:2}},{id:'acai-1kg',name:'Açaí de 1 kg',category:'Compartilhar',priceCents:4499,image:'assets/images/acai-1kg.webp',description:'Escolha até 8 opções entre açaí e cremes, 8 adicionais e 2 coberturas.',available:true,order:3,selectionRules:{'acai-cremes':8,adicionais:8,coberturas:2}},{id:'salada-gourmet',name:'Salada de fruta gourmet',category:'Especial',priceCents:1400,oldPriceCents:1550,image:'assets/images/salada-gourmet.webp',description:'400 ml • creme de morango e creme de avelã.',available:true,order:4,selectionRules:{}}],groups:[{id:'acai-cremes',name:'Açaí e cremes',order:1,available:true},{id:'adicionais',name:'Adicionais',order:2,available:true},{id:'coberturas',name:'Coberturas',order:3,available:true}],options:[['acai-cremes','Açaí tradicional'],['acai-cremes','Creme de ninho'],['acai-cremes','Creme de morango'],['acai-cremes','Creme de avelã'],['acai-cremes','Creme de Ovomaltine'],['adicionais','Leite em pó'],['adicionais','Granola'],['adicionais','Paçoca'],['adicionais','Jujuba'],['adicionais','Gotas de chocolate'],['adicionais','Morango'],['adicionais','Banana'],['coberturas','Leite condensado'],['coberturas','Cobertura de chocolate'],['coberturas','Cobertura de morango']].map(([groupId,name],i)=>({id:`${groupId}-${slug(name)}`,groupId,name,available:true,order:i+1,extraPriceCents:0}))};
function slug(text) { return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function money(value) { return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format((Number(value)||0)/100); }
function toast(message) { const el=$('admin-toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4500); }
function storeQuery(name) { return query(collection(db,name),where('storeId','==',STORE_ID)); }
function fieldError(id,message) { const input=$(id);input.setCustomValidity(message);input.reportValidity();throw new Error(message); }
function readPrice(id,{optional=false,allowZero=false}={}) {
  const value=parseMoneyCents($(id).value,{optional,allowZero});
  if(value===null)fieldError(id,allowZero?'Digite um valor válido, como 3,00 ou 3.00.':'Digite um preço maior que zero, como 14,84 ou 14.84.');
  return value;
}
function readName(id) { const name=$(id).value.trim();if(!slug(name))fieldError(id,'Digite um nome válido.');return name; }
async function verify(user) {
  const snap=await getDoc(doc(db,'admins',user.uid));if(!snap.exists())return null;
  const admin=snap.data();return admin.active===true&&['owner','admin'].includes(admin.role)&&admin.storeId===STORE_ID?admin:null;
}
async function action(button,callback) {
  if(button?.disabled)return;
  if(button)button.disabled=true;
  try { await callback(); }
  catch(error) { console.error(error);toast(error.code?'Não foi possível salvar. Confira a conexão e sua permissão e tente novamente.':error.message||'Não foi possível salvar. Tente novamente.'); }
  finally {if(button)button.disabled=false;updateSeedButtons();}
}
function bindForm(id,callback) {
  const form=$(id);
  form.addEventListener('submit',event=>{event.preventDefault();return action(form.querySelector('button[type="submit"]'),callback);});
}
async function saveRecord(name,id,data,isNew) {
  const ref=doc(db,name,id);
  if(!isNew)return updateDoc(ref,data);
  await runTransaction(db,async transaction=>{
    // O documento da loja serializa criações com as regras atuais do Firestore.
    // Ler uma coleção evita consultar diretamente um documento ainda inexistente.
    const storeRef=doc(db,'stores',STORE_ID),store=await transaction.get(storeRef);
    const existing=await getDocsFromServer(storeQuery(name));
    if(existing.docs.some(record=>record.id===id))throw new Error('Já existe um cadastro com esse nome. Use Editar para alterá-lo.');
    transaction.set(ref,data);
    transaction.set(storeRef,{catalogRevision:(Number(store.data()?.catalogRevision)||0)+1},{merge:true});
  });
}
function bindTabs() {
  document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>{
    document.querySelectorAll('.tab,.panel').forEach(el=>el.classList.remove('active'));
    button.classList.add('active');$(`panel-${button.dataset.tab}`).classList.add('active');
  });
}
function updateSeedButtons() {
  $('seed-products-button').disabled=!state.loaded.has('products')||state.products.length>0||state.seeding;
  $('seed-options-button').disabled=!state.loaded.has('groups')||!state.loaded.has('options')||state.groups.length>0||state.options.length>0||state.seeding;
}
function renderProducts() {
  const root=$('products-list');
  root.innerHTML=state.products.length?state.products.map(product=>`<article class="list-item"><div><h3>${e(product.name)}</h3><p>R$ ${money(product.priceCents)} • ${e(product.category||'Sem categoria')}</p></div><div class="list-actions"><button class="availability ${product.available===false?'off':'on'}" data-toggle-product="${e(product.id)}">${product.available===false?'Esgotado':'Disponível'}</button><button class="btn ghost small" data-edit-product="${e(product.id)}">Editar</button></div></article>`).join(''):'<div class="empty">Nenhum produto cadastrado.</div>';
  root.querySelectorAll('[data-toggle-product]').forEach(button=>button.onclick=()=>action(button,async()=>{
    const product=state.products.find(p=>p.id===button.dataset.toggleProduct);
    await updateDoc(doc(db,'products',product.id),{available:product.available===false});toast('Disponibilidade atualizada.');
  }));
  root.querySelectorAll('[data-edit-product]').forEach(button=>button.onclick=()=>openProduct(button.dataset.editProduct));
  updateSeedButtons();
}
function renderGroups() {
  const root=$('groups-list');
  root.innerHTML=state.groups.length?state.groups.map(group=>`<article class="list-item"><div><h3>${e(group.name)}</h3><p>Ordem ${e(group.order??'-')}</p></div><button class="btn ghost small" data-edit-group="${e(group.id)}">Editar</button></article>`).join(''):'<div class="empty">Nenhum grupo.</div>';
  root.querySelectorAll('[data-edit-group]').forEach(button=>button.onclick=()=>openGroup(button.dataset.editGroup));
  // Uma atualização de outro grupo não apaga regras que estão sendo editadas.
  if(!$('product-dialog').open)renderRules();
  if(!$('option-dialog').open)renderGroupSelect();
  updateSeedButtons();
}
function renderOptions() {
  const groupNames=Object.fromEntries(state.groups.map(group=>[group.id,group.name])),root=$('options-list');
  root.innerHTML=state.options.length?state.options.map(option=>`<article class="list-item"><div><h3>${e(option.name)}</h3><p>${e(groupNames[option.groupId]||option.groupId)}${option.extraPriceCents?` • + R$ ${money(option.extraPriceCents)}`:''}</p></div><div class="list-actions"><button class="availability ${option.available===false?'off':'on'}" data-toggle-option="${e(option.id)}">${option.available===false?'Esgotado':'Disponível'}</button><button class="btn ghost small" data-edit-option="${e(option.id)}">Editar</button></div></article>`).join(''):'<div class="empty">Nenhuma opção.</div>';
  root.querySelectorAll('[data-toggle-option]').forEach(button=>button.onclick=()=>action(button,async()=>{
    const option=state.options.find(o=>o.id===button.dataset.toggleOption);
    await updateDoc(doc(db,'options',option.id),{available:option.available===false});toast('Disponibilidade atualizada.');
  }));
  root.querySelectorAll('[data-edit-option]').forEach(button=>button.onclick=()=>openOption(button.dataset.editOption));
  updateSeedButtons();
}
function renderRules(selected={}) {
  const normalized=Object.fromEntries(Object.entries(selected).map(([id,max])=>[normalizeGroupId(id),max]));
  const root=$('product-group-rules');
  root.innerHTML=state.groups.map(group=>{
    const max=normalized[normalizeGroupId(group.id)];
    return `<label class="group-rule"><span><input type="checkbox" data-rule="${e(group.id)}" ${max!=null?'checked':''}> ${e(group.name)}</span><input type="number" min="1" max="20" data-max="${e(group.id)}" value="${e(max??1)}" ${max!=null?'':'disabled'}></label>`;
  }).join('')||'<p class="muted">Crie os grupos primeiro. As regras existentes do produto serão preservadas.</p>';
  root.querySelectorAll('[data-rule]').forEach(check=>check.onchange=()=>check.closest('.group-rule').querySelector('[data-max]').disabled=!check.checked);
}
function collectRules(previous={}) {
  if(!state.groups.length)return previous;
  const rules={};
  $('product-group-rules').querySelectorAll('[data-rule]').forEach(check=>{
    if(check.checked)rules[check.dataset.rule]=Number(check.closest('.group-rule').querySelector('[data-max]').value);
  });
  return rules;
}
function resetValidity(form) {form.querySelectorAll('input,textarea,select').forEach(input=>input.setCustomValidity(''));}
function openProduct(id=null) {
  const product=id?state.products.find(p=>p.id===id):null;
  resetValidity($('product-form'));
  $('product-dialog-title').textContent=product?'Editar produto':'Novo produto';$('product-id').value=product?.id||'';
  $('product-name').value=product?.name||'';$('product-price').value=product?money(product.priceCents):'';
  $('product-old-price').value=product?.oldPriceCents?money(product.oldPriceCents):'';
  $('product-category').value=product?.category||'';$('product-description').value=product?.description||'';$('product-image').value=product?.image||'';
  $('product-order').value=product?.order??state.products.length+1;$('product-available').checked=product?.available!==false;
  renderRules(product?effectiveSelectionRules(product):{});$('product-dialog').showModal();
}
function openGroup(id=null) {
  const group=id?state.groups.find(g=>g.id===id):null;resetValidity($('group-form'));
  $('group-id').value=group?.id||'';$('group-name').value=group?.name||'';$('group-order').value=group?.order??state.groups.length+1;$('group-dialog').showModal();
}
function renderGroupSelect(selected='') {
  $('option-group').innerHTML=state.groups.map(group=>`<option value="${e(group.id)}" ${group.id===selected?'selected':''}>${e(group.name)}</option>`).join('');
}
function openOption(id=null) {
  if(!state.groups.length)return toast('Crie um grupo antes de cadastrar as opções.');
  const option=id?state.options.find(o=>o.id===id):null;resetValidity($('option-form'));
  $('option-id').value=option?.id||'';renderGroupSelect(option?.groupId||state.groups[0]?.id||'');$('option-name').value=option?.name||'';
  $('option-extra-price').value=money(option?.extraPriceCents||0);$('option-order').value=option?.order??state.options.length+1;
  $('option-available').checked=option?.available!==false;$('option-dialog').showModal();
}
function startRealtime() {
  state.loaded.clear();updateSeedButtons();
  const failure=key=>error=>{state.loaded.delete(key);updateSeedButtons();console.error(error);toast('Não foi possível atualizar os dados. Confira a conexão e tente novamente.');};
  state.unsub=[onSnapshot(doc(db,'stores',STORE_ID),snap=>{
    const data=snap.exists()?snap.data():{};
    $('dashboard-store-name').textContent=data.name||'Açaí da Bea';$('store-name').value=data.name||'Açaí da Bea';$('store-whatsapp').value=data.whatsapp||'';
    $('store-instagram').value=data.instagram||'';$('store-instagram-url').value=data.instagramUrl||'';$('store-address').value=data.address||'';
    $('store-hours').value=data.openingHours||'';$('store-delivery').checked=data.deliveryEnabled===true;
  },failure('store'))];
  [['products','products',renderProducts],['optionGroups','groups',renderGroups],['options','options',renderOptions]].forEach(([collectionName,key,render])=>{
    state.unsub.push(onSnapshot(storeQuery(collectionName),snap=>{state[key]=snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(a.order??999)-(b.order??999));state.loaded.add(key);render();},failure(key)));
  });
}
async function seedEmptyCollections(entries) {
  state.seeding=true;updateSeedButtons();
  try {
    await runTransaction(db,async transaction=>{
      const storeRef=doc(db,'stores',STORE_ID),store=await transaction.get(storeRef);
      const existing=await Promise.all(entries.map(([name])=>getDocsFromServer(storeQuery(name))));
      if(existing.some(snap=>!snap.empty))throw new Error('O cadastro já foi iniciado. Os dados existentes foram preservados.');
      for(const [name,items] of entries)for(const {id,...data} of items)transaction.set(doc(db,name,id),{...data,storeId:STORE_ID});
      transaction.set(storeRef,{catalogRevision:(Number(store.data()?.catalogRevision)||0)+1},{merge:true});
    });
    toast('Cadastro inicial criado.');
  } finally {state.seeding=false;updateSeedButtons();}
}
function bind() {
  bindTabs();updateSeedButtons();
  document.querySelectorAll('input,textarea,select').forEach(input=>input.addEventListener('input',()=>input.setCustomValidity('')));
  bindForm('login-form',async()=>{
    try {await signInWithEmailAndPassword(auth,$('login-email').value.trim(),$('login-password').value);}
    catch(error){console.error(error);throw new Error('Não foi possível entrar. Confira e-mail e senha.');}
  });
  $('logout-button').onclick=()=>action($('logout-button'),()=>signOut(auth));
  bindForm('store-form',async()=>{
    const name=readName('store-name'),whatsapp=normalizeWhatsApp($('store-whatsapp').value),rawUrl=$('store-instagram-url').value.trim();
    if(!whatsapp)fieldError('store-whatsapp','Informe um WhatsApp válido com DDD. Ex.: 5585921455990.');
    const instagramUrl=safeExternalUrl(rawUrl);
    if(rawUrl&&!instagramUrl)fieldError('store-instagram-url','Use um endereço HTTPS válido.');
    await setDoc(doc(db,'stores',STORE_ID),{name,whatsapp,instagram:$('store-instagram').value.trim(),instagramUrl,address:$('store-address').value.trim(),openingHours:$('store-hours').value.trim(),deliveryEnabled:$('store-delivery').checked},{merge:true});
    toast('Dados da loja salvos.');
  });
  $('new-product-button').onclick=()=>openProduct();$('new-group-button').onclick=()=>openGroup();$('new-option-button').onclick=()=>openOption();
  bindForm('product-form',async()=>{
    const current=$('product-id').value.trim(),name=readName('product-name'),id=current||slug(name),priceCents=readPrice('product-price');
    const oldPriceCents=readPrice('product-old-price',{optional:true,allowZero:true});
    if(oldPriceCents&&oldPriceCents<=priceCents)fieldError('product-old-price','O preço antigo deve ser maior que o preço atual, ou ficar vazio.');
    const imageInput=$('product-image').value.trim(),image=safeImageSource(imageInput,'');
    if(imageInput&&!image)fieldError('product-image','Use uma imagem HTTPS ou um arquivo em assets/images/.');
    const previous=state.products.find(product=>product.id===current);
    const rules=collectRules(previous?.selectionRules||{}),effective=effectiveSelectionRules({id,name,selectionRules:rules});
    if(state.groups.length&&effective['acai-cremes']&&!Object.keys(rules).some(key=>normalizeGroupId(key)==='acai-cremes'))throw new Error('Marque o grupo Açaí e cremes. Esse produto precisa de uma base.');
    await saveRecord('products',id,{storeId:STORE_ID,name,priceCents,oldPriceCents:oldPriceCents||null,category:$('product-category').value.trim(),description:$('product-description').value.trim(),image,order:Number($('product-order').value)||0,available:$('product-available').checked,selectionRules:effective},!current);
    $('product-dialog').close();toast('Produto salvo.');
  });
  bindForm('group-form',async()=>{
    const name=readName('group-name'),current=$('group-id').value.trim(),id=current||normalizeGroupId(slug(name));
    if(!current&&state.groups.some(group=>normalizeGroupId(group.id)===id))throw new Error('Esse grupo já existe. Use Editar para alterá-lo.');
    await saveRecord('optionGroups',id,{storeId:STORE_ID,name,order:Number($('group-order').value)||0,available:true},!current);
    $('group-dialog').close();toast('Grupo salvo.');
  });
  bindForm('option-form',async()=>{
    const name=readName('option-name'),groupId=$('option-group').value,current=$('option-id').value.trim(),id=current||`${groupId}-${slug(name)}`;
    if(!state.groups.some(group=>group.id===groupId))throw new Error('Selecione um grupo válido.');
    const extraPriceCents=readPrice('option-extra-price',{optional:true,allowZero:true});
    await saveRecord('options',id,{storeId:STORE_ID,groupId,name,extraPriceCents,order:Number($('option-order').value)||0,available:$('option-available').checked},!current);
    $('option-dialog').close();toast('Opção salva.');
  });
  $('seed-products-button').onclick=()=>action($('seed-products-button'),()=>seedEmptyCollections([['products',defaults.products]]));
  $('seed-options-button').onclick=()=>action($('seed-options-button'),()=>seedEmptyCollections([['optionGroups',defaults.groups],['options',defaults.options]]));
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.onclick=()=>$(button.dataset.closeDialog).close());
}
function init() {
  bind();
  if(!firebaseConfigured){$('firebase-warning').textContent='O acesso ao painel ainda está sendo configurado.';$('firebase-warning').classList.remove('hidden');$('login-form').querySelector('button[type="submit"]').disabled=true;return;}
  onAuthStateChanged(auth,async user=>{
    state.unsub.forEach(unsubscribe=>unsubscribe?.());state.unsub=[];state.loaded.clear();
    $('login-view').classList.remove('hidden');$('dashboard-view').classList.add('hidden');
    if(!user)return;
    try {
      const admin=await verify(user);
      if(auth.currentUser?.uid!==user.uid)return;
      if(!admin){toast('Conta sem permissão de administrador.');await signOut(auth);return;}
      $('session-email').textContent=user.email||'';$('login-view').classList.add('hidden');$('dashboard-view').classList.remove('hidden');startRealtime();
    } catch(error){console.error(error);toast('Não foi possível verificar seu acesso. Confira a conexão e tente entrar novamente.');}
  });
}
init();
