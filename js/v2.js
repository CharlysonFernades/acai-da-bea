// Camada de UX v2: melhorias visuais/comportamentais sem alterar o fluxo principal do app.
const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

const PRODUCT_IMAGES = {
  'Açaí Tradicional 300 ml': 'assets/images/tradicional-300.webp',
  'Açaí Tradicional 400 ml': 'assets/images/tradicional-400.webp',
  'Açaí Tradicional 500 ml': 'assets/images/tradicional-500.webp',
  'Açaí Premium Trufado 300 ml': 'assets/images/trufado-nutella-300.webp',
  'Açaí Premium Trufado 400 ml': 'assets/images/trufado-nutella-400.webp',
  'Açaí Premium Trufado 500 ml': 'assets/images/trufado-nutella-500.webp',
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createShowcasePanel({ title, description, image, alt, prices, gold = false }) {
  const article = el('article', `showcase-panel${gold ? ' gold' : ''}`);
  const img = document.createElement('img');
  img.src = image;
  img.alt = alt;
  img.width = 640;
  img.height = 640;
  img.decoding = 'async';

  const copy = el('div', 'showcase-copy');
  copy.append(el('strong', '', title), el('p', '', description));
  const chips = el('div', 'showcase-chips');
  prices.forEach((price) => chips.append(el('span', '', price)));
  copy.append(chips);
  article.append(img, copy);
  return article;
}

function createChoiceCard(title, choices, accent = false) {
  const article = el('article', `showcase-choice${accent ? ' accent' : ''}`);
  article.append(el('h4', '', title));
  const pills = el('div', 'choice-pills');
  choices.forEach((choice) => pills.append(el('span', '', choice)));
  article.append(pills);
  return article;
}

function upgradeHero() {
  const heroCard = qs('.hero-card');
  if (!heroCard || heroCard.dataset.showcaseReady === 'true') return;

  heroCard.dataset.showcaseReady = 'true';
  heroCard.classList.add('hero-showcase');
  heroCard.replaceChildren();

  const top = el('div', 'hero-showcase-top');
  const intro = el('div');
  intro.append(
    el('span', 'showcase-kicker', 'Cardápio demonstrativo'),
    el('h3', '', 'Monte seu açaí do seu jeito')
  );
  top.append(intro, el('div', 'hero-sticker', 'A partir de R$ 16,90'));

  const products = el('div', 'hero-showcase-grid');
  products.append(
    createShowcasePanel({
      title: 'Açaí Tradicional',
      description: 'O clássico da casa com até 4 complementos, até 2 caldas e 1 fruta.',
      image: 'assets/images/hero-acai.webp',
      alt: 'Açaí tradicional generoso do Açaí da Bea com morango',
      prices: ['300 ml • R$ 16,90', '400 ml • R$ 20,90', '500 ml • R$ 24,90'],
    }),
    createShowcasePanel({
      title: 'Açaí Premium Trufado',
      description: 'Mais recheado, com 1 creme trufado incluso e personalização do seu jeito.',
      image: 'assets/images/trufado-nutella-300.webp',
      alt: 'Açaí premium trufado do Açaí da Bea',
      prices: ['300 ml • R$ 21,90', '400 ml • R$ 25,90', '500 ml • R$ 29,90'],
      gold: true,
    })
  );

  const board = el('div', 'hero-choice-board');
  board.setAttribute('aria-label', 'Opções disponíveis para personalizar o açaí');
  board.append(
    createChoiceCard('Complementos · escolha até 4', ['Leite em pó', 'Granola', 'Farelo de amendoim', 'Paçoca', 'Jujuba', 'Ovomaltine em pó']),
    createChoiceCard('Caldas · escolha até 2', ['Leite condensado', 'Mel', 'Chocolate', 'Morango']),
    createChoiceCard('Frutas · escolha 1', ['Banana', 'Manga', 'Morango + R$ 2,00']),
    createChoiceCard('Cremes trufados · escolha 1', ['Nutella', 'Ovomaltine'], true)
  );

  heroCard.append(top, products, board);
}

function upgradeAboutImage() {
  const aboutImage = qs('#sobre .about-photo img');
  if (!aboutImage) return;
  aboutImage.src = 'assets/images/hero-acai.webp';
  aboutImage.width = 1280;
  aboutImage.height = 960;
  aboutImage.alt = 'Açaí generoso do Açaí da Bea';
}

function upgradeProductCards() {
  qsa('.product-card').forEach((card) => {
    const title = qs('h4', card)?.textContent?.trim() || '';
    card.dataset.productKind = title.includes('Tradicional') ? 'traditional' : 'truffled';

    const img = qs('.product-media img', card);
    if (img && PRODUCT_IMAGES[title]) {
      img.src = PRODUCT_IMAGES[title];
      img.alt = title;
      img.width = 360;
      img.height = 360;
      img.decoding = 'async';
      if (img.dataset.fallbackBound !== 'true') {
        img.dataset.fallbackBound = 'true';
        img.addEventListener('error', () => {
          img.src = 'assets/images/logo.jpg';
          img.alt = `${title} - imagem de apoio`;
        }, { once: true });
      }
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
    const button = el('button', 'button button-primary button-wide', 'Ver cardápio');
    button.type = 'button';
    button.dataset.backToMenu = 'true';
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
  upgradeAboutImage();
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
