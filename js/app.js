import { firebaseConfigured } from './firebase-config.js';
import { watchStoreData, watchCollectionData } from './store-service.js';

const DEFAULT_STORE = {
  name: 'Açaí da Bea',
  whatsapp: '5585921455990',
  whatsappDisplay: '+55 85 92145-5990',
  instagram: '@acaibea',
  instagramUrl: 'https://www.instagram.com/acaibea?stkn=MWIoYjJmM2NtNmN1bw==',
  address: '',
  openingHours: 'Terça a domingo, das 17:00 às 22:00',
  deliveryEnabled: false
};

const DEFAULT_GROUPS = [
  { id: 'acai-cremes', name: 'Açaí e cremes', order: 1, available: true },
  { id: 'adicionais', name: 'Adicionais', order: 2, available: true },
  { id: 'coberturas', name: 'Coberturas', order: 3, available: true }
];

const DEFAULT_OPTIONS = [
  ['acai-cremes','Açaí tradicional'],['acai-cremes','Creme de ninho'],['acai-cremes','Creme de morango'],['acai-cremes','Creme de avelã'],['acai-cremes','Creme de Ovomaltine'],
  ['adicionais','Leite em pó'],['adicionais','Granola'],['adicionais','Paçoca'],['adicionais','Jujuba'],['adicionais','Gotas de chocolate'],['adicionais','Morango'],['adicionais','Banana'],
  ['coberturas','Leite condensado'],['coberturas','Cobertura de chocolate'],['coberturas','Cobertura de morango']
].map(([groupId,name],index)=>({ id:`fallback-${index}`, groupId, name, available:true, order:index+1, extraPriceCents:0 }));

const DEFAULT_PRODUCTS = [
  { id:'acai-330', name:'Açaí de 330g', category:'Mais pedido', priceCents:1484, image:'assets/images/acai-330.webp', description:'Escolha até 4 opções entre açaí e cremes, 4 adicionais e 2 coberturas.', available:true, order:1, selectionRules:{'acai-cremes':4,adicionais:4,coberturas:2} },
  { id:'acai-750', name:'Açaí de 750g', category:'Tamanho família', priceCents:3374, image:'assets/images/acai-750.webp', description:'Escolha até 6 opções entre açaí e cremes, 6 adicionais e 2 coberturas.', available:true, order:2, selectionRules:{'acai-cremes':6,adicionais:6,coberturas:2} },
  { id:'acai-1kg', name:'Açaí de 1 kg', category:'Compartilhar', priceCents:4499, image:'assets/images/acai-1kg.webp', description:'Escolha até 8 opções entre açaí e cremes, 8 adicionais e 2 coberturas.', available:true, order:3, selectionRules:{'acai-cremes':8,adicionais:8,coberturas:2} },
  { id:'salada-gourmet', name:'Salada de fruta gourmet', category:'Especial', priceCents:1400, oldPriceCents:1550, image:'assets/images/salada-gourmet.webp', description:'400 ml • creme de morango e creme de avelã.', available:true, order:4, selectionRules:{} }
];

const state = {
  store: { ...DEFAULT_STORE },
  products: [...DEFAULT_PRODUCTS],
  groups: [...DEFAULT_GROUPS],
  options: [...DEFAULT_OPTIONS],
  cart: loadCart(),
  currentProduct: null
};

const $ = (id) => document.getElementById(id);
const els = {
  productGrid:$('product-grid'), productDialog:$('product-dialog'), productForm:$('product-form'), productDialogContent:$('product-dialog-content'),
  cartDrawer:$('cart-drawer'), cartItems:$('cart-items'), cartTotal:$('cart-total'), cartCount:$('cart-count'), cartFooter:$('cart-footer'), backdrop:$('backdrop'),
  cartButton:$('cart-button'), closeCart:$('close-cart'), checkoutButton:$('checkout-button'), checkoutDialog:$('checkout-dialog'), checkoutForm:$('checkout-form'),
  closeCheckout:$('close-checkout'), toast:$('toast'), heroWhatsapp:$('hero-whatsapp'), contactWhatsapp:$('contact-whatsapp'), contactInstagram:$('contact-instagram'),
  contactMaps:$('contact-maps'), floatingCartWrap:$('floating-cart-wrap'), floatingCart:$('floating-cart'), floatingCartText:$('floating-cart-text'), deliveryFields:$('delivery-fields'),
  deliveryChoice:$('delivery-choice'), whatsappDisplay:$('whatsapp-display'), instagramDisplay:$('instagram-display'), addressDisplay:$('address-display'), hoursTitle:$('hours-title'), hoursText:$('hours-text'), heroHours:$('hero-hours')
};

