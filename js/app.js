import { restaurant, products, customization } from './data.js';
import {
  addCartItem,
  cartTotals,
  clearCart,
  getCart,
  removeCartItem,
  setQuantity,
  revalidateCart,
} from './cart.js';

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const state = {
  activeProduct: null,
};

const els = {
  menuGrid: document.querySelector('#menu-grid'),
  menuNav: document.querySelector('#menu-nav'),
  cartDrawer: document.querySelector('#cart-drawer'),
  cartBackdrop: document.querySelector('#cart-backdrop'),
  cartItems: document.querySelector('#cart-items'),
  cartTotal: document.querySelector('#cart-total'),
  cartCount: document.querySelector('#cart-count'),
  mobileCart: document.querySelector('#mobile-cart'),
  mobileCartText: document.querySelector('#mobile-cart-text'),
  customizer: document.querySelector('#customizer'),
  customizerTitle: document.querySelector('#customizer-title'),
  customizerPrice: document.querySelector('#customizer-price'),
  customizerForm: document.querySelector('#customizer-form'),
  complementsWrap: document.querySelector('#complements-options'),
  syrupsWrap: document.querySelector('#syrups-options'),
  fruitsWrap: document.querySelector('#fruits-options'),
  creamsWrap: document.querySelector('#creams-options'),
  creamsGroup: document.querySelector('#creams-group'),
  productNote: document.querySelector('#product-note'),
  addCustomized: document.querySelector('#add-customized'),
  checkout: document.querySelector('#checkout-form'),
  orderTypeWrap: document.querySelector('#order-type-options'),
  deliveryFields: document.querySelector('#delivery-fields'),
  paymentWrap: document.querySelector('#payment-options'),
  cashChangeWrap: document.querySelector('#cash-change-wrap'),
  checkoutNotice: document.querySelector('#checkout-notice'),
  checkoutSummary: document.querySelector('#checkout-summary'),
  sendWhatsApp: document.querySelector('#send-whatsapp'),
  generalWhatsapp: document.querySelector('#general-whatsapp'),
  instagramLinks: document.querySelectorAll('[data-instagram-link]'),
  ifoodSection: document.querySelector('#ifood-section'),
  ifoodLink: document.querySelector('#ifood-link'),
  mapsLink: document.querySelector('#maps-link'),
  addressText: document.querySelector('#address-text'),
  hoursText: document.querySelector('#hours-text'),
  year: document.querySelector('#year'),
  mobileMenuButton: document.querySelector('#mobile-menu-button'),
  mobileMenuPanel: document.querySelector('#mobile-menu-panel'),
};

function formatMoney(cents) {
  return money.format(cents / 100);
}

function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function buildMenu() {
  const categories = [...new Set(products.filter((p) => p.available).map((p) => p.category))];
  const fragment = document.createDocumentFragment();

  categories.forEach((category) => {
    const section = createElement('section', 'menu-category');
    section.id = slugify(category);

    const headingWrap = createElement('div', 'section-heading compact');
    const eyebrow = createElement('span', 'eyebrow', category === 'Açaí Tradicional' ? 'O clássico' : 'Mais recheado');
    const h3 = createElement('h3', '', category);
    headingWrap.append(eyebrow, h3);
    section.appendChild(headingWrap);

    const grid = createElement('div', 'product-grid');
    products.filter((p) => p.available && p.category === category).forEach((product) => {
      grid.appendChild(createProductCard(product));
    });
    section.appendChild(grid);
    fragment.appendChild(section);
  });

  els.menuGrid.replaceChildren(fragment);
}

