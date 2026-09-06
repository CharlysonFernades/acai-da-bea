import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export const STORE_ID = 'acai-da-bea';

// Cole aqui o objeto firebaseConfig EXATO mostrado no Firebase Console.
// A configuração web do Firebase não é uma senha; as Firestore Rules fazem a proteção real.
export const firebaseConfig = {
  apiKey: 'AIzaSyDUV8s1VwWEtsBGV8NTb6QXWAIJFOKvccw',
  authDomain: 'acai-da-bea.firebaseapp.com',
  projectId: 'acai-da-bea',
  storageBucket: 'acai-da-bea.firebasestorage.app',
  messagingSenderId: '636142381605',
  appId: '1:636142381605:web:4a040ead0facbe3646adcc'
};

export const firebaseConfigured =
  Boolean(firebaseConfig.apiKey) && !firebaseConfig.apiKey.startsWith('__COLE_');

export const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = firebaseConfigured ? getAuth(app) : null;
export const db = firebaseConfigured ? getFirestore(app) : null;
