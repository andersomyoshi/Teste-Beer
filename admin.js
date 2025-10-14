import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- INICIALIZAÇÃO E VARIÁVEIS GLOBAIS ---
const USUARIO_CORRETO = 'Yoshi';
const SENHA_CORRETA = '1985';
let allProducts = [];

// --- FUNÇÕES DE LOGIN ---
function attemptLogin(userInput, passInput, errorEl, loginScreen, adminPanel) {
    if (userInput.value === USUARIO_CORRETO && passInput.value === SENHA_CORRETA) {
        sessionStorage.setItem('loggedIn', 'true');
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        loadAndRenderProducts();
    } else {
        errorEl.textContent = 'Usuário ou senha inválidos.';
    }
}

function doLogout(loginScreen, adminPanel) {
    sessionStorage.removeItem('loggedIn');
    loginScreen.style.display = 'flex';
    adminPanel.style.display = 'none';
    // Limpa os campos para o próximo login
    document.getElementById('login-user').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
}

// --- FUNÇÕES DE PRODUTOS ---
async function loadAndRenderProducts(filterFn = null) {
    const tableBody = document.getElementById('products-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center">Carregando...</td></tr>';
    const querySnapshot = await getDocs(collection(db, "products"));
    allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const productsToRender = filterFn ? allProducts.filter(filterFn) : allProducts;
    renderTable(productsToRender);
}

function renderTable(products) {
    const tableBody = document.getElementById('products-table-body');
    tableBody.innerHTML = '';
    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center">Nenhum produto encontrado.</td></tr>';
        return;
    }
    products.forEach(p => {
        tableBody.innerHTML += `<tr class="border-b"><td class="p-3">${p.name}</td><td class="p-3">R$ ${Number(p.price).toFixed(2).replace('.', ',')}</td><td class="p-3">${p.stock}</td><td class="p-3">${p.category}</td><td class="p-3"><button class="bg-blue-500 text-white px-3 py-1 rounded" onclick="window.editProduct('${p.id}')">Editar</button><button class="bg-red-500 text-white px-3 py-1 rounded ml-2" onclick="window.deleteProduct('${p.id}')">Excluir</button></td></tr>`;
    });
}

window.editProduct = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    document.getElementById('product-id').value = product.id;
    document.getElementById('modal-title').textContent = 'Editar Produto';
    // Preenche todos os campos do formulário
    const fields = ['name', 'image', 'price', 'stock', 'category', 'brand', 'barcode', 'cost', 'promotionUrl'];
    fields.forEach(field => {
        const el = document.getElementById(`product-${field}`);
        if (el) el.value = product[field] || '';
    });
    const checkboxes = ['is-popular', 'is-consagrada', 'is-prestigiada', 'is-promotion'];
    checkboxes.forEach(key => {
        const el = document.getElementById(key);
        if (el) el.checked = product[key.replace('-', '')] || false;
    });
    // Força a atualização da visibilidade do campo de URL da promoção
    document.getElementById('is-promotion').dispatchEvent(new Event('change'));
    document.getElementById('product-modal').classList.add('flex');
};

window.deleteProduct = async (id) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        await deleteDoc(doc(db, "products", id));
        alert('Produto excluído!');
        loadAndRenderProducts();
    }
};

// --- FUNÇÕES DE CUPONS ---
async function loadCoupons() {
    const tableBody = document.getElementById('coupons-table-body');
    tableBody.innerHTML = '<tr><td colspan="4" class="p-3 text-center">Carregando...</td></tr>';
    const querySnapshot = await getDocs(collection(db, "coupons"));
    tableBody.innerHTML = '';
    if (querySnapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="4" class="p-3 text-center">Nenhum cupom criado.</td></tr>';
        return;
    }
    querySnapshot.forEach(doc => {
        const coupon = doc.data();
        tableBody.innerHTML += `<tr class="border-b"><td class="p-3 font-mono">${coupon.code}</td><td class="p-3">${coupon.discountPercentage}%</td><td class="p-3">${coupon.usesLeft} / ${coupon.totalUses}</td><td class="p-3"><button class="bg-red-500 text-white px-3 py-1 rounded" onclick="window.deleteCoupon('${doc.id}')">Excluir</button></td></tr>`;
    });
}

