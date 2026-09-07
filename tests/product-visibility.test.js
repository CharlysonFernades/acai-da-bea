import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCartItem, reconcileCart, productUnavailableReason } from '../js/order-utils.js';

const groups=[];
const options=[];
const base={id:'garrafa-500',name:'Garrafa 500ml',priceCents:1500,available:true,selectionRules:{}};

test('produto antigo sem visible continua visível e vendável',()=>{
  assert.equal(productUnavailableReason(base,groups,options),'');
  assert.ok(buildCartItem(base,{quantity:1},groups,options).item);
});

test('produto oculto é recusado e removido do carrinho',()=>{
  const hidden={...base,visible:false};
  assert.match(productUnavailableReason(hidden,groups,options),/cardápio/);
  const result=reconcileCart([{...base,quantity:1,priceCents:1500,selections:{},selectionIds:{},fingerprint:'antigo'}],[hidden],groups,options);
  assert.equal(result.items.length,0);
  assert.match(result.messages.join(' '),/cardápio/);
});

test('cliente filtra produtos ocultos da grade e do preço inicial',()=>{
  const source=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
  assert.match(source,/state\.products\.filter\(product=>product\.visible!==false\)\.map/);
  assert.match(source,/state\.products\.filter\(p=>p\.visible!==false&&!unavailableReason\(p\)\)/);
});

test('painel possui controles separados de estoque e visibilidade',()=>{
  const source=fs.readFileSync(new URL('../admin/admin.js',import.meta.url),'utf8');
  assert.match(source,/data-toggle-product/);
  assert.match(source,/data-toggle-visible/);
  assert.match(source,/Oculto/);
  assert.match(source,/No cardápio/);
});

test('rules aceitam visible opcional e validam booleano',()=>{
  const source=fs.readFileSync(new URL('../firebase/firestore.rules',import.meta.url),'utf8');
  assert.match(source,/'visible'/);
  assert.match(source,/data\.get\('visible', true\) is bool/);
});