function createProductCard(product) {
  const article = createElement('article', 'product-card');
  const imageWrap = createElement('div', 'product-media');
  const img = document.createElement('img');
  img.src = product.image;
  img.alt = product.name;
  img.width = 520;
  img.height = 520;
  img.loading = 'lazy';
  img.decoding = 'async';
  imageWrap.appendChild(img);

  const body = createElement('div', 'product-body');
  const heading = createElement('h4', '', product.name);
  const description = createElement('p', 'product-description', product.description);
  const footer = createElement('div', 'product-footer');
  const price = createElement('strong', 'product-price', formatMoney(product.priceCents));
  const button = createElement('button', 'button button-small button-primary', 'Adicionar');
  button.type = 'button';
  button.dataset.productId = product.id;
  button.setAttribute('aria-label', `Adicionar ${product.name} ao pedido`);
  button.addEventListener('click', () => openCustomizer(product.id));

  footer.append(price, button);
  body.append(heading, description, footer);
  article.append(imageWrap, body);
  return article;
}

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function openCustomizer(productId) {
  const product = products.find((p) => p.id === productId && p.available);
  if (!product) return;
  state.activeProduct = product;
  els.customizerForm.reset();
  els.customizerTitle.textContent = product.name;
  els.customizerPrice.textContent = formatMoney(product.priceCents);
  els.productNote.value = '';

  buildCheckOptions(els.complementsWrap, customization.complements, 'complement', product.limits.complements);
  buildCheckOptions(els.syrupsWrap, customization.syrups, 'syrup', product.limits.syrups);
  buildRadioOptions(els.fruitsWrap, customization.fruits, 'fruit');

  if (product.limits.truffleCreams > 0) {
    els.creamsGroup.hidden = false;
    buildCheckOptions(els.creamsWrap, customization.truffleCreams, 'cream', product.limits.truffleCreams);
  } else {
    els.creamsGroup.hidden = true;
    els.creamsWrap.replaceChildren();
  }

  updateCustomizerPrice();
  els.customizer.showModal();
}

function buildCheckOptions(container, options, groupName, limit) {
  container.replaceChildren();
  options.forEach((labelText, index) => {
    const label = createElement('label', 'choice-chip');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = groupName;
    input.value = labelText;
    input.id = `${groupName}-${index}`;
    input.addEventListener('change', () => enforceLimit(groupName, limit));
    const text = createElement('span', '', labelText);
    label.append(input, text);
    container.appendChild(label);
  });
}

function buildRadioOptions(container, options, groupName) {
  container.replaceChildren();
  options.forEach((option, index) => {
    const label = createElement('label', 'choice-chip');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = groupName;
    input.value = option.id;
    input.id = `${groupName}-${index}`;
    input.addEventListener('change', updateCustomizerPrice);
    const extra = option.extraCents > 0 ? ` (+${formatMoney(option.extraCents)})` : '';
    const text = createElement('span', '', `${option.label}${extra}`);
    label.append(input, text);
    container.appendChild(label);
  });
}

function enforceLimit(groupName, limit) {
  const checked = [...els.customizerForm.querySelectorAll(`input[name="${groupName}"]:checked`)];
  if (checked.length > limit) {
    const justChanged = checked[checked.length - 1];
    justChanged.checked = false;
    announce(`Você pode escolher até ${limit} opção${limit > 1 ? 'ões' : ''} neste grupo.`);
  }
  updateCustomizerPrice();
}

function updateCustomizerPrice() {
  if (!state.activeProduct) return;
  const fruitId = els.customizerForm.querySelector('input[name="fruit"]:checked')?.value;
  const fruit = customization.fruits.find((item) => item.id === fruitId);
  const extra = fruit?.extraCents || 0;
  els.customizerPrice.textContent = formatMoney(state.activeProduct.priceCents + extra);
}

function selectedValues(name) {
  return [...els.customizerForm.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);
}

function addActiveProduct() {
  const product = state.activeProduct;
  if (!product) return;

  const complements = selectedValues('complement');
  const syrups = selectedValues('syrup');
  const creams = selectedValues('cream');
  const fruitId = els.customizerForm.querySelector('input[name="fruit"]:checked')?.value || '';
  const fruit = customization.fruits.find((item) => item.id === fruitId) || null;
  const note = els.productNote.value.trim().slice(0, 180);
  const extraCents = fruit?.extraCents || 0;

  addCartItem({
    productId: product.id,
    quantity: 1,
    selections: {
      complements,
      syrups,
      fruitId,
      creams,
    },
    note,
  });

  els.customizer.close();
  renderCart();
  announce(`${product.name} adicionado ao pedido.`);
}

function renderCart() {
  const cart = getCart();
  els.cartItems.replaceChildren();

  if (cart.length === 0) {
    const empty = createElement('div', 'empty-cart');
    empty.append(
      createElement('strong', '', 'Seu pedido está vazio.'),
      createElement('p', '', 'Escolha um tamanho de açaí e personalize do seu jeito.')
    );
    els.cartItems.appendChild(empty);
  } else {
    cart.forEach((item) => els.cartItems.appendChild(createCartItem(item)));
  }

  const totals = cartTotals();
  els.cartTotal.textContent = formatMoney(totals.totalCents);
  els.cartCount.textContent = String(totals.items);
  els.cartCount.hidden = totals.items === 0;
  els.mobileCart.hidden = totals.items === 0;
  els.mobileCartText.textContent = `Ver pedido • ${totals.items} ${totals.items === 1 ? 'item' : 'itens'} • ${formatMoney(totals.totalCents)}`;
  renderCheckoutSummary();
}

