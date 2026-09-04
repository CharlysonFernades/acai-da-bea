import { products, customization } from './data.js';

const STORAGE_KEY = 'acai-da-bea-cart-v2';

let cart = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeItem).filter(Boolean);
  } catch {
    return [];
  }
}

function sanitizeItem(item) {
  if (!item || typeof item.productId !== 'string') return null;
  const product = products.find((entry) => entry.id === item.productId && entry.available);
  if (!product || !Number.isInteger(product.priceCents) || product.priceCents < 0) return null;

  const quantity = Number.isInteger(item.quantity) ? Math.min(Math.max(item.quantity, 1), 99) : 1;
  const selections = sanitizeSelections(item.selections || {}, product);
  const note = cleanText(item.note, 180);
  const fruit = customization.fruits.find((entry) => entry.id === selections.fruitId);
  const extraCents = Number.isInteger(fruit?.extraCents) ? fruit.extraCents : 0;
  const unitPriceCents = product.priceCents + extraCents;
  const key = buildKey(product.id, selections, note);

  return {
    key,
    productId: product.id,
    name: product.name,
    basePriceCents: product.priceCents,
    extraCents,
    unitPriceCents,
    quantity,
    selections: {
      complements: selections.complements,
      syrups: selections.syrups,
      fruitId: selections.fruitId,
      fruit: fruit?.label || '',
      creams: selections.creams,
    },
    note,
  };
}

function sanitizeSelections(raw, product) {
  const validComplements = new Set(customization.complements);
  const validSyrups = new Set(customization.syrups);
  const validCreams = new Set(customization.truffleCreams);
  const validFruitIds = new Set(customization.fruits.map((entry) => entry.id));

  return {
    complements: sanitizeArray(raw.complements, validComplements, product.limits.complements),
    syrups: sanitizeArray(raw.syrups, validSyrups, product.limits.syrups),
    fruitId: validFruitIds.has(raw.fruitId) ? raw.fruitId : '',
    creams: sanitizeArray(raw.creams, validCreams, product.limits.truffleCreams),
  };
}

function sanitizeArray(value, allowed, limit) {
  if (!Array.isArray(value) || limit <= 0) return [];
  const unique = [];
  for (const entry of value) {
    if (allowed.has(entry) && !unique.includes(entry)) unique.push(entry);
    if (unique.length >= limit) break;
  }
  return unique;
}

function cleanText(value, maxLength) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, maxLength);
}

function buildKey(productId, selections, note) {
  const signature = JSON.stringify({ productId, selections, note });
  let hash = 0;
  for (let i = 0; i < signature.length; i += 1) {
    hash = ((hash << 5) - hash) + signature.charCodeAt(i);
    hash |= 0;
  }
  return `${productId}-${Math.abs(hash).toString(36)}`;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // O carrinho continua funcionando em memória se o storage estiver indisponível.
  }
}

export function getCart() {
  return cart.map((item) => ({ ...item, selections: { ...item.selections } }));
}

export function addCartItem(rawItem) {
  const item = sanitizeItem(rawItem);
  if (!item) return false;

  const existing = cart.find((entry) => entry.key === item.key);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, 99);
  } else {
    cart.push(item);
  }
  persist();
  return true;
}

export function setQuantity(key, quantity) {
  if (!Number.isInteger(quantity)) return;
  if (quantity <= 0) {
    removeCartItem(key);
    return;
  }
  const item = cart.find((entry) => entry.key === key);
  if (!item) return;
  item.quantity = Math.min(quantity, 99);
  persist();
}

export function removeCartItem(key) {
  cart = cart.filter((item) => item.key !== key);
  persist();
}

export function clearCart() {
  cart = [];
  persist();
}

export function cartTotals() {
  return cart.reduce((acc, item) => {
    acc.items += item.quantity;
    acc.totalCents += item.unitPriceCents * item.quantity;
    return acc;
  }, { items: 0, totalCents: 0 });
}

export function revalidateCart() {
  cart = cart.map(sanitizeItem).filter(Boolean);
  persist();
  return cart.length > 0;
}
