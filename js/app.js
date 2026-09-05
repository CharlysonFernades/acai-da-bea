import { loadData, CART_KEY, brl, escapeHTML } from './demo-store.js';

let data = loadData();
let activeProduct = null;
let cart = loadCart();

const $ = s => document.querySelector(s);
const grid = $('#product-grid');
const productDialog = $('#product-dialog');
const dialogContent = $('#product-dialog-content');
const cartDrawer = $('#cart-drawer');
const backdrop = $('#backdrop');
const checkoutDialog = $('#checkout-dialog');

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

function absoluteImage(path) {
  return path || 'assets/images/acai-330.webp';
}

function applyStore() {
  const s = data.store;
  document.title = `${s.name} • Cardápio`;
  $('#brand-name').textContent = s.name;
  $('#hero-tagline').textContent = s.tagline;
  $('#whatsapp-display').textContent = s.whatsappDisplay;
  $('#instagram-display').textContent = s.instagram;

  const wa = `https://wa.me/${encodeURIComponent(s.whatsapp)}`;
  $('#hero-whatsapp').href = wa;
  $('#contact-whatsapp').href = wa;
  $('#contact-instagram').href = s.instagramUrl;
  $('#contact-maps').href = s.mapsUrl;
}

function renderProducts() {
  const products = [...data.products].sort((a, b) => (a.order || 0) - (b.order || 0));
  grid.innerHTML = products.map(p => {
    const buttonText = !p.available ? 'Indisponível no momento' : (Object.keys(p.rules || {}).length ? 'Escolher e personalizar' : 'Adicionar ao pedido');
    return `
      <article class="product-card">
        <div class="product-media">
          <img src="${escapeHTML(absoluteImage(p.image))}" alt="${escapeHTML(p.name)}" loading="lazy" width="960" height="720">
          <span class="status-badge ${p.available ? '' : 'off'}">${p.available ? 'DISPONÍVEL' : 'ESGOTADO'}</span>
        </div>
        <div class="product-body">
          <h3>${escapeHTML(p.name)}</h3>
          <p>${escapeHTML(p.description)}</p>
          <p class="product-note">${escapeHTML(p.note || '')}</p>
          <div class="price-row">
            <strong>${brl(p.priceCents)}</strong>
            ${p.oldPriceCents ? `<span class="old-price">${brl(p.oldPriceCents)}</span>` : ''}
          </div>
          <button class="add-button" data-product="${escapeHTML(p.id)}" ${p.available ? '' : 'disabled'}>${buttonText}</button>
        </div>
      </article>`;
  }).join('');

  grid.querySelectorAll('[data-product]').forEach(btn => {
    btn.addEventListener('click', () => openProduct(btn.dataset.product));
  });
}

function groupHTML(groupId, max) {
  const group = data.groups.find(g => g.id === groupId);
  if (!group) return '';
  const items = data.ingredients.filter(i => i.groupId === groupId);
  return `
    <section class="custom-group" data-group="${groupId}" data-max="${max}">
      <div class="group-head">
        <h3>${escapeHTML(group.name)}</h3>
        <span class="limit-badge">até ${max}</span>
      </div>
      <div class="option-grid">
        ${items.map(i => `
          <label class="option ${i.available ? '' : 'disabled'}">
            <input type="checkbox" name="${groupId}" value="${escapeHTML(i.id)}" ${i.available ? '' : 'disabled'}>
            <span>${escapeHTML(i.name)}${i.available ? '' : ' • esgotado'}</span>
          </label>`).join('')}
      </div>
      <p class="demo-note">${escapeHTML(group.note || '')}</p>
    </section>`;
}

function openProduct(id) {
  const p = data.products.find(x => x.id === id);
  if (!p || !p.available) return;

  activeProduct = p;
  const groups = Object.entries(p.rules || {})
    .filter(([, max]) => max > 0)
    .map(([groupId, max]) => groupHTML(groupId, max))
    .join('');

  dialogContent.innerHTML = `
    <div class="dialog-product-head">
      <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">
      <div>
        <h2>${escapeHTML(p.name)}</h2>
        <p>${escapeHTML(p.description)}</p>
        <strong class="dialog-price">${brl(p.priceCents)}</strong>
      </div>
    </div>
    ${groups}
    <div class="dialog-actions">
      <button class="button primary full" type="button" id="add-active-product">Adicionar ao pedido</button>
    </div>`;

  dialogContent.querySelectorAll('.custom-group').forEach(section => {
    const max = Number(section.dataset.max);
    section.querySelectorAll('input').forEach(input => input.addEventListener('change', () => {
      const checked = section.querySelectorAll('input:checked');
      if (checked.length > max) {
        input.checked = false;
        toast(`Escolha no máximo ${max} opção${max > 1 ? 'ões' : ''} neste grupo.`);
      }
    }));
  });

  $('#add-active-product').addEventListener('click', addActiveProduct);
  productDialog.showModal();
}

function selectedChoices() {
  const result = {};
  dialogContent.querySelectorAll('.custom-group').forEach(section => {
    result[section.dataset.group] = [...section.querySelectorAll('input:checked')].map(input => input.value);
  });
  return result;
}

function choiceNames(choices) {
  return Object.entries(choices || {}).flatMap(([groupId, ids]) => {
    const group = data.groups.find(x => x.id === groupId);
    const names = ids.map(id => data.ingredients.find(i => i.id === id)?.name).filter(Boolean);
    return names.length ? [{ groupName: group?.name || groupId, names }] : [];
  });
}