function createCartItem(item) {
  const article = createElement('article', 'cart-item');
  const top = createElement('div', 'cart-item-top');
  const title = createElement('strong', '', item.name);
  const subtotal = createElement('span', 'cart-item-subtotal', formatMoney(item.unitPriceCents * item.quantity));
  top.append(title, subtotal);

  const details = createElement('div', 'cart-item-details');
  appendDetail(details, 'Complementos', item.selections?.complements);
  appendDetail(details, 'Caldas', item.selections?.syrups);
  appendDetail(details, 'Fruta', item.selections?.fruit ? [item.selections.fruit] : []);
  appendDetail(details, 'Creme', item.selections?.creams);
  if (item.note) appendDetail(details, 'Obs.', [item.note]);

  const controls = createElement('div', 'cart-item-controls');
  const qty = createElement('div', 'quantity-control');
  const minus = createElement('button', 'icon-button', '−');
  minus.type = 'button';
  minus.setAttribute('aria-label', `Diminuir quantidade de ${item.name}`);
  minus.addEventListener('click', () => {
    setQuantity(item.key, item.quantity - 1);
    renderCart();
  });
  const number = createElement('span', 'quantity-number', String(item.quantity));
  number.setAttribute('aria-live', 'polite');
  const plus = createElement('button', 'icon-button', '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', `Aumentar quantidade de ${item.name}`);
  plus.addEventListener('click', () => {
    setQuantity(item.key, item.quantity + 1);
    renderCart();
  });
  qty.append(minus, number, plus);

  const remove = createElement('button', 'text-button danger', 'Remover');
  remove.type = 'button';
  remove.addEventListener('click', () => {
    removeCartItem(item.key);
    renderCart();
  });

  controls.append(qty, remove);
  article.append(top, details, controls);
  return article;
}

function appendDetail(container, label, values) {
  if (!values || values.length === 0) return;
  const row = createElement('p', 'cart-detail');
  const strong = createElement('strong', '', `${label}: `);
  const text = document.createTextNode(values.join(', '));
  row.append(strong, text);
  container.appendChild(row);
}

function openCart() {
  els.cartDrawer.classList.add('is-open');
  els.cartDrawer.setAttribute('aria-hidden', 'false');
  els.cartBackdrop.hidden = false;
  document.body.classList.add('no-scroll');
  requestAnimationFrame(() => els.cartDrawer.querySelector('[data-close-cart]')?.focus());
}

function closeCart() {
  els.cartDrawer.classList.remove('is-open');
  els.cartDrawer.setAttribute('aria-hidden', 'true');
  els.cartBackdrop.hidden = true;
  document.body.classList.remove('no-scroll');
}

function buildBusinessInfo() {
  document.querySelectorAll('[data-whatsapp-display]').forEach((el) => { el.textContent = restaurant.whatsappDisplay; });
  document.querySelectorAll('[data-phone-display]').forEach((el) => { el.textContent = restaurant.phoneDisplay; });
  document.querySelectorAll('[data-instagram-handle]').forEach((el) => { el.textContent = restaurant.instagramHandle; });
  document.querySelectorAll('[data-phone-link]').forEach((el) => { el.href = restaurant.phoneHref; });

  els.instagramLinks.forEach((el) => {
    el.href = restaurant.instagramUrl;
    el.hidden = !restaurant.instagramUrl;
  });

  const hello = 'Olá! Gostaria de tirar uma dúvida.';
  els.generalWhatsapp.href = `https://wa.me/${restaurant.whatsappDigits}?text=${encodeURIComponent(hello)}`;

  if (restaurant.ifoodAvailable) {
    els.ifoodSection.hidden = false;
    if (restaurant.ifoodUrl) {
      els.ifoodLink.href = restaurant.ifoodUrl;
      els.ifoodLink.hidden = false;
    } else {
      els.ifoodLink.hidden = true;
    }
  }

  if (restaurant.address) {
    const full = [restaurant.address, restaurant.neighborhood, restaurant.city].filter(Boolean).join(' · ');
    els.addressText.textContent = full;
    document.querySelectorAll('[data-address-display]').forEach((el) => { el.textContent = full; });
  } else {
    els.addressText.textContent = 'Endereço oficial ainda não configurado.';
    document.querySelectorAll('[data-address-display]').forEach((el) => { el.textContent = '[ADICIONAR ENDEREÇO]'; });
  }

  if (restaurant.mapsUrl) {
    els.mapsLink.href = restaurant.mapsUrl;
    els.mapsLink.hidden = false;
  } else {
    els.mapsLink.hidden = true;
  }

  if (restaurant.openingHours.length > 0) {
    const hours = restaurant.openingHours.join(' · ');
    els.hoursText.textContent = hours;
    document.querySelectorAll('[data-hours-display]').forEach((el) => { el.textContent = hours; });
  } else {
    els.hoursText.textContent = 'Horário de funcionamento a confirmar.';
    document.querySelectorAll('[data-hours-display]').forEach((el) => { el.textContent = '[ADICIONAR HORÁRIO]'; });
  }
}

