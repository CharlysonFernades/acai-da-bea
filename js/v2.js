// Camada visual/UX: fotos individuais, hero demonstrativo e carrinho limpo quando vazio.
const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

const PRODUCT_IMAGES = [
  ['Tradicional 300', 'assets/images/hero-acai.jpg'],
  ['Tradicional 400', 'assets/images/tradicional-400.jpg'],
  ['Tradicional 500', 'assets/images/hero-acai.jpg'],
  ['Trufado 300', 'assets/images/trufado-nutella-300.jpg'],
  ['Trufado 400', 'assets/images/trufado-nutella-400.jpg'],
  ['Trufado 500', 'assets/images/trufado-nutella-500.jpg'],
];

function imageForTitle(title) {
  return PRODUCT_IMAGES.find(([needle]) => title.includes(needle))?.[1] || 'assets/images/hero-acai.jpg';
}

function upgradeHero() {
  const card = qs('.hero-card');
  if (!card || card.dataset.showcaseReady === 'true') return;
  card.classList.add('hero-showcase');
  card.dataset.showcaseReady = 'true';
  card.replaceChildren();

  const top = document.createElement('div');
  top.className = 'hero-showcase-top';
  const heading = document.createElement('div');
  const kicker = document.createElement('span');
  kicker.className = 'showcase-kicker';
  kicker.textContent = 'Cardápio demonstrativo';
  const title = document.createElement('h3');
  title.textContent = 'Monte seu açaí do seu jeito';
  heading.append(kicker, title);
  const sticker = document.createElement('div');
  sticker.className = 'hero-sticker';
  sticker.textContent = 'A partir de R$ 16,90';
  top.append(heading, sticker);

  const productGrid = document.createElement('div');
  productGrid.className = 'hero-showcase-grid';
  productGrid.append(
    showcaseProduct('assets/images/hero-acai.jpg', 'Açaí tradicional generoso do Açaí da Bea', 'Açaí Tradicional', 'O clássico da casa com até 4 complementos, até 2 caldas e 1 fruta.', ['300 ml • R$ 16,90', '400 ml • R$ 20,90', '500 ml • R$ 24,90']),
    showcaseProduct('assets/images/trufado-nutella-300.jpg', 'Açaí premium trufado do Açaí da Bea', 'Açaí Premium Trufado', 'Mais cremoso, mais recheado e com 1 creme trufado incluso.', ['300 ml • R$ 21,90', '400 ml • R$ 25,90', '500 ml • R$ 29,90'], true)
  );

  const board = document.createElement('div');
  board.className = 'hero-choice-board';
  board.append(
    choiceGroup('Complementos', ['Leite em pó', 'Granola', 'Farelo de amendoim', 'Paçoca', 'Jujuba', 'Ovomaltine em pó']),
    choiceGroup('Caldas', ['Leite condensado', 'Mel', 'Chocolate', 'Morango']),
    choiceGroup('Frutas', ['Banana', 'Manga', 'Morango + R$ 2,00']),
    choiceGroup('Cremes trufados', ['Nutella', 'Ovomaltine'], true)
  );

  card.append(top, productGrid, board);
}

function showcaseProduct(src, alt, name, description, prices, gold = false) {
  const article = document.createElement('article');
  article.className = `showcase-panel${gold ? ' gold' : ''}`;
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.width = 480;
  img.height = 480;
  const copy = document.createElement('div');
  copy.className = 'showcase-copy';
  const strong = document.createElement('strong');
  strong.textContent = name;
  const p = document.createElement('p');
  p.textContent = description;
  const chips = document.createElement('div');
  chips.className = 'showcase-chips';
  prices.forEach((value) => {
    const span = document.createElement('span');
    span.textContent = value;
    chips.append(span);
  });
  copy.append(strong, p, chips);
  article.append(img, copy);
  return article;
}

function choiceGroup(titleText, values, accent = false) {
  const article = document.createElement('article');
  article.className = `choice-card${accent ? ' accent' : ''}`;
  const h4 = document.createElement('h4');
  h4.textContent = titleText;
  const pills = document.createElement('div');
  pills.className = 'choice-pills';
  values.forEach((value) => {
    const span = document.createElement('span');
    span.textContent = value;
    pills.append(span);
  });
  article.append(h4, pills);
  return article;
}

function upgradeProductCards() {
  qsa('.product-card').forEach((card) => {
    const title = qs('h4', card)?.textContent || '';
    card.dataset.productKind = title.includes('Tradicional') ? 'traditional' : 'truffled';
    const img = qs('.product-media img', card);
    if (img) {
      const next = imageForTitle(title);
      if (!img.src.endsWith(next)) img.src = next;
      img.alt = title;
      img.width = 480;
      img.height = 480;
      img.addEventListener('error', () => { img.src = 'assets/images/logo.jpg'; }, { once: true });
    }
    const add = qs('.product-footer .button', card);
    if (add && !add.textContent.trim().startsWith('+')) add.textContent = `+ ${add.textContent.trim()}`;
  });
}

function upgradeAboutImage() {
  const img = qs('.about-photo img');
  if (!img) return;
  img.src = 'assets/images/hero-acai.jpg';
  img.width = 960;
  img.height = 720;
  img.alt = 'Açaí generoso do Açaí da Bea';
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
  upgradeHero();
  upgradeProductCards();
  upgradeAboutImage();
  syncCartUI();
  bindCheckout();
  installObservers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initV2, { once: true });
} else {
  initV2();
}
