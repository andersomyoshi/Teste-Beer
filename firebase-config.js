import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDESJdxOC4v29_9AUMdwKhH_qV9eJiDoRE",
  authDomain: "yoshisbar-253e1.firebaseapp.com",
  projectId: "yoshisbar-253e1",
  storageBucket: "yoshisbar-253e1.firebasestorage.app",
  messagingSenderId: "737401455071",
  appId: "1:737401455071:web:78c8663a69d79ea725c46a",
  measurementId: "G-PYWXBT90LX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


