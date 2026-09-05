// Camada de UX v2: mantém o app original simples e adiciona melhorias visuais/comportamentais.
const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function upgradeProductCards() {
  qsa('.product-card').forEach((card) => {
    if (card.dataset.v2Ready === 'true') return;
    const title = qs('h4', card)?.textContent || '';
    card.dataset.productKind = title.includes('Tradicional') ? 'traditional' : 'truffled';
    const img = qs('.product-media img', card);
    if (img) {
      img.src = 'assets/images/hero-acai.jpg';
      img.width = 360;
      img.height = 360;
      img.addEventListener('error', () => {
        img.src = 'assets/images/logo.jpg';
      }, { once: true });
    }
    const add = qs('.product-footer .button', card);
    if (add && !add.textContent.trim().startsWith('+')) add.textContent = `+ ${add.textContent.trim()}`;
    card.dataset.v2Ready = 'true';
  });
}

function cartHasItems() {
  return Boolean(qs('#cart-items .cart-item'));
}

function syncCartUI() {
  const actions = qs('#cart-actions');
  if (actions) actions.hidden = !cartHasItems();

  const empty = qs('#cart-items .empty-cart');
  if (empty && !qs('[data-back-to-menu]', empty)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-primary button-wide';
    button.dataset.backToMenu = 'true';
    button.textContent = 'Ver cardápio';
    button.addEventListener('click', () => {
      qs('[data-close-cart]')?.click();
      qs('#cardapio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    empty.appendChild(button);
  }
}

function openCheckout() {
  if (!cartHasItems()) return;
  qs('[data-close-cart]')?.click();
  const dialog = qs('#checkout-dialog');
  if (dialog && !dialog.open) {
    dialog.showModal();
    requestAnimationFrame(() => qs('#customer-name')?.focus());
  }
}

function closeCheckout() {
  const dialog = qs('#checkout-dialog');
  if (dialog?.open) dialog.close();
}

function bindCheckout() {
  qs('#open-checkout')?.addEventListener('click', openCheckout);
  qsa('[data-close-checkout]').forEach((button) => button.addEventListener('click', closeCheckout));
  qsa('[data-edit-cart]').forEach((button) => button.addEventListener('click', () => {
    closeCheckout();
    qs('[data-open-cart]')?.click();
  }));

  const dialog = qs('#checkout-dialog');
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) closeCheckout();
  });
}

function installObservers() {
  const menu = qs('#menu-grid');
  if (menu) new MutationObserver(upgradeProductCards).observe(menu, { childList: true, subtree: true });

  const cart = qs('#cart-items');
  if (cart) new MutationObserver(syncCartUI).observe(cart, { childList: true, subtree: true });
}

function initV2() {
  upgradeProductCards();
  syncCartUI();
  bindCheckout();
  installObservers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initV2, { once: true });
} else {
  initV2();
}
