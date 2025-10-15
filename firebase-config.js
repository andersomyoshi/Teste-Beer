// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDESJdxOC4v29_9AUMdwKhH_qV9eJiDoRE",
  authDomain: "yoshisbar-253e1.firebaseapp.com",
  projectId: "yoshisbar-253e1",
  storageBucket: "yoshisbar-253e1.appspot.com",
  messagingSenderId: "737401455071",
  appId: "1:737401455071:web:78c8663a69d79ea725c46a",
  measurementId: "G-PYWXBT90LX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
