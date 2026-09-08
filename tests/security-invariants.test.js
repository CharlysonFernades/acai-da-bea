import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const rules = read('../firebase/firestore.rules');
const firebaseConfig = read('../js/firebase-config.js');
const publicHtml = read('../index.html');
const adminHtml = read('../admin/index.html');

test('Firestore mantém autorização administrativa vinculada a conta ativa e loja correta', () => {
  assert.match(rules, /request\.auth != null/);
  assert.match(rules, /adminDoc\(\)\.active == true/);
  assert.match(rules, /adminDoc\(\)\.role in \['owner', 'admin'\]/);
  assert.match(rules, /adminDoc\(\)\.storeId == 'acai-da-bea'/);
});

test('documento de autorização do admin não pode ser alterado pelo cliente', () => {
  assert.match(rules, /match \/admins\/\{uid\}[\s\S]*?allow read: if signedIn\(\) && request\.auth\.uid == uid;[\s\S]*?allow write: if false;/);
});

test('coleções críticas preservam bloqueio de exclusão e fallback deny-all', () => {
  for (const collection of ['stores', 'products', 'optionGroups', 'options']) {
    const block = rules.match(new RegExp(`match \\/${collection}\\/\\{[^}]+\\} \\{([\\s\\S]*?)\\n    \\}`));
    assert.ok(block, `bloco ${collection} deve existir`);
    assert.match(block[1], /allow delete: if false;/, `${collection} deve bloquear exclusão`);
  }
  assert.match(rules, /match \/\{document=\*\*\} \{[\s\S]*?allow read, write: if false;/);
});

test('alterações do catálogo continuam limitadas a campos explicitamente permitidos', () => {
  assert.match(rules, /productUpdateFieldsAllowed\(\)[\s\S]*?affectedKeys\(\)\.hasOnly/);
  assert.match(rules, /groupUpdateFieldsAllowed\(\)[\s\S]*?affectedKeys\(\)\.hasOnly/);
  assert.match(rules, /optionUpdateFieldsAllowed\(\)[\s\S]*?affectedKeys\(\)\.hasOnly/);
  assert.match(rules, /optionGroupReferenceIsValid\(\)/);
});

test('configuração web não contém material de conta de serviço ou chave privada', () => {
  for (const forbidden of ['BEGIN PRIVATE KEY', 'private_key', 'client_email', 'service_account']) {
    assert.doesNotMatch(firebaseConfig, new RegExp(forbidden, 'i'));
  }
});

test('site público não divulga rota administrativa', () => {
  assert.doesNotMatch(publicHtml, /href=["'][^"']*\/admin\/?["']/i);
  assert.doesNotMatch(publicHtml, /painel administrativo/i);
});

test('login administrativo preserva campos próprios para credenciais', () => {
  assert.match(adminHtml, /type="email"[^>]*autocomplete="username"/);
  assert.match(adminHtml, /type="password"[^>]*autocomplete="current-password"/);
  assert.match(adminHtml, /Somente contas autorizadas no Firebase conseguem acessar o painel/);
});
