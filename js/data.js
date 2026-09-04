/*
  Dados centralizados do Açaí da Bea.
  Edite este arquivo para alterar contatos, links, produtos, preços e opções.
  Valores monetários são armazenados em CENTAVOS.
*/

export const restaurant = {
  name: 'Açaí da Bea',
  tagline: 'Viva a experiência do nosso açaí',
  description: 'Monte seu açaí do seu jeito e envie o pedido pronto pelo WhatsApp.',
  category: 'Sorveteria / Açaiteria',

  // Confirmado no cardápio original fornecido.
  whatsappDisplay: '(81) 97401-0159',
  whatsappDigits: '5581974010159',
  phoneDisplay: '(81) 97401-0159',
  phoneHref: 'tel:+5581974010159',
  instagramHandle: '@acaidabea_',
  instagramUrl: 'https://www.instagram.com/acaidabea_/',

  // Link oficial do iFood fornecido pelo usuário.
  // Mantido sem parâmetros de rastreamento (utm/fbclid).
  ifoodAvailable: true,
  ifoodUrl: 'https://www.ifood.com.br/delivery/recife-pe/acai-da-bea-jardim-sao-paulo/2e2ad808-9adb-4f1c-9eb5-f7189060ffd3',

  // Confirmado pelo print do Google Maps fornecido pelo usuário.
  address: 'R. Ipu, 2102',
  neighborhood: 'Tabapuazinho',
  city: 'Caucaia - CE, 61634-110',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=A%C3%A7a%C3%AD%20da%20Bea%2C%20R.%20Ipu%2C%202102%2C%20Tabapuazinho%2C%20Caucaia%20-%20CE%2C%2061634-110',
  openingHours: [], // [ADICIONAR HORÁRIO]

  // Formas de pagamento direto pelo WhatsApp ainda não foram confirmadas.
  // Habilite apenas as que o estabelecimento realmente aceitar.
  paymentMethods: [
    { id: 'pix', label: 'PIX', enabled: false },
    { id: 'cash', label: 'Dinheiro', enabled: false },
    { id: 'card', label: 'Cartão', enabled: false },
  ],

  // Fluxos solicitados no projeto. Ajuste se o estabelecimento não trabalhar com algum deles.
  orderTypes: {
    delivery: true,
    pickup: true,
  },
};

export const customization = {
  complements: [
    'Leite em pó',
    'Granola',
    'Farelo de amendoim',
    'Paçoca',
    'Jujuba',
    'Ovomaltine em pó',
  ],
  syrups: [
    'Leite condensado',
    'Mel',
    'Cobertura de chocolate',
    'Cobertura de morango',
  ],
  fruits: [
    { id: 'banana', label: 'Banana', extraCents: 0 },
    { id: 'manga', label: 'Manga', extraCents: 0 },
    { id: 'morango', label: 'Morango', extraCents: 200 },
  ],
  truffleCreams: [
    'Creme de Nutella',
    'Creme de Ovomaltine',
  ],
};

export const products = [
  {
    id: 'trad-300',
    name: 'Açaí Tradicional 300 ml',
    shortName: 'Tradicional 300 ml',
    category: 'Açaí Tradicional',
    description: 'Inclui até 4 complementos, até 2 caldas e 1 fruta.',
    priceCents: 1690,
    image: 'assets/images/tradicional-300.jpg',
    available: true,
    limits: { complements: 4, syrups: 2, fruits: 1, truffleCreams: 0 },
  },
  {
    id: 'trad-400',
    name: 'Açaí Tradicional 400 ml',
    shortName: 'Tradicional 400 ml',
    category: 'Açaí Tradicional',
    description: 'Inclui até 4 complementos, até 2 caldas e 1 fruta.',
    priceCents: 2090,
    image: 'assets/images/tradicional-400.jpg',
    available: true,
    limits: { complements: 4, syrups: 2, fruits: 1, truffleCreams: 0 },
  },
  {
    id: 'trad-500',
    name: 'Açaí Tradicional 500 ml',
    shortName: 'Tradicional 500 ml',
    category: 'Açaí Tradicional',
    description: 'Inclui até 4 complementos, até 2 caldas e 1 fruta.',
    priceCents: 2490,
    image: 'assets/images/tradicional-500.jpg',
    available: true,
    limits: { complements: 4, syrups: 2, fruits: 1, truffleCreams: 0 },
  },
  {
    id: 'truf-300',
    name: 'Açaí Premium Trufado 300 ml',
    shortName: 'Trufado 300 ml',
    category: 'Açaí Premium Trufado',
    description: 'Inclui até 4 complementos, até 2 caldas, 1 fruta e 1 creme trufado.',
    priceCents: 2190,
    image: 'assets/images/trufado-nutella-300.jpg',
    available: true,
    limits: { complements: 4, syrups: 2, fruits: 1, truffleCreams: 1 },
  },
  {
    id: 'truf-400',
    name: 'Açaí Premium Trufado 400 ml',
    shortName: 'Trufado 400 ml',
    category: 'Açaí Premium Trufado',
    description: 'Inclui até 4 complementos, até 2 caldas, 1 fruta e 1 creme trufado.',
    priceCents: 2590,
    image: 'assets/images/trufado-nutella-400.jpg',
    available: true,
    limits: { complements: 4, syrups: 2, fruits: 1, truffleCreams: 1 },
  },
  {
    id: 'truf-500',
    name: 'Açaí Premium Trufado 500 ml',
    shortName: 'Trufado 500 ml',
    category: 'Açaí Premium Trufado',
    description: 'Inclui até 4 complementos, até 2 caldas, 1 fruta e 1 creme trufado.',
    priceCents: 2990,
    image: 'assets/images/trufado-nutella-500.jpg',
    available: true,
    limits: { complements: 4, syrups: 2, fruits: 1, truffleCreams: 1 },
  },
];
