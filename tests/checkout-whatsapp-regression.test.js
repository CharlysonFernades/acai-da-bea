import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './ui-harness.js';

const product={id:'acai-330',name:'Açaí de 330g',priceCents:1484,available:true,selectionRules:{'acai-cremes':4,adicionais:4,coberturas:2}};
const groups=[{id:'acai-cremes',name:'Açaí e cremes',available:true},{id:'adicionais',name:'Adicionais',available:true},{id:'coberturas',name:'Coberturas',available:true}];
const options=[{id:'base',groupId:'acai-cremes',name:'Açaí tradicional',extraPriceCents:0,available:true}];
const fixture={stores:{'acai-da-bea':{name:'Açaí da Bea',whatsapp:'5585921455990',deliveryEnabled:false}},products:{'acai-330':product},optionGroups:Object.fromEntries(groups.map(g=>[g.id,g])),options:Object.fromEntries(options.map(o=>[o.id,o]))};
const event={preventDefault(){}};

function customer() {
  const h=harness('app',fixture);h.api.init();
  h.callbacks.store(h.dbData.stores['acai-da-bea']);
  h.callbacks.products([structuredClone(product)]);
  h.callbacks.optionGroups(structuredClone(groups));
  h.callbacks.options(structuredClone(options));
  h.api.openProduct('acai-330');
  h.get('product-form').fields={'acai-cremes':['base'],adicionais:[],coberturas:[],itemNote:''};
  h.api.addCurrentProduct(event);
  return h;
}

test('produto indisponível sai também do armazenamento e aviso limpa quando estoque volta',()=>{
  const h=customer();
  assert.equal(h.api.state.cart.length,1);
  h.dbData.products['acai-330'].available=false;
  h.callbacks.products([{...product,available:false}]);
  assert.equal(h.api.state.cart.length,0);
  assert.deepEqual(JSON.parse(h.storage.get('acai-da-bea-cart-v2')),[]);
  assert.equal(h.get('cart-update-notice').hidden,false);
  assert.match(h.get('cart-update-notice').textContent,/removido do carrinho/i);

  h.dbData.products['acai-330'].available=true;
  h.callbacks.products([{...product,available:true}]);
  assert.equal(h.get('cart-update-notice').hidden,true);
  assert.equal(h.get('cart-update-notice').textContent,'');
});

test('checkout revalida exatamente o carrinho atual em memória',async()=>{
  const h=customer();
  h.get('checkout-button').onclick();
  h.get('checkout-form').fields={'customer-name':'Cliente QA','service-type':'retirada'};
  const expected=structuredClone(h.api.state.cart);
  await h.api.handleCheckout(event);
  assert.deepEqual(h.catalogRequests.at(-1),expected);
  assert.equal(h.opened.length,1);
  assert.match(h.opened[0].url,/^https:\/\/wa\.me\//);
});

test('falha síncrona ao navegar para o WhatsApp oferece botão alternativo',async()=>{
  const h=customer();
  h.get('checkout-button').onclick();
  h.get('checkout-form').fields={'customer-name':'Cliente QA','service-type':'retirada'};
  h.env.window.open=()=>({closed:false,location:{replace(){throw new Error('Falha de navegação');}},close(){this.closed=true;}});
  await h.api.handleCheckout(event);
  assert.equal(h.get('whatsapp-fallback').hidden,false);
  assert.match(h.get('whatsapp-fallback').getAttribute('href'),/^https:\/\/wa\.me\//);
  assert.equal(h.api.state.cart.length,1);
});