function addActiveProduct() {
  if (!activeProduct) return;
  cart.push({
    key: `${activeProduct.id}-${Date.now()}`,
    productId: activeProduct.id,
    qty: 1,
    choices: selectedChoices()
  });
  saveCart();
  productDialog.close();
  toast('Adicionado ao pedido');
}

function renderCart() {
  $('#cart-count').textContent = cart.reduce((s, i) => s + i.qty, 0);
  const current = cart
    .map(item => ({ ...item, product: data.products.find(p => p.id === item.productId) }))
    .filter(x => x.product);

  if (!current.length) {
    $('#cart-items').innerHTML = `
      <div class="empty-cart">
        <div>
          <div style="font-size:38px">🛒</div>
          <strong>Seu pedido está vazio</strong>
          <p>Escolha um item do cardápio para começar.</p>
        </div>
      </div>`;
    $('#cart-footer').hidden = true;
    return;
  }

  $('#cart-footer').hidden = false;
  $('#cart-items').innerHTML = current.map(({ product: p, ...item }) => {
    const groups = choiceNames(item.choices)
      .map(({ groupName, names }) => `${escapeHTML(groupName)}: ${escapeHTML(names.join(', '))}`)
      .join('<br>');

    return `
      <article class="cart-item">
        <div class="cart-item-top">
          <h3>${escapeHTML(p.name)}</h3>
          <strong>${brl(p.priceCents * item.qty)}</strong>
        </div>
        <p>${groups || 'Sem personalização'}</p>
        <div class="cart-item-actions">
          <div class="qty">
            <button data-dec="${item.key}" aria-label="Diminuir">−</button>
            <b>${item.qty}</b>
            <button data-inc="${item.key}" aria-label="Aumentar">+</button>
          </div>
          <button class="remove-item" data-remove="${item.key}">Remover</button>
        </div>
      </article>`;
  }).join('');

  $('#cart-total').textContent = brl(current.reduce((s, x) => s + x.product.priceCents * x.qty, 0));
  $('#cart-items').querySelectorAll('[data-inc]').forEach(b => b.onclick = () => changeQty(b.dataset.inc, 1));
  $('#cart-items').querySelectorAll('[data-dec]').forEach(b => b.onclick = () => changeQty(b.dataset.dec, -1));
  $('#cart-items').querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {
    cart = cart.filter(i => i.key !== b.dataset.remove);
    saveCart();
  });
}

function changeQty(key, delta) {
  const item = cart.find(x => x.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
}

function openCart() {
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  backdrop.hidden = true;
}

function validateCart() {
  const unavailable = cart.filter(i => !data.products.find(p => p.id === i.productId)?.available);
  if (unavailable.length) {
    toast('Um item ficou indisponível. Atualizamos seu carrinho.');
    cart = cart.filter(i => data.products.find(p => p.id === i.productId)?.available);
    saveCart();
    return false;
  }
  return cart.length > 0;
}

function buildWhatsAppMessage(name, notes) {
  const storeName = data.store?.name || 'Açaí da Bea';
  const lines = [
    `🍧 *NOVO PEDIDO — ${storeName.toUpperCase()}*`,
    '',
    `👤 *Cliente:* ${name}`,
    `🕔 *Horário da loja:* terça a sábado, das 17:00 às 22:00`,
    '',
    '🛍️ *Itens do pedido:*'
  ];

  let total = 0;

  cart.forEach((item, index) => {
    const p = data.products.find(x => x.id === item.productId);
    if (!p) return;
    total += p.priceCents * item.qty;
    lines.push(`${index + 1}. *${item.qty}x ${p.name}* — *${brl(p.priceCents * item.qty)}*`);

    choiceNames(item.choices).forEach(({ groupName, names }) => {
      lines.push(`   • _${groupName}:_ ${names.join(', ')}`);
    });

    lines.push('');
  });

  lines.push('────────────────');
  lines.push(`💰 *Total dos produtos:* *${brl(total)}*`);
  lines.push('📍 *Atendimento:* combinar disponibilidade e retirada pelo WhatsApp');

  if (notes.trim()) {
    lines.push(`📝 *Observações:* ${notes.trim()}`);
  }

  lines.push('');
  lines.push('Olá! Pode confirmar a disponibilidade do pedido, por favor?');

  return lines.join('\n');
}

$('#cart-button').onclick = openCart;
$('#close-cart').onclick = closeCart;
backdrop.onclick = closeCart;

$('#checkout-button').onclick = () => {
  data = loadData();
  if (!validateCart()) return;
  closeCart();
  checkoutDialog.showModal();
};

$('#close-checkout').onclick = () => checkoutDialog.close();

$('#checkout-form').addEventListener('submit', event => {
  event.preventDefault();
  data = loadData();
  if (!validateCart()) return;

  const name = $('#customer-name').value.trim();
  if (!name) return;

  const msg = buildWhatsAppMessage(name, $('#customer-notes').value);
  window.open(`https://wa.me/${data.store.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  checkoutDialog.close();
});

function refresh() {
  data = loadData();
  applyStore();
  renderProducts();
  renderCart();
}

window.addEventListener('storage', e => {
  if (e.key?.includes('acai-da-bea-demo-store')) refresh();
});
window.addEventListener('acai-demo-data-changed', refresh);

refresh();
