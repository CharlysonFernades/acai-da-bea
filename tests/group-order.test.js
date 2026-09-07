import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveSelectionRules } from '../js/order-utils.js';

test('padroniza a ordem visual dos grupos principais', () => {
  const rules = effectiveSelectionRules({
    id: 'acai-330',
    name: 'Açaí de 330g',
    selectionRules: { coberturas: 2, adicionais: 4, 'acai-cremes': 4 }
  });
  assert.deepEqual(Object.keys(rules), ['acai-cremes', 'adicionais', 'coberturas']);
});

test('mantem grupos futuros depois dos grupos principais sem descarta-los', () => {
  const rules = effectiveSelectionRules({
    id: 'garrafa-500',
    name: 'Garrafa de açaí 500ml',
    selectionRules: { sabores: 1, coberturas: 2, adicionais: 1 }
  });
  assert.deepEqual(Object.keys(rules), ['adicionais', 'coberturas', 'sabores']);
  assert.equal(rules.sabores, 1);
});