function formatCurrency(cents){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((Number(cents)||0)/100)}
function digits(value){return String(value||'').replace(/\D/g,'')}
function displayPhone(value){const d=digits(value);if(d.length===13&&d.startsWith('55'))return `+55 ${d.slice(2,4)} ${d.slice(4,9)}-${d.slice(9)}`;return value||DEFAULT_STORE.whatsappDisplay}
function loadCart(){try{return JSON.parse(localStorage.getItem('acai-da-bea-cart-v2'))||[]}catch{return[]}}
function saveCart(){localStorage.setItem('acai-da-bea-cart-v2',JSON.stringify(state.cart))}
function showToast(msg){els.toast.textContent=msg;els.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>els.toast.classList.remove('show'),2200)}
function getGroup(id){return state.groups.find(g=>g.id===id)}
function optionsForGroup(groupId){return state.options.filter(o=>o.groupId===groupId&&o.available!==false)}
function summarizeSelections(selections){return Object.entries(selections||{}).filter(([,v])=>Array.isArray(v)&&v.length).map(([key,values])=>`${getGroup(key)?.name||key}: ${values.join(', ')}`)}

function applyStore(){
  const s=state.store;
  document.title=`${s.name||'Açaí da Bea'} • Cardápio`;
  document.querySelectorAll('[data-store-name]').forEach(el=>el.textContent=s.name||'Açaí da Bea');
  if(els.whatsappDisplay)els.whatsappDisplay.textContent=displayPhone(s.whatsapp||s.whatsappDigits);
  if(els.instagramDisplay)els.instagramDisplay.textContent=s.instagram||'@acaibea';
  if(els.heroHours)els.heroHours.textContent=s.openingHours||DEFAULT_STORE.openingHours;
  if(els.hoursTitle)els.hoursTitle.textContent=s.openingHours||DEFAULT_STORE.openingHours;
  if(els.hoursText)els.hoursText.textContent='';
  if(els.addressDisplay)els.addressDisplay.textContent=s.address||'Abrir localização';

  const wa=digits(s.whatsapp||s.whatsappDigits)||DEFAULT_STORE.whatsapp;
  const generic=`Olá! Gostaria de fazer um pedido no ${s.name||'Açaí da Bea'}.`;
  const waUrl=`https://wa.me/${wa}?text=${encodeURIComponent(generic)}`;
  els.heroWhatsapp.href=waUrl;els.contactWhatsapp.href=waUrl;
  if(s.instagramUrl){els.contactInstagram.href=s.instagramUrl;els.contactInstagram.hidden=false}else{els.contactInstagram.hidden=true}
  if(s.address){els.contactMaps.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`;els.contactMaps.hidden=false}else{els.contactMaps.hidden=true}

  const deliveryOn=s.deliveryEnabled===true;
  els.deliveryChoice.hidden=!deliveryOn;
  if(!deliveryOn){const checked=els.checkoutForm.querySelector('input[name="service-type"][value="delivery"]');if(checked?.checked){els.checkoutForm.querySelector('input[value="retirada"]').checked=true}els.deliveryFields.hidden=true}
}

function renderProducts(){
  els.productGrid.innerHTML=state.products.map(p=>{
    const unavailable=p.available===false;
    return `<article class="product-card ${unavailable?'is-unavailable':''}"><div class="product-photo"><img src="${p.image||'assets/images/acai-330.webp'}" alt="${p.name}" loading="lazy"></div><div class="product-body"><span class="product-tag">${p.category||'Cardápio'}</span>${unavailable?'<span class="sold-out-badge">ESGOTADO NO MOMENTO</span>':''}<h3 class="product-title">${p.name}</h3><p class="product-desc">${p.description||''}</p><div class="product-meta"><div class="product-price">${p.oldPriceCents?`<span class="old-price">${formatCurrency(p.oldPriceCents)}</span>`:''}<strong>${formatCurrency(p.priceCents)}</strong></div><button class="button primary" type="button" data-product-open="${p.id}" ${unavailable?'disabled':''}>${unavailable?'Indisponível':'Escolher'}</button></div></div></article>`
  }).join('');
  els.productGrid.querySelectorAll('[data-product-open]').forEach(b=>b.addEventListener('click',()=>openProduct(b.dataset.productOpen)));
}

function makeGroup(id,max){
  const group=getGroup(id);if(!group||group.available===false)return'';const options=optionsForGroup(id);if(!options.length)return'';
  return `<fieldset class="option-group" data-group="${id}" data-max="${max}"><legend>${group.name}</legend><div class="option-help">Escolha até ${max} ${max===1?'opção':'opções'}.</div><div class="choice-grid">${options.map(o=>`<label class="option-pill"><input type="checkbox" name="${id}" value="${o.name}"><span>${o.name}${o.extraPriceCents?` (+${formatCurrency(o.extraPriceCents)})`:''}</span></label>`).join('')}</div></fieldset>`;
}

function openProduct(id){
  const p=state.products.find(x=>x.id===id);if(!p||p.available===false)return;state.currentProduct=p;
  const rules=p.selectionRules||{};
  const groups=Object.entries(rules).map(([groupId,max])=>makeGroup(groupId,Number(max)||1)).join('');
  els.productDialogContent.innerHTML=`<div class="dialog-grid"><div class="dialog-image"><img src="${p.image||'assets/images/acai-330.webp'}" alt="${p.name}"></div><div class="dialog-copy"><span class="product-tag">${p.category||'Cardápio'}</span><h3>${p.name}</h3><p>${p.description||''}</p><div class="dialog-price">${formatCurrency(p.priceCents)}</div></div></div><div class="dialog-actions">${groups||'<div class="option-group"><div class="option-help">Este item não precisa de personalização.</div></div>'}<label class="text-label">Observação do item<textarea name="itemNote" rows="3" maxlength="200" placeholder="Ex.: sem granola..."></textarea></label><button class="button primary full" type="submit">Adicionar ao pedido</button></div>`;
  els.productDialogContent.querySelectorAll('[data-group]').forEach(group=>{const max=Number(group.dataset.max);const checks=[...group.querySelectorAll('input[type="checkbox"]')];checks.forEach(c=>c.addEventListener('change',()=>{if(checks.filter(x=>x.checked).length>max){c.checked=false;showToast(`Você pode escolher até ${max} opções nesse grupo.`)}}))});
  els.productDialog.showModal();
}

function addCurrentProduct(ev){
  ev.preventDefault();const p=state.currentProduct;if(!p)return;const fd=new FormData(els.productForm);const selections={};Object.keys(p.selectionRules||{}).forEach(k=>selections[k]=fd.getAll(k));const itemNote=String(fd.get('itemNote')||'').trim();const fingerprint=JSON.stringify({id:p.id,selections,itemNote});const found=state.cart.find(i=>i.fingerprint===fingerprint);if(found)found.quantity+=1;else state.cart.push({id:p.id,fingerprint,name:p.name,priceCents:p.priceCents,quantity:1,selections,itemNote});saveCart();renderCart();els.productDialog.close();showToast('Item adicionado ao pedido.')
}

function cartTotal(){return state.cart.reduce((s,i)=>s+i.priceCents*i.quantity,0)}
function cartCount(){return state.cart.reduce((s,i)=>s+i.quantity,0)}
function renderCart(){
  const count=cartCount(),total=cartTotal();els.cartCount.textContent=count;els.cartTotal.textContent=formatCurrency(total);els.floatingCartText.textContent=`${count} ${count===1?'item':'itens'} • ${formatCurrency(total)}`;els.floatingCartWrap.classList.toggle('hidden',count===0);
  if(!state.cart.length){els.cartItems.innerHTML='<div class="cart-empty"><strong>Seu pedido está vazio.</strong><p>Escolha um produto para começar.</p></div>';els.cartFooter.classList.add('hidden');return}els.cartFooter.classList.remove('hidden');
  els.cartItems.innerHTML=state.cart.map((item,index)=>{const lines=summarizeSelections(item.selections);if(item.itemNote)lines.push(`Observação: ${item.itemNote}`);return `<article class="cart-item"><div class="cart-item-head"><div><h3>${item.quantity}x ${item.name}</h3><strong>${formatCurrency(item.priceCents*item.quantity)}</strong></div><button type="button" class="dialog-close" data-remove="${index}">×</button></div>${lines.length?`<ul>${lines.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}<div class="qty-row"><small>Unitário: ${formatCurrency(item.priceCents)}</small><div class="qty-controls"><button type="button" data-minus="${index}">−</button><strong>${item.quantity}</strong><button type="button" data-plus="${index}">+</button></div></div></article>`}).join('');
  els.cartItems.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state.cart.splice(Number(b.dataset.remove),1);saveCart();renderCart()});
  els.cartItems.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.minus);state.cart[i].quantity-=1;if(state.cart[i].quantity<=0)state.cart.splice(i,1);saveCart();renderCart()});
  els.cartItems.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{state.cart[Number(b.dataset.plus)].quantity+=1;saveCart();renderCart()});
}
function openCart(){els.cartDrawer.classList.add('open');els.cartDrawer.setAttribute('aria-hidden','false');els.backdrop.hidden=false}
function closeCart(){els.cartDrawer.classList.remove('open');els.cartDrawer.setAttribute('aria-hidden','true');els.backdrop.hidden=true}
function toggleDeliveryFields(){const type=new FormData(els.checkoutForm).get('service-type')||'retirada';els.deliveryFields.hidden=type!=='delivery'}

