export const STORE_KEY = 'acai-da-bea-demo-store-v3';
export const CART_KEY = 'acai-da-bea-demo-cart-v3';

export const DEFAULT_DATA = {
  store: {
    id: 'acai-da-bea',
    name: 'Açaí da Bea',
    tagline: 'Ei, coloca + sabor no seu dia a dia Aê! 💜',
    whatsapp: '5585921455990',
    whatsappDisplay: '+55 85 92145-5990',
    instagram: '@acaibea',
    instagramUrl: 'https://www.instagram.com/acaibea?stkn=MWIoYjJmM2NtNmN1bw==',
    mapsUrl: 'https://maps.app.goo.gl/E6QV2MibhUaMiP2w5',
    deliveryEnabled: false,
    pickupEnabled: false,
    statusText: 'Pedidos, disponibilidade e retirada são combinados diretamente pelo WhatsApp.',
    openingHours: 'Terça a sábado, das 17:00 às 22:00'
  },
  groups: [
    { id: 'bases', name: 'Açaí e Cremes', note: 'Opções sujeitas à disponibilidade.' },
    { id: 'adicionais', name: 'Adicionais', note: 'Opções sujeitas à disponibilidade.' },
    { id: 'coberturas', name: 'Coberturas', note: 'Opções sujeitas à disponibilidade.' }
  ],
  ingredients: [
    { id: 'acai-tradicional', groupId: 'bases', name: 'Açaí tradicional', available: true, demo: true },
    { id: 'creme-ninho', groupId: 'bases', name: 'Creme de Ninho', available: true, demo: true },
    { id: 'creme-morango', groupId: 'bases', name: 'Creme de morango', available: true, demo: true },
    { id: 'creme-avela', groupId: 'bases', name: 'Creme de avelã', available: true, demo: true },
    { id: 'creme-cupuacu', groupId: 'bases', name: 'Creme de cupuaçu', available: false, demo: true },
    { id: 'creme-ovomaltine', groupId: 'bases', name: 'Creme de Ovomaltine', available: true, demo: true },

    { id: 'leite-po', groupId: 'adicionais', name: 'Leite em pó', available: true, demo: true },
    { id: 'granola', groupId: 'adicionais', name: 'Granola', available: true, demo: true },
    { id: 'pacoca', groupId: 'adicionais', name: 'Paçoca', available: true, demo: true },
    { id: 'amendoim', groupId: 'adicionais', name: 'Farofa de amendoim', available: true, demo: true },
    { id: 'confete', groupId: 'adicionais', name: 'Confete', available: true, demo: true },
    { id: 'banana', groupId: 'adicionais', name: 'Banana', available: true, demo: true },
    { id: 'morango', groupId: 'adicionais', name: 'Morango', available: false, demo: true },

    { id: 'leite-condensado', groupId: 'coberturas', name: 'Leite condensado', available: true, demo: true },
    { id: 'chocolate', groupId: 'coberturas', name: 'Chocolate', available: true, demo: true },
    { id: 'cobertura-morango', groupId: 'coberturas', name: 'Morango', available: true, demo: true },
    { id: 'mel', groupId: 'coberturas', name: 'Mel', available: true, demo: true }
  ],
  products: [
    {
      id: 'acai-330g',
      name: 'Açaí de 330g',
      priceCents: 1484,
      description: 'Escolha até 4 opções entre Açaí e Cremes, 4 adicionais e 2 coberturas.',
      note: 'Escolha seus complementos e monte do seu jeito.',
      image: 'assets/images/acai-330.webp',
      available: true,
      order: 1,
      rules: { bases: 4, adicionais: 4, coberturas: 2 }
    },
    {
      id: 'acai-750g',
      name: 'Açaí de 750g',
      priceCents: 3374,
      description: 'Escolha até 6 opções entre Açaí e Cremes, 6 adicionais e 2 coberturas.',
      note: 'Uma opção maior para quem quer mais sabor.',
      image: 'assets/images/acai-750.webp',
      available: true,
      order: 2,
      rules: { bases: 6, adicionais: 6, coberturas: 2 }
    },
    {
      id: 'acai-1kg',
      name: 'Açaí de 1 kg',
      priceCents: 4499,
      description: 'Escolha até 8 opções entre Açaí e Cremes, 8 adicionais e 2 coberturas.',
      note: 'Ideal para dividir ou matar a vontade de verdade.',
      image: 'assets/images/acai-1kg.webp',
      available: true,
      order: 3,
      rules: { bases: 8, adicionais: 8, coberturas: 2 }
    },
    {
      id: 'salada-gourmet-400',
      name: 'Salada de fruta gourmet',
      priceCents: 1400,
      oldPriceCents: 1550,
      description: '400 ml • creme de morango e creme de avelã.',
      note: 'Opção doce e refrescante do catálogo.',
      image: 'assets/images/salada-gourmet.webp',
      available: true,
      order: 4,
      rules: {}
    }
  ]
};

const clone = value => JSON.parse(JSON.stringify(value));

export function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return clone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    if (!parsed?.store || !Array.isArray(parsed?.products) || !Array.isArray(parsed?.ingredients)) {
      return clone(DEFAULT_DATA);
    }
    return parsed;
  } catch {
    return clone(DEFAULT_DATA);
  }
}

export function saveData(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('acai-demo-data-changed'));
}

export function resetData() {
  const fresh = clone(DEFAULT_DATA);
  saveData(fresh);
  return fresh;
}

export function brl(cents = 0) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents || 0) / 100);
}

export function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function slugId(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
