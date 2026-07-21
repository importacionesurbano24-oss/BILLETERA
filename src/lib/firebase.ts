import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDHzwKb_vJ8cEEE77EPNJiQrKcX20KCsiw",
  authDomain: "gen-lang-client-0569712983.firebaseapp.com",
  projectId: "gen-lang-client-0569712983",
  storageBucket: "gen-lang-client-0569712983.firebasestorage.app",
  messagingSenderId: "147189266576",
  appId: "1:147189266576:web:37c528d6b87bb2e2f68015"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, "ai-studio-tubilletera-503f8965-9d31-4d6a-b75f-ea22894fd773");
export const auth = getAuth(app);
