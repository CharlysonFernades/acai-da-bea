from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'Padrao nao encontrado em {path}: {old[:120]}')
    p.write_text(text.replace(old, new, 1))


# Cliente: produto oculto não aparece e não permanece no carrinho.
replace_once(
    'js/order-utils.js',
    "export function productUnavailableReason(product, groups, options) {\n  if (!product || product.available === false) return 'Produto indisponível.';",
    "export function productUnavailableReason(product, groups, options) {\n  if (!product) return 'Produto indisponível.';\n  if (product.visible === false) return 'Produto não está mais no cardápio.';\n  if (product.available === false) return 'Produto indisponível.';",
)
replace_once(
    'js/app.js',
    "    if(product&&product.available===false)state.removedUnavailableProductIds.add(item.id);",
    "    if(product&&(product.available===false||product.visible===false))state.removedUnavailableProductIds.add(item.id);",
)
replace_once(
    'js/app.js',
    "  const available=state.products.filter(p=>!unavailableReason(p));",
    "  const available=state.products.filter(p=>p.visible!==false&&!unavailableReason(p));",
)
replace_once(
    'js/app.js',
    "  els.productGrid.innerHTML=state.products.map(product=>{",
    "  els.productGrid.innerHTML=state.products.filter(product=>product.visible!==false).map(product=>{",
)

# Painel: estoque e publicação são controles diferentes.
old_render = "  root.innerHTML=state.products.length?state.products.map(product=>`<article class=\"list-item\"><div><h3>${e(product.name)}</h3><p>R$ ${money(product.priceCents)} • ${e(product.category||'Sem categoria')}</p></div><div class=\"list-actions\"><button class=\"availability ${product.available===false?'off':'on'}\" data-toggle-product=\"${e(product.id)}\">${product.available===false?'Esgotado':'Disponível'}</button><button class=\"btn ghost small\" data-edit-product=\"${e(product.id)}\">Editar</button></div></article>`).join(''):'<div class=\"empty\">Nenhum produto cadastrado.</div>';"
new_render = "  root.innerHTML=state.products.length?state.products.map(product=>`<article class=\"list-item\"><div><h3>${e(product.name)}</h3><p>R$ ${money(product.priceCents)} • ${e(product.category||'Sem categoria')}</p></div><div class=\"list-actions\"><button class=\"availability ${product.available===false?'off':'on'}\" data-toggle-product=\"${e(product.id)}\">${product.available===false?'Esgotado':'Disponível'}</button><button class=\"availability ${product.visible===false?'off':'on'}\" data-toggle-visible=\"${e(product.id)}\">${product.visible===false?'Oculto':'No cardápio'}</button><button class=\"btn ghost small\" data-edit-product=\"${e(product.id)}\">Editar</button></div></article>`).join(''):'<div class=\"empty\">Nenhum produto cadastrado.</div>';"
replace_once('admin/admin.js', old_render, new_render)

old_toggle = "  root.querySelectorAll('[data-toggle-product]').forEach(button=>button.onclick=()=>action(button,async()=>{\n    const product=state.products.find(p=>p.id===button.dataset.toggleProduct);\n    await updateDoc(doc(db,'products',product.id),{available:product.available===false});toast('Disponibilidade atualizada.');\n  }));"
new_toggle = old_toggle + "\n  root.querySelectorAll('[data-toggle-visible]').forEach(button=>button.onclick=()=>action(button,async()=>{\n    const product=state.products.find(p=>p.id===button.dataset.toggleVisible);\n    await updateDoc(doc(db,'products',product.id),{visible:product.visible===false});toast(product.visible===false?'Produto exibido no cardápio.':'Produto ocultado do cardápio.');\n  }));"
replace_once('admin/admin.js', old_toggle, new_toggle)

old_save = "await saveRecord('products',id,{storeId:STORE_ID,name,priceCents,oldPriceCents:oldPriceCents||null,category:$('product-category').value.trim(),description:$('product-description').value.trim(),image,order:Number($('product-order').value)||0,available:$('product-available').checked,selectionRules:rules},!current);"
new_save = "await saveRecord('products',id,{storeId:STORE_ID,name,priceCents,oldPriceCents:oldPriceCents||null,category:$('product-category').value.trim(),description:$('product-description').value.trim(),image,order:Number($('product-order').value)||0,available:$('product-available').checked,visible:previous?.visible!==false,selectionRules:rules},!current);"
replace_once('admin/admin.js', old_save, new_save)

# Firestore Rules: visible opcional para documentos antigos.
rules_path = Path('firebase/firestore.rules')
rules = rules_path.read_text()
needle = "        'available',\n        'selectionRules'\n      ]);"
replacement = "        'available',\n        'visible',\n        'selectionRules'\n      ]);"

create_start = rules.index('    function productCreateFieldsAllowed()')
update_start = rules.index('    function productUpdateFieldsAllowed()', create_start)
create_block = rules[create_start:update_start]
create_pos = create_block.rfind(needle)
if create_pos < 0:
    raise SystemExit('Lista hasOnly de criação de produto não encontrada nas rules.')
create_block = create_block[:create_pos] + create_block[create_pos:].replace(needle, replacement, 1)
rules = rules[:create_start] + create_block + rules[update_start:]

update_start = rules.index('    function productUpdateFieldsAllowed()')
valid_start = rules.index('    function productDataIsValid(data)', update_start)
update_block = rules[update_start:valid_start]
if needle not in update_block:
    raise SystemExit('Lista de atualização de produto não encontrada nas rules.')
update_block = update_block.replace(needle, replacement, 1)
rules = rules[:update_start] + update_block + rules[valid_start:]

validation_old = "        && data.available is bool\n        && data.selectionRules is map"
validation_new = "        && data.available is bool\n        && data.get('visible', true) is bool\n        && data.selectionRules is map"
if validation_old not in rules:
    raise SystemExit('Validação de produto não encontrada nas rules.')
rules = rules.replace(validation_old, validation_new, 1)
rules_path.write_text(rules)

Path('tests/product-visibility.test.js').write_text("""import test from 'node:test';
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
  assert.match(source,/state\\.products\\.filter\\(product=>product\\.visible!==false\\)\\.map/);
  assert.match(source,/state\\.products\\.filter\\(p=>p\\.visible!==false&&!unavailableReason\\(p\\)\\)/);
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
  assert.match(source,/data\\.get\\('visible', true\\) is bool/);
});
""")
