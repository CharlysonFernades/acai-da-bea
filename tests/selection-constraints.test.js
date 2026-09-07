import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveSelectionConstraints, effectiveSelectionRules, buildCartItem, productUnavailableReason } from '../js/order-utils.js';

const groups = [
  { id:'acai-cremes', name:'Açaí e cremes', available:true },
  { id:'adicionais', name:'Adicionais', available:true },
  { id:'coberturas', name:'Coberturas', available:true },
  { id:'sabores-garrafa', name:'Sabores da garrafa', available:true }
];
const options = [
  { id:'base', groupId:'acai-cremes', name:'Açaí tradicional', available:true, extraPriceCents:0 },
  { id:'banana', groupId:'adicionais', name:'Banana', available:true, extraPriceCents:0 },
  { id:'chocolate', groupId:'coberturas', name:'Chocolate', available:true, extraPriceCents:0 },
  { id:'morango', groupId:'sabores-garrafa', name:'Morango', available:true, extraPriceCents:0 },
  { id:'ninho', groupId:'sabores-garrafa', name:'Ninho', available:true, extraPriceCents:0 }
];

test('regras antigas numéricas continuam compatíveis', () => {
  const product={id:'acai-330',name:'Açaí 330g',selectionRules:{'acai-cremes':4,adicionais:4,coberturas:2}};
  assert.deepEqual(effectiveSelectionConstraints(product),{
    'acai-cremes':{min:1,max:4},
    adicionais:{min:0,max:4},
    coberturas:{min:0,max:2}
  });
  assert.deepEqual(effectiveSelectionRules(product),{'acai-cremes':4,adicionais:4,coberturas:2});
});

test('produto flexível aceita grupo próprio com mínimo e máximo', () => {
  const product={id:'garrafa-500',name:'Garrafa de açaí 500 ml',priceCents:1800,available:true,selectionRules:{'sabores-garrafa':{min:1,max:1}}};
  assert.deepEqual(effectiveSelectionConstraints(product),{'sabores-garrafa':{min:1,max:1}});
  assert.match(buildCartItem(product,{selectionIds:{}},groups,options).error,/no mínimo 1 opção em Sabores da garrafa/);
  const result=buildCartItem(product,{selectionIds:{'sabores-garrafa':['morango']}},groups,options);
  assert.equal(result.error,undefined);
  assert.deepEqual(result.item.selections['sabores-garrafa'],['Morango']);
});

test('garrafa com 330 no nome não herda grupos do açaí de 330g', () => {
  const product={id:'garrafa-330',name:'Garrafa 330 ml',selectionRules:{'sabores-garrafa':{min:1,max:1}}};
  const rules=effectiveSelectionConstraints(product);
  assert.deepEqual(Object.keys(rules),['sabores-garrafa']);
  assert.equal(rules['acai-cremes'],undefined);
});

test('produtos originais preservam grupos inferidos pelo id', () => {
  assert.deepEqual(effectiveSelectionRules({id:'acai-750',selectionRules:{}}),{'acai-cremes':6,adicionais:6,coberturas:2});
  assert.equal(effectiveSelectionConstraints({id:'acai-1kg',selectionRules:{}})['acai-cremes'].min,1);
});

test('grupo obrigatório sem opções suficientes deixa produto indisponível', () => {
  const product={id:'garrafa-500',name:'Garrafa',priceCents:1800,available:true,selectionRules:{'sabores-garrafa':{min:2,max:2}}};
  const oneFlavor=options.filter(option=>option.id!=='ninho');
  assert.match(productUnavailableReason(product,groups,oneFlavor),/Sem opções suficientes em Sabores da garrafa/);
});

test('mínimo zero mantém grupo opcional', () => {
  const product={id:'especial',name:'Especial',priceCents:1200,available:true,selectionRules:{adicionais:{min:0,max:2}}};
  const result=buildCartItem(product,{selectionIds:{}},groups,options);
  assert.equal(result.error,undefined);
  assert.deepEqual(result.item.selectionIds.adicionais,[]);
});

test('máximo continua sendo validado no servidor do carrinho', () => {
  const product={id:'garrafa-500',name:'Garrafa',priceCents:1800,available:true,selectionRules:{'sabores-garrafa':{min:1,max:1}}};
  assert.match(buildCartItem(product,{selectionIds:{'sabores-garrafa':['morango','ninho']}},groups,options).error,/até 1 opção/);
});

test('ordem principal continua fixa e grupo futuro vem depois', () => {
  const product={id:'produto',selectionRules:{coberturas:{min:0,max:2},'sabores-garrafa':{min:1,max:1},adicionais:{min:0,max:3},'acai-cremes':{min:1,max:4}}};
  assert.deepEqual(Object.keys(effectiveSelectionConstraints(product)),['acai-cremes','adicionais','coberturas','sabores-garrafa']);
});
