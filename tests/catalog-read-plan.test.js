import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCheckoutReadPlan, mergeFreshDocuments } from '../js/catalog-read-plan.js';

test('plano de checkout lê apenas documentos usados pelo carrinho', () => {
  const plan = buildCheckoutReadPlan([
    { id:'acai-330', selectionIds:{'acai-cremes':['base'],adicionais:['morango'],coberturas:[]} },
    { id:'acai-330', selectionIds:{'acai-cremes':['base'],adicionais:['banana']} }
  ], [{id:'acai-cremes'},{id:'adicionais'},{id:'coberturas'}]);
  assert.deepEqual(plan.productIds,['acai-330']);
  assert.deepEqual(plan.groupIds,['acai-cremes','adicionais','coberturas']);
  assert.deepEqual(plan.optionIds,['base','morango','banana']);
  assert.equal(plan.requiresFullCatalog,false);
});

test('aliases antigos de grupo apontam para o documento atual', () => {
  const plan = buildCheckoutReadPlan([
    {id:'acai-330',selectionIds:{'acai-cremes':['base']}}
  ], [{id:'acai-e-cremes'}]);
  assert.deepEqual(plan.groupIds,['acai-e-cremes']);
});

test('carrinho legado por nomes exige conferência completa', () => {
  const plan = buildCheckoutReadPlan([{id:'acai-330',selections:{acaiCremes:['Açaí tradicional']}}]);
  assert.equal(plan.requiresFullCatalog,true);
});

test('produto sem personalização pode ser conferido só pelo produto', () => {
  const plan = buildCheckoutReadPlan([{id:'salada-gourmet',selections:{}}]);
  assert.deepEqual(plan.productIds,['salada-gourmet']);
  assert.deepEqual(plan.groupIds,[]);
  assert.deepEqual(plan.optionIds,[]);
  assert.equal(plan.requiresFullCatalog,false);
});

test('merge substitui documentos conferidos e remove os que sumiram', () => {
  const cached=[{id:'a',price:1},{id:'b',price:2},{id:'c',price:3}];
  const merged=mergeFreshDocuments(cached,[{id:'a',price:10}],['a','b']);
  assert.deepEqual(merged,[{id:'c',price:3},{id:'a',price:10}]);
});
