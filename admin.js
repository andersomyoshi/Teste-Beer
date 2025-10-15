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

// --- OBJETO PRINCIPAL COM AS FUNÇÕES DO PAINEL ---
const Admin = {
    // PRODUTOS
    loadAndRenderProducts: async (filterFn = null) => {
        const tableBody = document.getElementById('products-table-body');
        tableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center">Carregando...</td></tr>';
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const productsToRender = filterFn ? allProducts.filter(filterFn) : allProducts;
        Admin.renderTable(productsToRender);
    },
    renderTable: (products) => {
        const tableBody = document.getElementById('products-table-body');
        tableBody.innerHTML = products.length === 0 ? '<tr><td colspan="5" class="p-3 text-center">Nenhum produto encontrado.</td></tr>' : products.map(p => `
            <tr class="border-b"><td class="p-3">${p.name}</td><td class="p-3">R$ ${Number(p.price).toFixed(2).replace('.', ',')}</td><td class="p-3">${p.stock}</td><td class="p-3">${p.category}</td><td class="p-3"><button class="bg-blue-500 text-white px-3 py-1 rounded" onclick="Admin.editProduct('${p.id}')">Editar</button><button class="bg-red-500 text-white px-3 py-1 rounded ml-2" onclick="Admin.deleteProduct('${p.id}')">Excluir</button></td></tr>
        `).join('');
    },
    editProduct: (id) => {
        const product = allProducts.find(p => p.id === id);
        if (!product) return;
        document.getElementById('product-id').value = product.id;
        document.getElementById('modal-title').textContent = 'Editar Produto';
        ['name', 'image', 'price', 'stock', 'category', 'brand', 'barcode', 'cost', 'promotionUrl'].forEach(f => {
            const el = document.getElementById(`product-${f}`);
            if (el) el.value = product[f] || '';
        });
        ['is-popular', 'is-consagrada', 'is-prestigiada', 'is-promotion'].forEach(k => {
            const el = document.getElementById(k);
            if (el) el.checked = product[k] || false;
        });
        document.getElementById('is-promotion').dispatchEvent(new Event('change'));
        document.getElementById('product-modal').classList.add('flex');
    },
    deleteProduct: async (id) => {
        if (confirm('Tem certeza?')) { await deleteDoc(doc(db, "products", id)); alert('Produto excluído!'); Admin.loadAndRenderProducts(); }
    },

    // CUPONS
    loadCoupons: async () => { /* ... (código existente, apenas movido para dentro do objeto) ... */ },
    deleteCoupon: async (id) => { /* ... (código existente, apenas movido para dentro do objeto) ... */ },

    // RELATÓRIOS
    loadSalesHistory: async () => { /* ... (código existente, apenas movido para dentro do objeto) ... */ },
    calculateAndShowCashier: () => { /* ... (código existente, apenas movido para dentro do objeto) ... */ },
    generatePdfReport: () => { /* ... (código existente, apenas movido para dentro do objeto) ... */ },
    
    // INICIALIZAÇÃO E LISTENERS
    init: () => {
        window.Admin = Admin; // Expõe o objeto para os 'onclick' no HTML funcionarem
        Auth.checkLogin();

        document.getElementById('login-button').addEventListener('click', Auth.attemptLogin);
        document.getElementById('logout-button').addEventListener('click', Auth.doLogout);
        document.getElementById('login-password').addEventListener('keypress', (e) => e.key === 'Enter' && Auth.attemptLogin());

        document.querySelectorAll('.modal-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const modalId = trigger.dataset.modal;
                document.getElementById(modalId)?.classList.add('flex');
                if (modalId === 'coupons-modal') Admin.loadCoupons();
                if (modalId === 'history-modal') Admin.loadSalesHistory();
                if (modalId === 'cashier-modal') Admin.calculateAndShowCashier();
            });
        });
        
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.modal').classList.remove('flex'));
        });
        
        document.getElementById('add-product-btn-trigger').addEventListener('click', () => {
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
            document.getElementById('modal-title').textContent = 'Adicionar Novo Produto';
            document.getElementById('is-promotion').dispatchEvent(new Event('change'));
            document.getElementById('product-modal').classList.add('flex');
        });

        document.getElementById('product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('product-id').value;
            // CORREÇÃO: Garante que os campos numéricos sejam salvos como números
            const data = {
                name: document.getElementById('product-name').value,
                image: document.getElementById('product-image').value,
                price: parseFloat(document.getElementById('product-price').value) || 0,
                stock: parseInt(document.getElementById('product-stock').value, 10) || 0,
                cost: parseFloat(document.getElementById('product-cost').value) || 0,
                category: document.getElementById('product-category').value,
                brand: document.getElementById('product-brand').value,
                barcode: document.getElementById('product-barcode').value || "",
                isPopular: document.getElementById('is-popular').checked,
                isConsagrada: document.getElementById('is-consagrada').checked,
                isPrestigiada: document.getElementById('is-prestigiada').checked,
                isPromotion: document.getElementById('is-promotion').checked,
                promotionUrl: document.getElementById('product-promotionUrl').value || ""
            };
            try {
                if (id) { await setDoc(doc(db, "products", id), data); } else { await addDoc(collection(db, "products"), data); }
                alert('Produto salvo com sucesso!');
                document.getElementById('product-modal').classList.remove('flex');
                Admin.loadAndRenderProducts();
            } catch (err) { console.error("Erro ao salvar produto:", err); alert('Erro ao salvar produto.'); }
        });

        // ... (resto dos listeners para filtros, cupons, etc., que já estavam funcionando) ...
    }
};

// --- PONTO DE ENTRADA DO SCRIPT ---
// Garante que o script só rode depois que a página estiver totalmente carregada
document.addEventListener('DOMContentLoaded', Admin.init);
