import { db, firebaseConfigured, STORE_ID } from './firebase-config.js';
import {
  collection,
  doc,
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

function storeQuery(name) {
  return query(collection(db, name), where('storeId', '==', STORE_ID));
}

export async function getStoreData() {
  if (!firebaseConfigured || !db) return null;
  const snap = await getDoc(doc(db, 'stores', STORE_ID));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getCollectionData(name) {
  if (!firebaseConfigured || !db) return [];
  const snap = await getDocs(storeQuery(name));
  return normalize(snap).sort(sortByOrder);
}

export function watchStoreData(callback, onError = console.error) {
  if (!firebaseConfigured || !db) return () => {};
  return onSnapshot(
    doc(db, 'stores', STORE_ID),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError
  );
}

export function watchCollectionData(name, callback, onError = console.error) {
  if (!firebaseConfigured || !db) return () => {};
  return onSnapshot(
    storeQuery(name),
    (snap) => callback(normalize(snap).sort(sortByOrder)),
    onError
  );
}

// A finalização consulta o servidor; um catálogo antigo em cache não libera o pedido.
export async function getCurrentCatalog() {
  const [store, products, groups, options] = await Promise.all([
    getDocFromServer(doc(db, 'stores', STORE_ID)),
    getDocsFromServer(storeQuery('products')),
    getDocsFromServer(storeQuery('optionGroups')),
    getDocsFromServer(storeQuery('options'))
  ]);
  if (!store.exists()) throw new Error('O cadastro da loja está em atualização.');
  return {
    store: { ...store.data(), id: store.id },
    products: normalize(products).sort(sortByOrder),
    groups: normalize(groups).sort(sortByOrder),
    options: normalize(options).sort(sortByOrder)
  };
}
