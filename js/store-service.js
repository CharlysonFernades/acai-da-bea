import { db, firebaseConfigured, STORE_ID } from './firebase-config.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const normalize = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
