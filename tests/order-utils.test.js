import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoneyCents, normalizeGroupId, effectiveSelectionRules, productUnavailableReason, buildCartItem, reconcileCart, buildWhatsAppMessage, escapeHTML, safeImageSource, safeExternalUrl, normalizeWhatsApp } from '../js/order-utils.js';

const product = { id:'acai-330', name:'Açaí de 330g', priceCents:1299, available:true, selectionRules:{'acai-cremes':4,adicionais:4,coberturas:2} };
const groups = [{id:'acai-cremes',name:'Açaí e cremes'},{id:'adicionais',name:'Adicionais'},{id:'coberturas',name:'Coberturas'}];
const options = [{id:'base',groupId:'acai-cremes',name:'Açaí tradicional',available:true,extraPriceCents:0},{id:'morango',groupId:'adicionais',name:'Morango',available:true,extraPriceCents:300}];
const raw = {selectionIds:{'acai-cremes':['base'],adicionais:['morango']},quantity:2,itemNote:'Sem granola'};
const make = (p=product,r=raw,g=groups,o=options) => buildCartItem(p,r,g,o);

test('preços aceitam vírgula e ponto sem multiplicar o valor por 100',()=>{
  for(const input of ['14,84','14.84','R$ 14,84',' 14.84 '])assert.equal(parseMoneyCents(input),1484);
  assert.equal(parseMoneyCents('14'),1400);assert.equal(parseMoneyCents('14,8'),1480);
  assert.equal(parseMoneyCents('1.234,56'),123456);
});
test('preços inválidos e formatos ambíguos são rejeitados',()=>{
  for(const input of ['abc','-5','0','','1.234','1,234','1e3','12..00','14,84 reais','999999999999999999999'])assert.equal(parseMoneyCents(input),null,input);
  assert.equal(parseMoneyCents('0',{allowZero:true}),0);
  assert.equal(parseMoneyCents('',{optional:true,allowZero:true}),0);
});
test('adicionais pagos entram no valor unitário e no total por quantidade',()=>{
  const {item,error}=make();assert.equal(error,undefined);assert.equal(item.basePriceCents,1299);assert.equal(item.extraPriceCents,300);assert.equal(item.priceCents,1599);assert.equal(item.priceCents*item.quantity,3198);
});
test('uma base basta; adicionais e coberturas são opcionais',()=>{
  assert.equal(make(product,{selectionIds:{'acai-cremes':['base']}}).item.priceCents,1299);
  assert.equal(make(product,{selectionIds:{}}).error,'Selecione no mínimo 1 opção.');
});
test('limite máximo é validado no pedido mesmo fora do controle visual',()=>{
  const extraBases=Array.from({length:5},(_,i)=>({id:`base-${i}`,groupId:'acai-cremes',name:`Base ${i}`}));
  assert.match(make(product,{selectionIds:{'acai-cremes':extraBases.map(o=>o.id)}},groups,extraBases).error,/até 4/);
});
test('produto com todas as bases indisponíveis é bloqueado',()=>{
  const soldOut=options.map(o=>({...o,available:false}));
  assert.match(productUnavailableReason(product,groups,soldOut),/Sem opções/);
  assert.equal(make(product,raw,groups,soldOut).item,undefined);
});
test('identificadores antigos e novos do grupo usam as mesmas regras',()=>{
  for(const id of ['acaiCremes','acai-cremes','acai-e-cremes','açaí-cremes'])assert.equal(normalizeGroupId(id),'acai-cremes');
  const alternateGroups=groups.map(g=>({...g,id:g.id==='acai-cremes'?'acai-e-cremes':g.id}));
  const alternateOptions=options.map(o=>({...o,groupId:o.groupId==='acai-cremes'?'acai-e-cremes':o.groupId}));
  assert.equal(make({...product,selectionRules:{'acai-e-cremes':4,adicionais:4}},raw,alternateGroups,alternateOptions).item.priceCents,1599);
});
test('tamanhos conhecidos preservam a base obrigatória em cadastros antigos',()=>{
  assert.equal(effectiveSelectionRules({...product,selectionRules:{adicionais:4}})['acai-cremes'],4);
  assert.equal(effectiveSelectionRules({...product,selectionRules:{}})['acai-cremes'],4);
});
test('mudanças de preço são recalculadas e produzem aviso para revisão',()=>{
  const old=make().item;
  const result=reconcileCart([old],[{...product,priceCents:1699}],groups,options);
  assert.equal(result.items[0].priceCents,1999);assert.equal(result.items[0].priceCents*result.items[0].quantity,3998);assert.match(result.messages.join(' '),/preço atualizado/);
});
test('produto esgotado ou removido não permanece no pedido',()=>{
  for(const products of [[{...product,available:false}],[]]){
    const result=reconcileCart([make().item],products,groups,options);assert.equal(result.items.length,0);assert.ok(result.messages.length);
  }
});
test('opção esgotada invalida o item e alteração de adicional recalcula o valor',()=>{
  const old=make().item;
  assert.equal(reconcileCart([old],[product],groups,options.map(o=>({...o,available:o.id!=='morango'}))).items.length,0);
  const repriced=reconcileCart([old],[product],groups,options.map(o=>({...o,extraPriceCents:o.id==='morango'?500:0})));
  assert.equal(repriced.items[0].priceCents,1799);
});
test('carrinho antigo é migrado por nomes e nunca usa o preço salvo como autoridade',()=>{
  const old={id:product.id,name:product.name,priceCents:1,quantity:1,selections:{acaiCremes:['Açaí tradicional'],adicionais:['Morango']}};
  const result=reconcileCart([old],[product],groups,options);
  assert.equal(result.items[0].priceCents,1599);assert.deepEqual(result.items[0].selectionIds['acai-cremes'],['base']);assert.ok(result.messages.length);
});
test('carrinho normalizado não exige revisão repetida sem alteração',()=>{
  const old=make().item;const result=reconcileCart([old],[product],groups,options);
  assert.equal(result.changed,false);assert.deepEqual(result.messages,[]);
});
test('WhatsApp inclui nome, acréscimos, quantidade, notas e mantém os dois emojis aprovados',()=>{
  const item=make().item;
  const message=buildWhatsAppMessage({name:'Açaí da Bea'},{name:'Cliente de teste',items:[item],total:3198,serviceType:'retirada',serviceLabel:'Retirada na loja',notes:'Confirmar horário'},groups);
  assert.match(message,/\*Cliente\*\nCliente de teste/);assert.match(message,/2x Açaí de 330g/);assert.match(message,/31,98/);assert.match(message,/Sem granola/);assert.match(message,/Confirmar horário/);
  assert.equal((message.match(/🛍️/gu)||[]).length,1);assert.equal((message.match(/💰/gu)||[]).length,1);
});
test('WhatsApp inclui endereço somente para delivery',()=>{
  const payload={name:'Teste',items:[make().item],total:3198,serviceType:'delivery',serviceLabel:'Delivery',address:{street:'Rua de teste',number:'10',neighborhood:'Centro',reference:'Portão azul'}};
  assert.match(buildWhatsAppMessage({},payload,groups),/Rua de teste, 10 - Centro/);
  assert.doesNotMatch(buildWhatsAppMessage({},{...payload,serviceType:'retirada'},groups),/Rua de teste/);
});
test('campos de texto e endereços de imagem são tratados com segurança',()=>{
  assert.equal(escapeHTML('<b>"Açaí" & creme</b>'), '&lt;b&gt;&quot;Açaí&quot; &amp; creme&lt;/b&gt;');
  assert.equal(safeImageSource('assets/images/acai-330.webp'),'assets/images/acai-330.webp');
  for(const invalid of ['javascript:alert(1)','assets/images/../../x.svg','data:text/html,test','" onerror="test'])assert.equal(safeImageSource(invalid,''),'');
  assert.equal(safeExternalUrl('javascript:alert(1)'),'');assert.equal(safeExternalUrl('https://user:pass@example.com'),'');
  assert.equal(normalizeWhatsApp('(85) 92145-5990'),'5585921455990');assert.equal(normalizeWhatsApp('abc'),'');
});
