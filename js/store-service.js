import { db, firebaseConfigured, STORE_ID } from './firebase-config.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const normalize = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const belongs = (item) => !item.storeId || item.storeId === STORE_ID;
const sortByOrder = (a, b) => Number(a.order ?? 999) - Number(b.order ?? 999);

export async function getStoreData() {
  if (!firebaseConfigured || !db) return null;
  const snap = await getDoc(doc(db, 'stores', STORE_ID));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getCollectionData(name) {
  if (!firebaseConfigured || !db) return [];
  const snap = await getDocs(collection(db, name));
  return normalize(snap).filter(belongs).sort(sortByOrder);
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
    collection(db, name),
    (snap) => callback(normalize(snap).filter(belongs).sort(sortByOrder)),
    onError
  );
}
