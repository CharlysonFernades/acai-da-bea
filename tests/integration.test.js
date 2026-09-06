import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './ui-harness.js';

const product={id:'acai-330',name:'Açaí de 330g',priceCents:1299,available:true,selectionRules:{'acai-cremes':4,adicionais:4,coberturas:2}};
const groups=[{id:'acai-e-cremes',name:'Açaí e cremes'},{id:'adicionais',name:'Adicionais'},{id:'coberturas',name:'Coberturas'}];
const options=[{id:'base',groupId:'acai-e-cremes',name:'Açaí tradicional',extraPriceCents:0},{id:'morango',groupId:'adicionais',name:'Morango',extraPriceCents:300}];
const fixture={stores:{'acai-da-bea':{name:'Açaí da Bea',whatsapp:'5585921455990',deliveryEnabled:false}},products:{'acai-330':product},optionGroups:Object.fromEntries(groups.map(g=>[g.id,g])),options:Object.fromEntries(options.map(o=>[o.id,o]))};
const event={preventDefault(){}};
function customer(){
  const h=harness('app',fixture);h.api.init();
  h.callbacks.store(h.dbData.stores['acai-da-bea']);h.callbacks.products([structuredClone(product)]);h.callbacks.optionGroups(structuredClone(groups));h.callbacks.options(structuredClone(options));
  h.api.openProduct('acai-330');h.get('product-form').fields={'acai-cremes':['base'],adicionais:['morango'],itemNote:'<b>Sem granola</b>'};
  h.api.addCurrentProduct(event);h.get('checkout-button').onclick();h.get('checkout-form').fields={'customer-name':'Cliente QA','service-type':'retirada'};
  return h;
}
test('formulário inclui adicional e escapa a observação no carrinho',()=>{
  const h=customer();assert.equal(h.api.state.cart[0].priceCents,1599);assert.match(h.get('cart-items').innerHTML,/&lt;b&gt;Sem granola&lt;\/b&gt;/);
});
test('checkout gera mensagem com preço atual e nome',async()=>{
  const h=customer();await h.api.handleCheckout(event);
  const message=new URL(h.opened[0].url).searchParams.get('text');assert.match(message,/Cliente QA/);assert.match(message,/15,99/);assert.equal(h.get('checkout-dialog').open,false);
});
test('abrir WhatsApp preserva o carrinho e pergunta ao retornar à página',async()=>{
  const h=customer(),cart=structuredClone(h.api.state.cart);h.env.document.hidden=true;
  await h.api.handleCheckout(event);
  assert.deepEqual(h.api.state.cart,cart);assert.equal(h.get('order-return-dialog').open,false);
  h.env.document.hidden=false;h.env.document.listeners.visibilitychange();
  assert.equal(h.get('order-return-dialog').open,true);assert.deepEqual(JSON.parse(h.storage.get('acai-da-bea-cart-v2')),cart);
});
test('continuar o pedido preserva as escolhas e encerra a pergunta',async()=>{
  const h=customer(),cart=structuredClone(h.api.state.cart);await h.api.handleCheckout(event);
  h.get('order-continue').onclick();h.env.window.listeners.focus();
  assert.deepEqual(h.api.state.cart,cart);assert.equal(h.get('order-return-dialog').open,false);
  assert.equal(h.get('cart-drawer')['aria-hidden'],'false');assert.equal(h.storage.has('acai-da-bea-whatsapp-pending-v1'),false);
  assert.equal(h.get('checkout-form').fields['customer-name'],'Cliente QA');
});
test('começar novo pedido limpa itens, dados da finalização e armazenamento',async()=>{
  const h=customer();await h.api.handleCheckout(event);h.get('order-start-new').onclick();
  assert.deepEqual(h.api.state.cart,[]);assert.deepEqual(JSON.parse(h.storage.get('acai-da-bea-cart-v2')),[]);
  assert.deepEqual(h.get('checkout-form').fields,{});assert.equal(h.get('order-return-dialog').open,false);
  assert.equal(h.get('cart-count').textContent,0);assert.match(h.get('cart-total').textContent,/0,00/);
  assert.equal(h.get('whatsapp-fallback').hidden,true);assert.equal(h.storage.has('acai-da-bea-whatsapp-pending-v1'),false);
  const reloaded=harness('app',fixture,new Map(h.storage));reloaded.api.init();
  assert.equal(reloaded.api.state.cart.length,0);assert.equal(reloaded.get('order-return-dialog').open,false);
});
test('reabrir o site após o WhatsApp recupera a confirmação e o carrinho',async()=>{
  const h=customer();await h.api.handleCheckout(event);
  const reloaded=harness('app',fixture,new Map(h.storage));reloaded.api.init();
  assert.equal(reloaded.get('order-return-dialog').open,true);assert.deepEqual(reloaded.api.state.cart,h.api.state.cart);
  assert.equal(reloaded.writes.length,0);
});
test('popup bloqueado só prepara confirmação quando o link alternativo é acionado',async()=>{
  const h=customer();h.env.window.open=()=>null;await h.api.handleCheckout(event);
  assert.equal(h.get('whatsapp-fallback').hidden,false);assert.equal(h.get('order-return-dialog').open,false);
  assert.equal(h.storage.has('acai-da-bea-whatsapp-pending-v1'),false);assert.equal(h.api.state.cart.length,1);
  h.get('whatsapp-fallback').listeners.click(event);h.env.window.listeners.focus();
  assert.equal(h.get('checkout-dialog').open,false);assert.equal(h.get('order-return-dialog').open,true);assert.equal(h.api.state.cart.length,1);
});
test('falha ao abrir WhatsApp mantém os itens sem sugerir que o cliente enviou',async()=>{
  const h=customer();h.env.window.open=()=>({closed:false,location:{replace(){throw new Error('Falha de navegação');}},close(){}});
  await h.api.handleCheckout(event);h.env.window.listeners.focus();
  assert.equal(h.api.state.cart.length,1);assert.equal(h.get('order-return-dialog').open,false);
  assert.equal(h.storage.has('acai-da-bea-whatsapp-pending-v1'),false);
});
test('fechar a confirmação com Escape mantém o pedido',async()=>{
  const h=customer();await h.api.handleCheckout(event);h.get('order-return-dialog').listeners.cancel(event);
  assert.equal(h.api.state.cart.length,1);assert.equal(h.get('order-return-dialog').open,false);
  assert.equal(h.storage.has('acai-da-bea-whatsapp-pending-v1'),false);
});
test('confirmação continua funcionando se o navegador recusar armazenamento',async()=>{
  const h=customer();h.env.localStorage.setItem=()=>{throw new Error('Armazenamento indisponível');};h.env.localStorage.removeItem=()=>{throw new Error('Armazenamento indisponível');};
  await h.api.handleCheckout(event);assert.equal(h.get('order-return-dialog').open,true);
  h.get('order-start-new').onclick();assert.equal(h.api.state.cart.length,0);assert.equal(h.get('order-return-dialog').open,false);
});
test('preço alterado no servidor exige revisão antes de abrir WhatsApp',async()=>{
  const h=customer();h.dbData.products['acai-330'].priceCents=1699;await h.api.handleCheckout(event);
  assert.equal(h.api.state.cart[0].priceCents,1999);assert.equal(h.opened[0].url,undefined);assert.equal(h.opened[0].closed,true);assert.equal(h.api.state.cartNeedsReview,true);
  assert.equal(h.storage.has('acai-da-bea-whatsapp-pending-v1'),false);
});
test('revisão aceita libera o pedido atualizado sem repetir o bloqueio',async()=>{
  const h=customer();h.dbData.products['acai-330'].priceCents=1699;await h.api.handleCheckout(event);h.get('checkout-button').onclick();await h.api.handleCheckout(event);
  assert.match(new URL(h.opened[1].url).searchParams.get('text'),/19,99/);
});
test('estoque alterado no servidor impede a mensagem',async()=>{
  const h=customer();h.dbData.products['acai-330'].available=false;await h.api.handleCheckout(event);
  assert.equal(h.api.state.cart.length,0);assert.equal(h.opened[0].url,undefined);
});
test('nome vazio e endereço incompleto impedem a finalização',async()=>{
  const h=customer();h.get('checkout-form').fields={'customer-name':'   '};await h.api.handleCheckout(event);assert.equal(h.opened.length,0);
  h.api.state.store.deliveryEnabled=true;h.get('checkout-form').fields={'customer-name':'Teste','service-type':'delivery'};await h.api.handleCheckout(event);assert.equal(h.opened.length,0);
});
test('desativar delivery durante a conferência exige revisar atendimento',async()=>{
  const h=customer();h.api.state.store.deliveryEnabled=true;h.get('checkout-form').fields={'customer-name':'Teste','service-type':'delivery','delivery-street':'Rua QA','delivery-number':'10','delivery-neighborhood':'Centro'};
  await h.api.handleCheckout(event);assert.equal(h.opened[0].url,undefined);assert.equal(h.opened[0].closed,true);
});
test('cadastro inicial preserva todos os documentos quando a coleção já tem dados',async()=>{
  const h=harness('admin',fixture);await assert.rejects(h.api.seedEmptyCollections([['products',[{id:'acai-330',priceCents:1484}]]]),/preservados/);
  assert.equal(h.writes.length,0);assert.equal(h.dbData.products['acai-330'].priceCents,1299);
});
test('cadastro inicial funciona sem ler documentos inexistentes',async()=>{
  const h=harness('admin');await h.api.seedEmptyCollections([['products',[{id:'novo',name:'Novo',priceCents:1000}]]]);
  assert.equal(h.dbData.products.novo.priceCents,1000);assert.equal(h.dbData.stores['acai-da-bea'].catalogRevision,1);
});
test('novo produto não sobrescreve cadastro de mesmo identificador',async()=>{
  const h=harness('admin',fixture);await assert.rejects(h.api.saveRecord('products','acai-330',{priceCents:1},true),/Já existe/);assert.equal(h.writes.length,0);
});
test('edição substitui regras removidas em vez de mesclar campos antigos',async()=>{
  const h=harness('admin',fixture);await h.api.saveRecord('products','acai-330',{selectionRules:{'acai-cremes':4}},false);
  assert.deepEqual(h.dbData.products['acai-330'].selectionRules,{'acai-cremes':4});
});
test('preço inválido no formulário administrativo não produz escrita',async()=>{
  const h=harness('admin',fixture);h.api.bind();h.get('product-name').value='Produto de teste';h.get('product-price').value='abc';
  await h.get('product-form').listeners.submit(event);assert.equal(h.writes.length,0);assert.match(h.get('product-price').validationMessage,/preço maior que zero/);
});
test('perfis sem autorização são negados pela verificação do painel',async()=>{
  const h=harness('admin');assert.equal(await h.api.verify({uid:'qa'}),null);
  for(const data of [{active:false,role:'owner',storeId:'acai-da-bea'},{active:true,role:'customer',storeId:'acai-da-bea'},{active:true,role:'owner',storeId:'outra-loja'}]){h.dbData.admins.qa=data;assert.equal(await h.api.verify({uid:'qa'}),null);}
  h.dbData.admins.qa={active:true,role:'owner',storeId:'acai-da-bea'};assert.equal((await h.api.verify({uid:'qa'})).role,'owner');
});
