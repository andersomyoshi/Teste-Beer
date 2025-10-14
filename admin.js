import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- ESTADO E CONFIGURAÇÕES ---
const USUARIO_CORRETO = 'Yoshi';
const SENHA_CORRETA = '1985';
let allProducts = [];
let salesData = [];

// --- FUNÇÕES DE LOGIN ---
const Auth = {
    attemptLogin: () => {
        const userInput = document.getElementById('login-user');
        const passInput = document.getElementById('login-password');
        if (userInput.value === USUARIO_CORRETO && passInput.value === SENHA_CORRETA) {
            sessionStorage.setItem('loggedIn', 'true');
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            Admin.loadAndRenderProducts();
        } else {
            document.getElementById('login-error').textContent = 'Usuário ou senha inválidos.';
        }
    },
    doLogout: () => {
        sessionStorage.removeItem('loggedIn');
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    },
    checkLogin: () => {
        if (sessionStorage.getItem('loggedIn') === 'true') {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            Admin.loadAndRenderProducts();
        } else {
            document.getElementById('login-screen').style.display = 'flex';
        }
    }
};

// --- OBJETO PRINCIPAL DE ADMINISTRAÇÃO ---
const Admin = {
    // PRODUTOS
    loadAndRenderProducts: async (filterFn = null) => {
        const tableBody = document.getElementById('products-table-body');
        tableBody.innerHTML = `<tr><td colspan="5" class="p-3 text-center">Carregando...</td></tr>`;
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const productsToRender = filterFn ? allProducts.filter(filterFn) : allProducts;
        Admin.renderTable(productsToRender);
    },
    renderTable: (products) => {
        const tableBody = document.getElementById('products-table-body');
        tableBody.innerHTML = products.length === 0 ? `<tr><td colspan="5" class="p-3 text-center">Nenhum produto encontrado.</td></tr>` : products.map(p => `
            <tr class="border-b"><td class="p-3">${p.name}</td><td class="p-3">R$ ${Number(p.price).toFixed(2).replace('.', ',')}</td><td class="p-3">${p.stock}</td><td class="p-3">${p.category}</td><td class="p-3"><button class="bg-blue-500 text-white px-3 py-1 rounded" onclick="Admin.editProduct('${p.id}')">Editar</button><button class="bg-red-500 text-white px-3 py-1 rounded ml-2" onclick="Admin.deleteProduct('${p.id}')">Excluir</button></td></tr>
        `).join('');
    },
    editProduct: (id) => { /* ... (código existente, mas dentro do objeto Admin) ... */ },
    deleteProduct: async (id) => { /* ... (código existente, mas dentro do objeto Admin) ... */ },
    
    // CUPONS
    loadCoupons: async () => { /* ... (código existente, mas dentro do objeto Admin) ... */ },
    deleteCoupon: async (id) => { /* ... (código existente, mas dentro do objeto Admin) ... */ },
    
    // RELATÓRIOS
    loadSalesHistory: async () => { /* ... (código existente, mas dentro do objeto Admin) ... */ },
    calculateAndShowCashier: () => { /* ... (código existente, mas dentro do objeto Admin) ... */ },
    generatePdfReport: () => { /* ... (código existente, mas dentro do objeto Admin) ... */ }
};

// --- PONTO DE ENTRADA E EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Anexa as funções ao objeto window para que os 'onclick' funcionem
    window.Admin = Admin;
    
    Auth.checkLogin();

    document.getElementById('login-button').addEventListener('click', Auth.attemptLogin);
    document.getElementById('logout-button').addEventListener('click', Auth.doLogout);
    
    // ... (restante dos event listeners para modais, forms, etc.)
});