function buildCheckoutOptions() {
  els.orderTypeWrap.replaceChildren();
  if (restaurant.orderTypes.delivery) {
    els.orderTypeWrap.appendChild(makeRadio('orderType', 'delivery', 'Entrega'));
  }
  if (restaurant.orderTypes.pickup) {
    els.orderTypeWrap.appendChild(makeRadio('orderType', 'pickup', 'Retirada no local'));
  }

  els.paymentWrap.replaceChildren();
  const enabledPayments = restaurant.paymentMethods.filter((method) => method.enabled);
  if (enabledPayments.length === 0) {
    const note = createElement('p', 'field-note', 'Forma de pagamento: a combinar pelo WhatsApp.');
    els.paymentWrap.appendChild(note);
  } else {
    enabledPayments.forEach((method) => {
      els.paymentWrap.appendChild(makeRadio('payment', method.id, method.label));
    });
  }
}

function makeRadio(name, value, labelText) {
  const label = createElement('label', 'choice-card');
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = name;
  input.value = value;
  input.required = true;
  const text = createElement('span', '', labelText);
  label.append(input, text);
  return label;
}

function toggleCheckoutFields() {
  const orderType = els.checkout.querySelector('input[name="orderType"]:checked')?.value;
  const delivery = orderType === 'delivery';
  els.deliveryFields.hidden = !delivery;
  els.deliveryFields.querySelectorAll('[data-delivery-required]').forEach((input) => {
    input.required = delivery;
  });

  const payment = els.checkout.querySelector('input[name="payment"]:checked')?.value;
  els.cashChangeWrap.hidden = payment !== 'cash';
}

function renderCheckoutSummary() {
  const totals = cartTotals();
  if (totals.items === 0) {
    els.checkoutSummary.textContent = 'Adicione itens ao carrinho para finalizar.';
    return;
  }
  els.checkoutSummary.textContent = `${totals.items} ${totals.items === 1 ? 'item' : 'itens'} · Total dos produtos: ${formatMoney(totals.totalCents)}`;
}

function validateCheckout() {
  els.checkoutNotice.textContent = '';
  revalidateCart();
  renderCart();
  const cart = getCart();
  if (cart.length === 0) {
    return fail('Adicione pelo menos um produto antes de finalizar.');
  }

  if (!els.checkout.reportValidity()) {
    return fail('Confira os campos obrigatórios antes de continuar.');
  }

  const orderType = els.checkout.querySelector('input[name="orderType"]:checked')?.value;
  if (!orderType) return fail('Escolha entrega ou retirada no local.');

  const enabledPayments = restaurant.paymentMethods.filter((method) => method.enabled);
  if (enabledPayments.length > 0 && !els.checkout.querySelector('input[name="payment"]:checked')) {
    return fail('Escolha a forma de pagamento.');
  }

  return true;
}

function fail(message) {
  els.checkoutNotice.textContent = message;
  els.checkoutNotice.focus();
  return false;
}

