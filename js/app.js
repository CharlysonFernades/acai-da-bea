const STORE = {
  name: 'Açaí da Bea',
  subtitle: 'Loja A',
  whatsappDisplay: '+55 85 92145-5990',
  whatsappDigits: '5585921455990',
  instagramHandle: '@acaibea',
  instagramUrl: 'https://www.instagram.com/acaibea?stkn=MWIoYjJmM2NtNmN1bw==',
  mapsUrl: 'https://maps.app.goo.gl/E6QV2MibhUaMiP2w5',
  hoursLabel: 'terça a domingo, das 17:00 às 22:00'
};

const OPTION_GROUPS = {
  acaiCremes: {
    label: 'Açaí e cremes',
    options: ['Açaí tradicional', 'Creme de ninho', 'Creme de morango', 'Creme de avelã', 'Creme de Ovomaltine']
  },
  adicionais: {
    label: 'Adicionais',
    options: ['Leite em pó', 'Granola', 'Paçoca', 'Jujuba', 'Gotas de chocolate', 'Morango', 'Banana']
  },
  coberturas: {
    label: 'Coberturas',
    options: ['Leite condensado', 'Cobertura de chocolate', 'Cobertura de morango']
  }
};

const PRODUCTS = [
  {
    id: 'acai-330',
    name: 'Açaí de 330g',
    category: 'Mais pedido',
    priceCents: 1484,
    image: 'assets/images/acai-330.webp',
    description: 'Escolha até 4 opções entre açaí e cremes, 4 adicionais e 2 coberturas. Toda a descrição entra como parte do peso escolhido.',
    selectionRules: { acaiCremes: 4, adicionais: 4, coberturas: 2 }
  },
  {
    id: 'acai-750',
    name: 'Açaí de 750g',
    category: 'Tamanho família',
    priceCents: 3374,
    image: 'assets/images/acai-750.webp',
    description: 'Escolha até 6 opções entre açaí e cremes, 6 adicionais e 2 coberturas. Toda a descrição entra como parte do peso escolhido.',
    selectionRules: { acaiCremes: 6, adicionais: 6, coberturas: 2 }
  },
  {
    id: 'acai-1kg',
    name: 'Açaí de 1 kg',
    category: 'Compartilhar',
    priceCents: 4499,
    image: 'assets/images/acai-1kg.webp',
    description: 'Escolha até 8 opções entre açaí e cremes, 8 adicionais e 2 coberturas. Toda a descrição entra como parte do peso escolhido.',
    selectionRules: { acaiCremes: 8, adicionais: 8, coberturas: 2 }
  },
  {
    id: 'salada-gourmet',
    name: 'Salada de fruta gourmet',
    category: 'Especial',
    priceCents: 1400,
    oldPriceCents: 1550,
    image: 'assets/images/salada-gourmet.webp',
    description: '400 ml • creme de morango e creme de avelã.',
    selectionRules: null
  }
];

const state = {
  cart: loadCart(),
  currentProduct: null
};