function buildWhatsAppMessage(payload){
  const lines=[`Olá! Acabei de fazer meu pedido no ${state.store.name||'Açaí da Bea'}!`,'Segue os detalhes:','','────────────','','🛍️ *Itens do pedido*',''];
  payload.items.forEach((item,index)=>{lines.push(`${index+1}. *${item.quantity}x ${item.name}* — ${formatCurrency(item.priceCents*item.quantity)}`);summarizeSelections(item.selections).forEach(line=>lines.push(`• ${line}`));if(item.itemNote)lines.push(`• Observação do item: ${item.itemNote}`);lines.push('')});
  lines.push('────────────','',`💰 *Total dos produtos:* ${formatCurrency(payload.total)}`,'','*Forma de atendimento*',payload.serviceLabel);
  if(payload.serviceType==='delivery'){lines.push('','*Endereço de entrega*',`${payload.address.street}, ${payload.address.number} - ${payload.address.neighborhood}`);if(payload.address.reference)lines.push(`Referência: ${payload.address.reference}`)}
  lines.push('','*Observações*',payload.notes||'-','','Por favor, podem confirmar a disponibilidade do pedido?','','Obrigado!');return lines.join('\n')
}

function handleCheckout(ev){
  ev.preventDefault();if(!state.cart.length)return showToast('Seu pedido está vazio.');const fd=new FormData(els.checkoutForm);const name=String(fd.get('customer-name')||'').trim();const notes=String(fd.get('customer-notes')||'').trim();let serviceType=String(fd.get('service-type')||'retirada');if(serviceType==='delivery'&&state.store.deliveryEnabled!==true)serviceType='retirada';if(!name)return showToast('Digite seu nome para continuar.');const address={street:String(fd.get('delivery-street')||'').trim(),number:String(fd.get('delivery-number')||'').trim(),neighborhood:String(fd.get('delivery-neighborhood')||'').trim(),reference:String(fd.get('delivery-reference')||'').trim()};if(serviceType==='delivery'&&(!address.street||!address.number||!address.neighborhood))return showToast('Preencha rua, número e bairro.');const payload={name,notes,serviceType,serviceLabel:serviceType==='delivery'?'Delivery':'Retirada na loja',items:state.cart,total:cartTotal(),address};const wa=digits(state.store.whatsapp||state.store.whatsappDigits)||DEFAULT_STORE.whatsapp;window.open(`https://wa.me/${wa}?text=${encodeURIComponent(buildWhatsAppMessage(payload))}`,'_blank','noopener');els.checkoutDialog.close()
}

function startFirebase(){
  if(!firebaseConfigured)return;
  watchStoreData((store)=>{if(store){state.store={...DEFAULT_STORE,...store};applyStore()}},(err)=>console.error('store',err));
  watchCollectionData('products',(items)=>{if(items.length){state.products=items;renderProducts()}},(err)=>console.error('products',err));
  watchCollectionData('optionGroups',(items)=>{if(items.length){state.groups=items;renderProducts()}},(err)=>console.error('groups',err));
  watchCollectionData('options',(items)=>{if(items.length){state.options=items;renderProducts()}},(err)=>console.error('options',err));
}

function init(){
  applyStore();renderProducts();renderCart();startFirebase();els.productForm.addEventListener('submit',addCurrentProduct);els.cartButton.onclick=openCart;els.floatingCart.onclick=openCart;els.closeCart.onclick=closeCart;els.backdrop.onclick=closeCart;els.checkoutButton.onclick=()=>{closeCart();els.checkoutDialog.showModal()};els.closeCheckout.onclick=()=>els.checkoutDialog.close();els.checkoutForm.addEventListener('submit',handleCheckout);els.checkoutForm.querySelectorAll('input[name="service-type"]').forEach(x=>x.addEventListener('change',toggleDeliveryFields));
}
init();
