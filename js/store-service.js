import { db, firebaseConfigured, STORE_ID } from './firebase-config.js';
import { buildCheckoutReadPlan, mergeFreshDocuments } from './catalog-read-plan.js';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const normalize = (snap) => snap.docs.map((d) => ({ ...d.data(), id: d.id }));
const sortByOrder = (a, b) => Number(a.order ?? 999) - Number(b.order ?? 999);
const cache = { store: null, products: [], optionGroups: [], options: [] };
const cacheLoaded = new Set();

function storeQuery(name) {
  return query(collection(db, name), where('storeId', '==', STORE_ID));
}

function rememberCollection(name, items) {
  cache[name] = [...items].sort(sortByOrder);
  cacheLoaded.add(name);
  return cache[name];
}

async function getDocumentsByIds(name, ids) {
  const unique = [...new Set((Array.isArray(ids) ? ids : []).filter(id => typeof id === 'string' && id.trim()).map(id => id.trim()))];
  if (!unique.length) return [];
  const chunks = [];
  for (let index = 0; index < unique.length; index += 30) chunks.push(unique.slice(index, index + 30));
  const snapshots = await Promise.all(chunks.map(chunk => getDocsFromServer(query(
    collection(db, name),
    where('storeId', '==', STORE_ID),
    where(documentId(), 'in', chunk)
  ))));
  return snapshots.flatMap(normalize).sort(sortByOrder);
}

async function getFullCurrentCatalog() {
  const [store, products, groups, options] = await Promise.all([
    getDocFromServer(doc(db, 'stores', STORE_ID)),
    getDocsFromServer(storeQuery('products')),
    getDocsFromServer(storeQuery('optionGroups')),
    getDocsFromServer(storeQuery('options'))
  ]);
  if (!store.exists()) throw new Error('O cadastro da loja está em atualização.');
  cache.store = { ...store.data(), id: store.id };
  rememberCollection('products', normalize(products));
  rememberCollection('optionGroups', normalize(groups));
  rememberCollection('options', normalize(options));
  return {
    store: cache.store,
    products: [...cache.products],
    groups: [...cache.optionGroups],
    options: [...cache.options]
  };
}

export async function getStoreData() {
  if (!firebaseConfigured || !db) return null;
  const snap = await getDoc(doc(db, 'stores', STORE_ID));
  cache.store = snap.exists() ? { id: snap.id, ...snap.data() } : null;
  return cache.store;
}

export async function getCollectionData(name) {
  if (!firebaseConfigured || !db) return [];
  const snap = await getDocs(storeQuery(name));
  return rememberCollection(name, normalize(snap));
}

export function watchStoreData(callback, onError = console.error) {
  if (!firebaseConfigured || !db) return () => {};
  return onSnapshot(
    doc(db, 'stores', STORE_ID),
    (snap) => {
      cache.store = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      callback(cache.store);
    },
    onError
  );
}

export function watchCollectionData(name, callback, onError = console.error) {
  if (!firebaseConfigured || !db) return () => {};
  return onSnapshot(
    storeQuery(name),
    (snap) => callback(rememberCollection(name, normalize(snap))),
    onError
  );
}

// A finalização sempre confirma a loja e, para carrinhos atuais, relê apenas
// os produtos/grupos/opções que podem alterar aquele pedido. Carrinhos antigos
// sem IDs de opções fazem a conferência completa uma única vez para migração.
export async function getCurrentCatalog(cart = null) {
  const plan = buildCheckoutReadPlan(cart, cache.optionGroups);
  const selectiveReady = Array.isArray(cart) && cart.length > 0
    && !plan.requiresFullCatalog
    && ['products', 'optionGroups', 'options'].every(name => cacheLoaded.has(name));
  if (!selectiveReady) return getFullCurrentCatalog();

  const [store, freshProducts, freshGroups, freshOptions] = await Promise.all([
    getDocFromServer(doc(db, 'stores', STORE_ID)),
    getDocumentsByIds('products', plan.productIds),
    getDocumentsByIds('optionGroups', plan.groupIds),
    getDocumentsByIds('options', plan.optionIds)
  ]);
  if (!store.exists()) throw new Error('O cadastro da loja está em atualização.');

  cache.store = { ...store.data(), id: store.id };
  cache.products = mergeFreshDocuments(cache.products, freshProducts, plan.productIds).sort(sortByOrder);
  cache.optionGroups = mergeFreshDocuments(cache.optionGroups, freshGroups, plan.groupIds).sort(sortByOrder);
  cache.options = mergeFreshDocuments(cache.options, freshOptions, plan.optionIds).sort(sortByOrder);

  return {
    store: cache.store,
    products: [...cache.products],
    groups: [...cache.optionGroups],
    options: [...cache.options]
  };
}
