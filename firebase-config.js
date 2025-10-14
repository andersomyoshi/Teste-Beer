// Importe as funções que você precisa dos SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// A configuração do seu app web do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDESJdxOC4v29_9AUMdwKhH_qV9eJiDoRE",
  authDomain: "yoshisbar-253e1.firebaseapp.com",
  projectId: "yoshisbar-253e1",
  storageBucket: "yoshisbar-253e1.appspot.com",
  messagingSenderId: "737401455071",
  appId: "1:737401455071:web:78c8663a69d79ea725c46a",
  measurementId: "G-PYWXBT90LX"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o serviço do Firestore que você vai usar nos outros arquivos
export const db = getFirestore(app);