window.deleteCoupon = async (id) => {
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
        await deleteDoc(doc(db, "coupons", id));
        alert('Cupom excluído!');
        loadCoupons();
    }
};

// --- FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ---
function initializeAdminPanel() {
    // Elementos da Página
    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');
    const productForm = document.getElementById('product-form');

    // Lógica de Login
    if (sessionStorage.getItem('loggedIn') === 'true') {
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        loadAndRenderProducts();
    } else {
        loginScreen.style.display = 'flex';
    }
    loginButton.addEventListener('click', () => attemptLogin(userInput, passInput, errorEl, loginScreen, adminPanel));
    passInput.addEventListener('keypress', (e) => e.key === 'Enter' && attemptLogin(userInput, passInput, errorEl, loginScreen, adminPanel));
    logoutButton.addEventListener('click', () => doLogout(loginScreen, adminPanel));

    // Lógica dos Modais
    document.querySelectorAll('.modal-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.dataset.modal;
            document.getElementById(modalId)?.classList.add('flex');
            if (modalId === 'coupons-modal') loadCoupons();
        });
    });
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.modal').classList.remove('flex'));
    });
    document.getElementById('add-product-btn-trigger').addEventListener('click', () => {
        productForm.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('modal-title').textContent = 'Adicionar Novo Produto';
        document.getElementById('is-promotion').dispatchEvent(new Event('change'));
    });

    // Lógica do Formulário de Produto
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productId = document.getElementById('product-id').value;
        const productData = { name: document.getElementById('product-name').value, image: document.getElementById('product-image').value, price: parseFloat(document.getElementById('product-price').value), stock: parseInt(document.getElementById('product-stock').value, 10), category: document.getElementById('product-category').value, brand: document.getElementById('product-brand').value, barcode: document.getElementById('product-barcode').value || "", cost: parseFloat(document.getElementById('product-cost').value) || 0, isPopular: document.getElementById('is-popular').checked, isConsagrada: document.getElementById('is-consagrada').checked, isPrestigiada: document.getElementById('is-prestigiada').checked, isPromotion: document.getElementById('is-promotion').checked, promotionUrl: document.getElementById('product-promotionUrl').value || "", };
        try {
            if (productId) { await setDoc(doc(db, "products", productId), productData); alert('Produto atualizado!'); }
            else { await addDoc(collection(db, "products"), productData); alert('Produto adicionado!'); }
            document.getElementById('product-modal').classList.remove('flex');
            loadAndRenderProducts();
        } catch (error) { console.error("Erro ao salvar:", error); alert('Ocorreu um erro.'); }
    });
    document.getElementById('is-promotion').addEventListener('change', (e) => {
        document.getElementById('promotion-url-container').style.display = e.target.checked ? 'block' : 'none';
    });

    // Lógica de Pesquisa e Filtro
    document.getElementById('search-input').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const results = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm));
        document.getElementById('search-results').innerHTML = results.map(p => `<div class="p-2 border-b">${p.name} - ${p.brand}</div>`).join('');
    });
    document.getElementById('category-filter').addEventListener('change', (e) => {
        renderTable(e.target.value === 'all' ? allProducts : allProducts.filter(p => p.category === e.target.value));
    });

    // Lógica de Cupons
    document.getElementById('create-coupon-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('coupon-code').value.toUpperCase();
        const discount = parseInt(document.getElementById('coupon-discount').value);
        const uses = parseInt(document.getElementById('coupon-uses').value);
        if (!code || !discount || !uses) { alert("Preencha todos os campos do cupom."); return; }
        const couponData = { code, discountPercentage: discount, totalUses: uses, usesLeft: uses };
        await addDoc(collection(db, "coupons"), couponData);
        alert(`Cupom "${code}" criado!`);
        e.target.reset();
        loadCoupons();
    });
}

// --- PONTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', initializeAdminPanel);
