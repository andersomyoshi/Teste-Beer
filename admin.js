import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const App = {
    // ... (restante do objeto App, incluindo init, fetchAndRenderData, etc.)
};

// PONTO DE ENTRADA DO SCRIPT
document.addEventListener('DOMContentLoaded', App.init);