const els = {
  productGrid: document.getElementById('product-grid'),
  productDialog: document.getElementById('product-dialog'),
  productForm: document.getElementById('product-form'),
  productDialogContent: document.getElementById('product-dialog-content'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartItems: document.getElementById('cart-items'),
  cartTotal: document.getElementById('cart-total'),
  cartCount: document.getElementById('cart-count'),
  cartFooter: document.getElementById('cart-footer'),
  backdrop: document.getElementById('backdrop'),
  cartButton: document.getElementById('cart-button'),
  closeCart: document.getElementById('close-cart'),
  checkoutButton: document.getElementById('checkout-button'),
  checkoutDialog: document.getElementById('checkout-dialog'),
  checkoutForm: document.getElementById('checkout-form'),
  closeCheckout: document.getElementById('close-checkout'),
  toast: document.getElementById('toast'),
  heroWhatsapp: document.getElementById('hero-whatsapp'),
  contactWhatsapp: document.getElementById('contact-whatsapp'),
  contactInstagram: document.getElementById('contact-instagram'),
  contactMaps: document.getElementById('contact-maps'),
  floatingCartWrap: document.getElementById('floating-cart-wrap'),
  floatingCart: document.getElementById('floating-cart'),
  floatingCartText: document.getElementById('floating-cart-text'),
  deliveryFields: document.getElementById('delivery-fields')
};

function formatCurrency(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100);
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('acai-da-bea-cart')) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('acai-da-bea-cart', JSON.stringify(state.cart));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function createCard(product) {
  const oldPrice = product.oldPriceCents ? `<span class="old-price">${formatCurrency(product.oldPriceCents)}</span>` : '';
  return `
    <article class="product-card">
      <div class="product-photo">
        <img src="${product.image}" alt="${product.name} do ${STORE.name}" loading="lazy" width="921" height="695">
      </div>
      <div class="product-body">
        <span class="product-tag">${product.category}</span>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        <div class="product-meta">
          <div class="product-price">
            ${oldPrice}
            <strong>${formatCurrency(product.priceCents)}</strong>
          </div>
          <button class="button primary" type="button" data-product-open="${product.id}">Escolher</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  els.productGrid.innerHTML = PRODUCTS.map(createCard).join('');
  els.productGrid.querySelectorAll('[data-product-open]').forEach(button => {
    button.addEventListener('click', () => openProduct(button.dataset.productOpen));
  });
}

function makeOptionGroup(key, max) {
  const group = OPTION_GROUPS[key];
  return `
    <fieldset class="option-group" data-group="${key}" data-max="${max}">
      <legend>${group.label}</legend>
      <div class="option-help">Escolha até ${max} ${max === 1 ? 'opção' : 'opções'}.</div>
      <div class="choice-grid">
        ${group.options.map(option => `
          <label class="option-pill">
            <input type="checkbox" name="${key}" value="${option}">
            <span>${option}</span>
          </label>
        `).join('')}
      </div>
    </fieldset>
  `;
}

function openProduct(productId) {
  const product = PRODUCTS.find(item => item.id === productId);
  if (!product) return;
  state.currentProduct = product;

  const optionBlocks = product.selectionRules
    ? Object.entries(product.selectionRules).map(([key, max]) => makeOptionGroup(key, max)).join('')
    : '<div class="option-group"><div class="option-help">Este item não possui personalização cadastrada nesta demonstração.</div></div>';

  els.productDialogContent.innerHTML = `
    <div class="dialog-grid">
      <div class="dialog-image">
        <img src="${product.image}" alt="${product.name} do ${STORE.name}" width="921" height="695">
      </div>
      <div class="dialog-copy">
        <span class="product-tag">${product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="dialog-price">${formatCurrency(product.priceCents)}</div>
      </div>
    </div>
    <div class="dialog-actions">
      ${optionBlocks}
      <label class="text-label">
        Observação do item
        <textarea name="itemNote" rows="3" maxlength="200" placeholder="Ex.: sem granola, colocar mais leite em pó..."></textarea>
      </label>
      <button class="button primary full" type="submit">Adicionar ao pedido</button>
    </div>
  `;

  attachOptionLimits();
  els.productDialog.showModal();
}

function attachOptionLimits() {
  els.productDialogContent.querySelectorAll('[data-group]').forEach(groupEl => {
    const max = Number(groupEl.dataset.max);
    const checkboxes = [...groupEl.querySelectorAll('input[type="checkbox"]')];
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const checked = checkboxes.filter(item => item.checked);
        if (checked.length > max) {
          checkbox.checked = false;
          showToast(`Você pode escolher até ${max} ${max === 1 ? 'opção' : 'opções'} nesse grupo.`);
        }
      });
    });
  });
}

function summarizeSelections(selections) {
  return Object.entries(selections)
    .filter(([, values]) => Array.isArray(values) && values.length)
    .map(([key, values]) => `${OPTION_GROUPS[key].label}: ${values.join(', ')}`);
}

function handleProductSubmit(event) {
  event.preventDefault();
  if (!state.currentProduct) return;

  const formData = new FormData(els.productForm);
  const selections = {};

  if (state.currentProduct.selectionRules) {
    for (const key of Object.keys(state.currentProduct.selectionRules)) {
      selections[key] = formData.getAll(key);
    }
  }

  const itemNote = String(formData.get('itemNote') || '').trim();
  const fingerprint = JSON.stringify({ id: state.currentProduct.id, selections, itemNote });
  const existing = state.cart.find(item => item.fingerprint === fingerprint);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: state.currentProduct.id,
      fingerprint,
      name: state.currentProduct.name,
      image: state.currentProduct.image,
      priceCents: state.currentProduct.priceCents,
      quantity: 1,
      selections,
      itemNote
    });
  }

  saveCart();
  renderCart();
  els.productDialog.close();
  els.productForm.reset();
  showToast('Item adicionado ao pedido.');
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function renderCart() {
  const total = cartTotal();
  const count = cartCount();
  els.cartCount.textContent = String(count);
  els.cartTotal.textContent = formatCurrency(total);
  els.floatingCartText.textContent = `${count} ${count === 1 ? 'item' : 'itens'} • ${formatCurrency(total)}`;
  els.floatingCartWrap.classList.toggle('hidden', count === 0);

  if (!state.cart.length) {
    els.cartItems.innerHTML = `
      <div class="cart-empty">
        <strong>Seu pedido está vazio.</strong>
        <p>Escolha um produto do cardápio para começar.</p>
      </div>
    `;
    els.cartFooter.classList.add('hidden');
    return;
  }

  els.cartFooter.classList.remove('hidden');

  els.cartItems.innerHTML = state.cart.map((item, index) => {
    const lines = summarizeSelections(item.selections);
    if (item.itemNote) lines.push(`Observação: ${item.itemNote}`);
    const extraLines = lines.length ? `<ul>${lines.map(line => `<li>${line}</li>`).join('')}</ul>` : '';

    return `
      <article class="cart-item">
        <div class="cart-item-head">
          <div>
            <h3>${item.quantity}x ${item.name}</h3>
            <strong>${formatCurrency(item.priceCents * item.quantity)}</strong>
          </div>
          <button type="button" class="dialog-close" data-remove="${index}" aria-label="Remover item">×</button>
        </div>
        ${extraLines}
        <div class="qty-row">
          <small>Valor unitário: ${formatCurrency(item.priceCents)}</small>
          <div class="qty-controls">
            <button type="button" data-minus="${index}" aria-label="Diminuir quantidade">−</button>
            <strong>${item.quantity}</strong>
            <button type="button" data-plus="${index}" aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  els.cartItems.querySelectorAll('[data-remove]').forEach(button => {
    button.addEventListener('click', () => {
      state.cart.splice(Number(button.dataset.remove), 1);
      saveCart();
      renderCart();
      showToast('Item removido do pedido.');
    });
  });

  els.cartItems.querySelectorAll('[data-minus]').forEach(button => {
    button.addEventListener('click', () => {
      const item = state.cart[Number(button.dataset.minus)];
      item.quantity -= 1;
      if (item.quantity <= 0) {
        state.cart = state.cart.filter((_, idx) => idx !== Number(button.dataset.minus));
      }
      saveCart();
      renderCart();
    });
  });

  els.cartItems.querySelectorAll('[data-plus]').forEach(button => {
    button.addEventListener('click', () => {
      const item = state.cart[Number(button.dataset.plus)];
      item.quantity += 1;
      saveCart();
      renderCart();
    });
  });
}

function openCart() {
  els.cartDrawer.classList.add('open');
  els.cartDrawer.setAttribute('aria-hidden', 'false');
  els.backdrop.hidden = false;
}

function closeCart() {
  els.cartDrawer.classList.remove('open');
  els.cartDrawer.setAttribute('aria-hidden', 'true');
  els.backdrop.hidden = true;
}

function toggleDeliveryFields() {
  const type = new FormData(els.checkoutForm).get('service-type') || 'retirada';
  els.deliveryFields.hidden = type !== 'delivery';
}

function buildWhatsAppMessage(payload) {
  const lines = [
    `NOVO PEDIDO — ${STORE.name.toUpperCase()}`,
    '',
    `Cliente: ${payload.name}`,
    `Horário da loja: ${STORE.hoursLabel}`,
    '',
    '🛍️ Itens do pedido'
  ];

  payload.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.quantity}x ${item.name} — ${formatCurrency(item.priceCents * item.quantity)}`);
    const selections = summarizeSelections(item.selections);
    selections.forEach(line => lines.push(`   ${line}`));
    if (item.itemNote) lines.push(`   Observação do item: ${item.itemNote}`);
    lines.push('');
  });

  lines.push(`💰 Total dos produtos: ${formatCurrency(payload.total)}`);
  lines.push('');
  lines.push(`Atendimento: ${payload.serviceLabel}`);

  if (payload.serviceType === 'delivery') {
    lines.push(`Endereço: ${payload.address.street}, ${payload.address.number} - ${payload.address.neighborhood}`);
    if (payload.address.reference) lines.push(`Referência: ${payload.address.reference}`);
  }

  if (payload.notes) {
    lines.push(`Observações gerais: ${payload.notes}`);
  }

  lines.push('');
  lines.push('Olá! Pode confirmar a disponibilidade do pedido, por favor?');

  return lines.join('\n');
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  if (!state.cart.length) {
    showToast('Seu pedido está vazio.');
    return;
  }

  const formData = new FormData(els.checkoutForm);
  const name = String(formData.get('customer-name') || '').trim();
  const notes = String(formData.get('customer-notes') || '').trim();
  const serviceType = String(formData.get('service-type') || 'retirada');

  if (!name) {
    showToast('Digite seu nome para continuar.');
    return;
  }

  const payload = {
    name,
    notes,
    serviceType,
    serviceLabel: serviceType === 'delivery' ? 'Delivery' : 'Retirada na loja',
    items: state.cart,
    total: cartTotal(),
    address: {
      street: String(formData.get('delivery-street') || '').trim(),
      number: String(formData.get('delivery-number') || '').trim(),
      neighborhood: String(formData.get('delivery-neighborhood') || '').trim(),
      reference: String(formData.get('delivery-reference') || '').trim()
    }
  };

  if (serviceType === 'delivery') {
    if (!payload.address.street || !payload.address.number || !payload.address.neighborhood) {
      showToast('Preencha rua, número e bairro para o delivery.');
      return;
    }
  }

  const message = buildWhatsAppMessage(payload);
  const url = `https://wa.me/${STORE.whatsappDigits}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
  els.checkoutDialog.close();
}

function bindContactLinks() {
  const genericMessage = 'Olá! Gostaria de fazer um pedido no Açaí da Bea.';
  const waUrl = `https://wa.me/${STORE.whatsappDigits}?text=${encodeURIComponent(genericMessage)}`;
  els.heroWhatsapp.href = waUrl;
  els.contactWhatsapp.href = waUrl;
  els.contactInstagram.href = STORE.instagramUrl;
  els.contactMaps.href = STORE.mapsUrl;
}

function init() {
  renderProducts();
  renderCart();
  bindContactLinks();

  els.productForm.addEventListener('submit', handleProductSubmit);
  els.cartButton.addEventListener('click', openCart);
  els.floatingCart.addEventListener('click', openCart);
  els.closeCart.addEventListener('click', closeCart);
  els.backdrop.addEventListener('click', closeCart);
  els.checkoutButton.addEventListener('click', () => {
    closeCart();
    els.checkoutDialog.showModal();
  });
  els.closeCheckout.addEventListener('click', () => els.checkoutDialog.close());
  els.checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  els.checkoutForm.querySelectorAll('input[name="service-type"]').forEach(input => {
    input.addEventListener('change', toggleDeliveryFields);
  });
}

init();