function generateWhatsAppMessage() {
  const form = new FormData(els.checkout);
  const cart = getCart();
  const totals = cartTotals();
  const name = cleanLine(form.get('customerName'));
  const orderType = form.get('orderType');
  const paymentId = form.get('payment');
  const paymentLabel = restaurant.paymentMethods.find((m) => m.id === paymentId)?.label || 'A combinar pelo WhatsApp';
  const generalNote = cleanLine(form.get('generalNote')) || 'Nenhuma';

  const lines = [
    '🍇 *NOVO PEDIDO — AÇAÍ DA BEA*',
    '',
    `👤 *Cliente:* ${name}`,
    '',
    '🛒 *PEDIDO*',
    '',
  ];

  cart.forEach((item) => {
    lines.push(`${item.quantity}x ${item.name}`);
    lines.push(`${formatMoney(item.unitPriceCents)} cada`);
    lines.push(`Subtotal: ${formatMoney(item.unitPriceCents * item.quantity)}`);

    if (item.selections?.complements?.length) lines.push(`Complementos: ${item.selections.complements.join(', ')}`);
    if (item.selections?.syrups?.length) lines.push(`Caldas: ${item.selections.syrups.join(', ')}`);
    if (item.selections?.fruit) lines.push(`Fruta: ${item.selections.fruit}`);
    if (item.selections?.creams?.length) lines.push(`Creme trufado: ${item.selections.creams.join(', ')}`);
    if (item.note) lines.push(`Observação: ${cleanLine(item.note)}`);
    lines.push('');
  });

  lines.push('────────────');
  lines.push(`💰 *TOTAL DOS PRODUTOS: ${formatMoney(totals.totalCents)}*`);
  if (orderType === 'delivery') {
    lines.push('🚚 *Entrega*');
    lines.push('Taxa de entrega: a confirmar');
    lines.push('');
    lines.push('📍 *Endereço:*');
    lines.push(`${cleanLine(form.get('street'))}, ${cleanLine(form.get('number'))}`);
    lines.push(`Bairro: ${cleanLine(form.get('neighborhood'))}`);
    if (cleanLine(form.get('complement'))) lines.push(`Complemento: ${cleanLine(form.get('complement'))}`);
    if (cleanLine(form.get('reference'))) lines.push(`Referência: ${cleanLine(form.get('reference'))}`);
  } else {
    lines.push('🏪 *Retirada no local*');
  }

  lines.push('');
  lines.push(`💳 *Pagamento:* ${paymentLabel}`);
  if (paymentId === 'cash' && cleanLine(form.get('changeFor'))) {
    lines.push(`Troco para: ${cleanLine(form.get('changeFor'))}`);
  }
  lines.push('');
  lines.push(`📝 *Observações gerais:* ${generalNote}`);

  return lines.join('\n');
}

function cleanLine(value) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 240);
}

function sendOrder() {
  if (!validateCheckout()) return;
  const message = generateWhatsAppMessage();
  const url = `https://wa.me/${restaurant.whatsappDigits}?text=${encodeURIComponent(message)}`;
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) window.location.href = url;
}

function announce(message) {
  const live = document.querySelector('#live-region');
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = message; });
}

function bindEvents() {
  document.querySelectorAll('[data-open-cart]').forEach((button) => button.addEventListener('click', openCart));
  document.querySelectorAll('[data-close-cart]').forEach((button) => button.addEventListener('click', closeCart));
  els.cartBackdrop.addEventListener('click', closeCart);
  els.addCustomized.addEventListener('click', addActiveProduct);
  document.querySelectorAll('[data-close-customizer]').forEach((button) => button.addEventListener('click', () => els.customizer.close()));
  els.customizer.addEventListener('click', (event) => {
    if (event.target === els.customizer) els.customizer.close();
  });
  els.checkout.addEventListener('change', toggleCheckoutFields);
  els.sendWhatsApp.addEventListener('click', sendOrder);
  document.querySelector('#clear-cart').addEventListener('click', () => {
    clearCart();
    renderCart();
  });

  els.mobileMenuButton.addEventListener('click', () => {
    const open = els.mobileMenuButton.getAttribute('aria-expanded') === 'true';
    els.mobileMenuButton.setAttribute('aria-expanded', String(!open));
    els.mobileMenuPanel.hidden = open;
  });
  els.mobileMenuPanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    els.mobileMenuPanel.hidden = true;
    els.mobileMenuButton.setAttribute('aria-expanded', 'false');
  }));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && els.cartDrawer.classList.contains('is-open')) closeCart();
  });
}

function init() {
  buildMenu();
  buildBusinessInfo();
  buildCheckoutOptions();
  renderCart();
  toggleCheckoutFields();
  bindEvents();
  els.year.textContent = String(new Date().getFullYear());
}

init();
