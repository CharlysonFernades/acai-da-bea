import { firebaseConfigured } from './firebase-config.js';
import { watchStoreData, watchCollectionData, getCurrentCatalog } from './store-service.js';
import { DEFAULT_IMAGE, formatCurrency, escapeHTML, safeExternalUrl, safeImageSource, normalizeWhatsApp, normalizeGroupId, effectiveSelectionRules, findGroup, availableOptions, productUnavailableReason, buildCartItem, reconcileCart, summarizeSelections, buildWhatsAppMessage } from './order-utils.js';

const ORDER_RETURN_KEY = 'acai-da-bea-whatsapp-pending-v1';

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
  store: { ...DEFAULT_STORE }, products: [...DEFAULT_PRODUCTS], groups: [...DEFAULT_GROUPS], options: [...DEFAULT_OPTIONS],
  cart: loadCart(), currentProduct: null, currentSnapshot: '', cartNeedsReview: false, submitting: false, orderReturnPending: loadOrderReturnPending(),
  remote: {}, loaded: new Set(), failures: new Set()
};
const $ = id => document.getElementById(id);
const els = {
  productGrid:$('product-grid'), productDialog:$('product-dialog'), productForm:$('product-form'), productDialogContent:$('product-dialog-content'),
  cartDrawer:$('cart-drawer'), cartItems:$('cart-items'), cartTotal:$('cart-total'), cartCount:$('cart-count'), cartFooter:$('cart-footer'), backdrop:$('backdrop'),
  cartButton:$('cart-button'), closeCart:$('close-cart'), checkoutButton:$('checkout-button'), checkoutDialog:$('checkout-dialog'), checkoutForm:$('checkout-form'),
  closeCheckout:$('close-checkout'), toast:$('toast'), heroWhatsapp:$('hero-whatsapp'), contactWhatsapp:$('contact-whatsapp'), contactInstagram:$('contact-instagram'),
  contactMaps:$('contact-maps'), floatingCartWrap:$('floating-cart-wrap'), floatingCart:$('floating-cart'), floatingCartText:$('floating-cart-text'), deliveryFields:$('delivery-fields'),
  deliveryChoice:$('delivery-choice'), whatsappDisplay:$('whatsapp-display'), instagramDisplay:$('instagram-display'), addressDisplay:$('address-display'), hoursTitle:$('hours-title'),
  hoursText:$('hours-text'), heroHours:$('hero-hours'), heroMinPrice:$('hero-min-price'), cartNotice:$('cart-update-notice'), whatsappFallback:$('whatsapp-fallback'),
  orderReturnDialog:$('order-return-dialog'), startNewOrder:$('order-start-new'), continueOrder:$('order-continue')
};
const e = escapeHTML;
function catalogReady() { return !firebaseConfigured || (state.loaded.size === 4 && state.failures.size === 0); }
function loadCart() {
  try { const saved=JSON.parse(localStorage.getItem('acai-da-bea-cart-v2')); return Array.isArray(saved) ? saved.filter(item=>item && typeof item==='object') : []; }
  catch { return []; }
}
function saveCart() { try { localStorage.setItem('acai-da-bea-cart-v2',JSON.stringify(state.cart)); } catch { /* O pedido continua em memória. */ } }
function loadOrderReturnPending() {
  try { return localStorage.getItem(ORDER_RETURN_KEY)==='1'; } catch { return false; }
}
function setOrderReturnPending(pending) {
  state.orderReturnPending=pending;
  try { if(pending)localStorage.setItem(ORDER_RETURN_KEY,'1'); else localStorage.removeItem(ORDER_RETURN_KEY); }
  catch { /* A confirmação continua funcionando nesta página. */ }
}
function showOrderReturn() {
  if(!state.orderReturnPending||state.submitting||document.hidden||els.orderReturnDialog.open||els.productDialog.open||els.checkoutDialog.open)return;
  if(!state.cart.length){setOrderReturnPending(false);return;}
  closeCart();els.orderReturnDialog.showModal();
}
function resolveOrderReturn(startNew) {
  setOrderReturnPending(false);els.orderReturnDialog.close();
  if(!startNew){openCart();els.closeCart.focus();return;}
  state.cart=[];state.cartNeedsReview=false;els.cartNotice.hidden=true;
  els.checkoutForm.reset();toggleDeliveryFields();saveCart();renderCart();invalidatePreparedMessage();closeCart();
  showToast('Carrinho limpo. Você já pode montar um novo pedido.');els.cartButton.focus();
}
function showToast(message) {
  els.toast.textContent=message; els.toast.classList.add('show'); clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>els.toast.classList.remove('show'),3500);
}
function cartTotal() { return state.cart.reduce((sum,item)=>sum+(Number(item.priceCents)||0)*(Number(item.quantity)||0),0); }
function cartCount() { return state.cart.reduce((sum,item)=>sum+(Number(item.quantity)||0),0); }
function selectionsText(selections) { return summarizeSelections(selections,state.groups); }
function getGroup(id) { return findGroup(state.groups,id); }
function optionsForGroup(id) { return availableOptions(state.options,id); }
function unavailableReason(product) { return productUnavailableReason(product,state.groups,state.options); }
function snapshotFor(product) {
  const ids=Object.keys(effectiveSelectionRules(product));
  return JSON.stringify({product,groups:state.groups.filter(g=>ids.includes(normalizeGroupId(g.id))),options:state.options.filter(o=>ids.includes(normalizeGroupId(o.groupId)))});
}
function invalidatePreparedMessage() { els.whatsappFallback.hidden=true; els.whatsappFallback.removeAttribute('href'); }
function reconcileCurrentCart() {
  if(!catalogReady()) return false;
  const result=reconcileCart(state.cart,state.products,state.groups,state.options);
  state.cart=result.items;
  if(result.changed) { saveCart(); renderCart(); invalidatePreparedMessage(); }
  if(result.messages.length) {
    state.cartNeedsReview=true;
    els.cartNotice.textContent=`Seu pedido foi atualizado. ${result.messages.join(' ')} Confira antes de continuar.`;
    els.cartNotice.hidden=false;
    showToast('Seu pedido foi atualizado. Confira o carrinho.');
  }
  return result.messages.length>0;
}
function syncCatalog() {
  if(!catalogReady()) { renderProducts(); return; }
  if(firebaseConfigured) {
    state.store={...DEFAULT_STORE,...state.remote.store};
    state.products=state.remote.products;
    const provisional=!state.remote.groups.length&&!state.remote.options.length;
    state.groups=provisional ? DEFAULT_GROUPS : state.remote.groups;
    state.options=provisional ? DEFAULT_OPTIONS : state.remote.options;
  }
  applyStore(); renderProducts(); reconcileCurrentCart();
  if(state.currentProduct && snapshotFor(state.products.find(p=>p.id===state.currentProduct.id))!==state.currentSnapshot) {
    closeProductDialog(); showToast('Este produto foi atualizado. Abra-o novamente para conferir as opções.');
  }
}
function updateHeroPrice() {
  const available=state.products.filter(p=>!unavailableReason(p));
  const acais=available.filter(p=>effectiveSelectionRules(p)['acai-cremes']);
  const candidates=acais.length?acais:available;
  const badge=els.heroMinPrice.closest('.hero-price');
  badge.hidden=!catalogReady()||!candidates.length;
  if(candidates.length) els.heroMinPrice.textContent=formatCurrency(Math.min(...candidates.map(p=>p.priceCents)));
}
function applyStore() {
  const s=state.store, name=s.name||DEFAULT_STORE.name;
  document.title=`${name} • Cardápio`;
  document.querySelectorAll('[data-store-name]').forEach(el=>el.textContent=name);
  const wa=normalizeWhatsApp(s.whatsapp||s.whatsappDigits);
  els.whatsappDisplay.textContent=wa.length===13?`+55 ${wa.slice(2,4)} ${wa.slice(4,9)}-${wa.slice(9)}`:wa||'Contato em atualização';
  els.instagramDisplay.textContent=s.instagram||'@acaibea';
  const hours=s.openingHours||DEFAULT_STORE.openingHours;
  document.querySelectorAll('[data-store-hours]').forEach(el=>el.textContent=hours);
  els.heroHours.textContent=hours; els.hoursTitle.textContent=hours; els.hoursText.textContent='';
  els.addressDisplay.textContent=s.address||'Abrir localização';
  const waUrl=wa?`https://wa.me/${wa}?text=${encodeURIComponent(`Olá! Gostaria de fazer um pedido no ${name}.`)}`:'';
  [els.heroWhatsapp,els.contactWhatsapp].forEach(link=>{ link.hidden=!waUrl; if(waUrl)link.href=waUrl; else link.removeAttribute('href'); });
  const instagramUrl=safeExternalUrl(s.instagramUrl);
  els.contactInstagram.hidden=!instagramUrl;
  if(instagramUrl) els.contactInstagram.href=instagramUrl; else els.contactInstagram.removeAttribute('href');
  els.contactMaps.hidden=!s.address;
  if(s.address) els.contactMaps.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`; else els.contactMaps.removeAttribute('href');
  const deliveryOn=s.deliveryEnabled===true;
  els.deliveryChoice.hidden=!deliveryOn;
  if(!deliveryOn) {
    const delivery=els.checkoutForm.querySelector('input[value="delivery"]');
    if(delivery.checked) {
      els.checkoutForm.querySelector('input[value="retirada"]').checked=true;
      if(els.checkoutDialog.open)showToast('O delivery foi desativado. Confira a forma de atendimento.');
      invalidatePreparedMessage();
    }
  }
  toggleDeliveryFields();
}
function bindImageFallback(container) {
  container.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{
    if(img.getAttribute('src')!==DEFAULT_IMAGE) img.src=DEFAULT_IMAGE;
  },{once:true}));
}
function renderProducts() {
  const ready=catalogReady();
  els.productGrid.innerHTML=state.products.map(product=>{
    const reason=unavailableReason(product), disabled=!ready||Boolean(reason);
    return `<article class="product-card ${disabled?'is-unavailable':''}"><div class="product-photo"><img src="${e(safeImageSource(product.image))}" alt="${e(product.name)}" loading="lazy"></div><div class="product-body"><span class="product-tag">${e(product.category||'Cardápio')}</span>${reason?'<span class="sold-out-badge">INDISPONÍVEL NO MOMENTO</span>':''}<h3 class="product-title">${e(product.name)}</h3><p class="product-desc">${e(product.description||'')}</p><div class="product-meta"><div class="product-price">${product.oldPriceCents>product.priceCents?`<span class="old-price">${formatCurrency(product.oldPriceCents)}</span>`:''}<strong>${formatCurrency(product.priceCents)}</strong></div><button class="button primary" type="button" data-product-open="${e(product.id)}" ${disabled?'disabled':''}>${!ready?(state.failures.size?'Aguarde atualização':'Carregando…'):reason?'Indisponível':'Escolher'}</button></div></div></article>`;
  }).join('')||'<div class="cart-empty"><strong>Cardápio em atualização.</strong><p>Entre em contato com a loja para consultar os produtos.</p></div>';
  els.productGrid.querySelectorAll('[data-product-open]').forEach(button=>button.addEventListener('click',()=>openProduct(button.dataset.productOpen)));
  bindImageFallback(els.productGrid); updateHeroPrice();
}
function makeGroup(id,max) {
  const group=getGroup(id), options=optionsForGroup(id);
  if(!group||group.available===false||!options.length)return '';
  return `<fieldset class="option-group" data-group="${e(id)}" data-max="${max}"><legend>${e(group.name)}</legend><div class="option-help">Escolha até ${max} ${max===1?'opção':'opções'}.</div><div class="choice-grid">${options.map(option=>`<label class="option-pill"><input type="checkbox" name="${e(id)}" value="${e(option.id)}"><span>${e(option.name)}${option.extraPriceCents?` (+${formatCurrency(option.extraPriceCents)})`:''}</span></label>`).join('')}</div></fieldset>`;
}
function selectedIds(form,rules) {
  const data=new FormData(form);
  return Object.fromEntries(Object.keys(rules).map(id=>[id,data.getAll(id)]));
}
function updateProductPrice() {
  if(!state.currentProduct)return;
  const selected=new FormData(els.productForm);
  let extra=0;
  for(const id of Object.keys(effectiveSelectionRules(state.currentProduct))) {
    const chosen=new Set(selected.getAll(id));
    extra+=optionsForGroup(id).filter(o=>chosen.has(o.id)).reduce((sum,o)=>sum+Number(o.extraPriceCents||0),0);
  }
  els.productDialogContent.querySelector('.dialog-price').textContent=formatCurrency(state.currentProduct.priceCents+extra);
}
function openProduct(id) {
  if(!catalogReady())return showToast('Aguarde a atualização do cardápio.');
  const product=state.products.find(p=>p.id===id), reason=unavailableReason(product);
  if(reason)return showToast(reason);
  state.currentProduct=product; state.currentSnapshot=snapshotFor(product);
  const groups=Object.entries(effectiveSelectionRules(product)).map(([groupId,max])=>makeGroup(groupId,max)).join('');
  els.productDialogContent.innerHTML=`<div class="dialog-grid"><div class="dialog-image"><img src="${e(safeImageSource(product.image))}" alt="${e(product.name)}"></div><div class="dialog-copy"><span class="product-tag">${e(product.category||'Cardápio')}</span><h3>${e(product.name)}</h3><p>${e(product.description||'')}</p><div class="dialog-price" aria-live="polite">${formatCurrency(product.priceCents)}</div></div></div><div class="dialog-actions">${groups||'<div class="option-group"><div class="option-help">Este item não precisa de personalização.</div></div>'}<label class="text-label">Observação do item<textarea name="itemNote" rows="3" maxlength="200" placeholder="Ex.: sem granola..."></textarea></label><button class="button primary full" type="submit" data-add-product>Adicionar ao pedido</button></div>`;
  els.productDialogContent.querySelectorAll('[data-group]').forEach(group=>{
    const max=Number(group.dataset.max), checks=[...group.querySelectorAll('input[type="checkbox"]')];
    checks.forEach(check=>check.addEventListener('change',()=>{
      if(checks.filter(input=>input.checked).length>max){check.checked=false;showToast(`Você pode escolher até ${max} opções nesse grupo.`);}
      updateProductPrice();
    }));
  });
  bindImageFallback(els.productDialogContent); els.productDialog.showModal();
}
function closeProductDialog() { if(els.productDialog.open)els.productDialog.close(); state.currentProduct=null; }
function addCurrentProduct(event) {
  event.preventDefault();
  if(!state.currentProduct)return;
  if(!catalogReady())return showToast('Aguarde a atualização do cardápio.');
  const product=state.products.find(p=>p.id===state.currentProduct.id);
  const data=new FormData(els.productForm);
  const {item,error}=buildCartItem(product,{selectionIds:selectedIds(els.productForm,effectiveSelectionRules(product)),itemNote:data.get('itemNote'),quantity:1},state.groups,state.options);
  if(error)return showToast(error);
  reconcileCurrentCart();
  const found=state.cart.find(entry=>entry.fingerprint===item.fingerprint);
  if(found) { if(found.quantity===99)return showToast('O limite é de 99 unidades por item.'); found.quantity++; }
  else state.cart.push(item);
  saveCart();renderCart();invalidatePreparedMessage();closeProductDialog();showToast('Item adicionado ao pedido.');
}
function renderCart() {
  const count=cartCount(), total=cartTotal();
  if(!count&&state.orderReturnPending){setOrderReturnPending(false);els.orderReturnDialog.close();}
  els.cartCount.textContent=count;els.cartTotal.textContent=formatCurrency(total);
  els.floatingCartText.textContent=`${count} ${count===1?'item':'itens'} • ${formatCurrency(total)}`;
  els.floatingCartWrap.classList.toggle('hidden',count===0);
  els.cartFooter.classList.toggle('hidden',!state.cart.length);
  if(!state.cart.length){els.cartItems.innerHTML='<div class="cart-empty"><strong>Seu pedido está vazio.</strong><p>Escolha um produto para começar.</p></div>';return;}
  els.cartItems.innerHTML=state.cart.map((item,index)=>{
    const lines=selectionsText(item.selections);
    if(item.extraPriceCents)lines.push(`Adicionais pagos: ${formatCurrency(item.extraPriceCents)} por unidade (inclusos)`);
    if(item.itemNote)lines.push(`Observação: ${item.itemNote}`);
    return `<article class="cart-item"><div class="cart-item-head"><div><h3>${item.quantity}x ${e(item.name)}</h3><strong>${formatCurrency(item.priceCents*item.quantity)}</strong></div><button type="button" class="cart-item-remove" data-remove="${index}" aria-label="Remover ${e(item.name)}">Remover item</button></div>${lines.length?`<ul>${lines.map(line=>`<li>${e(line)}</li>`).join('')}</ul>`:''}<div class="qty-row"><small>Unitário: ${formatCurrency(item.priceCents)}</small><div class="qty-controls"><button type="button" data-minus="${index}" aria-label="Diminuir quantidade">−</button><strong>${item.quantity}</strong><button type="button" data-plus="${index}" aria-label="Aumentar quantidade">+</button></div></div></article>`;
  }).join('');
  els.cartItems.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{state.cart.splice(Number(button.dataset.remove),1);saveCart();renderCart();invalidatePreparedMessage();});
  els.cartItems.querySelectorAll('[data-minus]').forEach(button=>button.onclick=()=>{const index=Number(button.dataset.minus);if(--state.cart[index].quantity<=0)state.cart.splice(index,1);saveCart();renderCart();invalidatePreparedMessage();});
  els.cartItems.querySelectorAll('[data-plus]').forEach(button=>button.onclick=()=>{const item=state.cart[Number(button.dataset.plus)];if(item.quantity>=99)return showToast('O limite é de 99 unidades por item.');item.quantity++;saveCart();renderCart();invalidatePreparedMessage();});
}
function openCart() { reconcileCurrentCart();els.cartDrawer.classList.add('open');els.cartDrawer.setAttribute('aria-hidden','false');els.backdrop.hidden=false; }
function closeCart() { els.cartDrawer.classList.remove('open');els.cartDrawer.setAttribute('aria-hidden','true');els.backdrop.hidden=true; }
function toggleDeliveryFields() {
  const delivery=new FormData(els.checkoutForm).get('service-type')==='delivery'&&state.store.deliveryEnabled===true;
  els.deliveryFields.hidden=!delivery;
  ['delivery-street','delivery-number','delivery-neighborhood'].forEach(id=>$(id).required=delivery);
}
function checkoutPayload() {
  const data=new FormData(els.checkoutForm),name=String(data.get('customer-name')||'').trim();
  if(!name)throw new Error('Digite seu nome para continuar.');
  const serviceType=String(data.get('service-type')||'retirada');
  if(serviceType==='delivery'&&state.store.deliveryEnabled!==true)throw new Error('Delivery indisponível. Confira a forma de atendimento.');
  const address={street:String(data.get('delivery-street')||'').trim(),number:String(data.get('delivery-number')||'').trim(),neighborhood:String(data.get('delivery-neighborhood')||'').trim(),reference:String(data.get('delivery-reference')||'').trim()};
  if(serviceType==='delivery'&&(!address.street||!address.number||!address.neighborhood))throw new Error('Preencha rua, número e bairro.');
  return {name,notes:String(data.get('customer-notes')||'').trim(),serviceType,serviceLabel:serviceType==='delivery'?'Delivery':'Retirada na loja',address};
}
async function refreshFromServer() {
  if(!firebaseConfigured)return;
  let timer;
  try {
    const fresh=await Promise.race([getCurrentCatalog(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('A conexão demorou. Tente novamente.')),12000);})]);
    state.remote=fresh;state.loaded=new Set(['store','products','groups','options']);state.failures.clear();syncCatalog();
  } finally { clearTimeout(timer); }
}
async function handleCheckout(event) {
  event.preventDefault();
  if(state.submitting)return;
  if(!state.cart.length)return showToast('Seu pedido está vazio.');
  if(!catalogReady())return showToast('Aguarde a atualização do cardápio.');
  if(reconcileCurrentCart()||state.cartNeedsReview){els.checkoutDialog.close();openCart();return;}
  let payload;
  try { payload=checkoutPayload(); } catch(error) { return showToast(error.message); }
  invalidatePreparedMessage();state.submitting=true;
  const button=els.checkoutForm.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Conferindo pedido…';
  // Reserva a aba durante o clique para evitar bloqueio de popup após a consulta ao servidor.
  let popup=null;
  try { popup=window.open('about:blank','_blank');if(popup)popup.opener=null; } catch { /* Um link será oferecido se o navegador bloquear a aba. */ }
  try {
    await refreshFromServer();
    if(!els.checkoutDialog.open){popup?.close();return;}
    if(state.cartNeedsReview||!state.cart.length){popup?.close();els.checkoutDialog.close();openCart();return;}
    if(payload.serviceType==='delivery'&&state.store.deliveryEnabled!==true)throw new Error('O delivery foi desativado. Confira a forma de atendimento.');
    const wa=normalizeWhatsApp(state.store.whatsapp||state.store.whatsappDigits);
    if(!wa)throw new Error('O contato da loja está em atualização. Tente novamente em instantes.');
    payload={...payload,items:state.cart,total:cartTotal()};
    const url=`https://wa.me/${wa}?text=${encodeURIComponent(buildWhatsAppMessage(state.store,payload,state.groups))}`;
    if(popup&&!popup.closed){popup.location.replace(url);setOrderReturnPending(true);els.checkoutDialog.close();}
    else {els.whatsappFallback.href=url;els.whatsappFallback.hidden=false;showToast('Toque em Abrir WhatsApp para continuar.');}
  } catch(error) {
    popup?.close();console.error('checkout',error);showToast(error.message?.startsWith('O ')?error.message:'Não foi possível conferir o pedido. Verifique a conexão e tente novamente.');
  } finally {state.submitting=false;button.disabled=false;button.textContent='Montar mensagem';showOrderReturn();}
}
function startFirebase() {
  if(!firebaseConfigured){syncCatalog();return;}
  const receive=(key,data)=>{state.remote[key]=data;state.loaded.add(key);state.failures.delete(key);syncCatalog();};
  const failure=key=>error=>{state.failures.add(key);renderProducts();console.error(key,error);showToast('Não foi possível atualizar o cardápio. Confira sua conexão.');};
  watchStoreData(data=>receive('store',data||{}),failure('store'));
  watchCollectionData('products',data=>receive('products',data),failure('products'));
  watchCollectionData('optionGroups',data=>receive('groups',data),failure('groups'));
  watchCollectionData('options',data=>receive('options',data),failure('options'));
}
function init() {
  applyStore();renderProducts();renderCart();startFirebase();
  els.productForm.addEventListener('submit',addCurrentProduct);
  els.productForm.querySelector('.dialog-close').addEventListener('click',event=>{event.preventDefault();closeProductDialog();});
  els.productDialog.addEventListener('close',()=>{state.currentProduct=null;});
  els.cartButton.onclick=openCart;els.floatingCart.onclick=openCart;els.closeCart.onclick=closeCart;els.backdrop.onclick=closeCart;
  els.checkoutButton.onclick=()=>{
    if(!catalogReady())return showToast('Aguarde a atualização do cardápio.');
    if(reconcileCurrentCart()||!state.cart.length)return;
    state.cartNeedsReview=false;els.cartNotice.hidden=true;invalidatePreparedMessage();closeCart();toggleDeliveryFields();els.checkoutDialog.showModal();
  };
  els.closeCheckout.onclick=()=>els.checkoutDialog.close();els.checkoutForm.addEventListener('submit',handleCheckout);
  els.checkoutForm.addEventListener('input',invalidatePreparedMessage);
  els.checkoutForm.querySelectorAll('input[name="service-type"]').forEach(input=>input.addEventListener('change',()=>{toggleDeliveryFields();invalidatePreparedMessage();}));
  els.whatsappFallback.addEventListener('click',event=>{
    if(els.whatsappFallback.hidden||!els.whatsappFallback.getAttribute('href')){event.preventDefault();return;}
    setOrderReturnPending(true);els.checkoutDialog.close();setTimeout(showOrderReturn,0);
  });
  els.startNewOrder.onclick=()=>resolveOrderReturn(true);
  els.continueOrder.onclick=()=>resolveOrderReturn(false);
  els.orderReturnDialog.addEventListener('cancel',event=>{event.preventDefault();resolveOrderReturn(false);});
  window.addEventListener('focus',showOrderReturn);
  window.addEventListener('pageshow',showOrderReturn);
  document.addEventListener('visibilitychange',showOrderReturn);
  showOrderReturn();
}
init();
