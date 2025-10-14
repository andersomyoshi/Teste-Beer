import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- INICIALIZAÇÃO E VARIÁVEIS GLOBAIS ---
const USUARIO_CORRETO = 'Yoshi';
const SENHA_CORRETA = '1985';
let allProducts = []; // Array para armazenar todos os produtos para pesquisa e filtro

// Seleciona todos os elementos da página uma única vez para melhor performance
const DOMElements = {
    loginScreen: document.getElementById('login-screen'),
    adminPanel: document.getElementById('admin-panel'),
    loginButton: document.getElementById('login-button'),
    logoutButton: document.getElementById('logout-button'),
    userInput: document.getElementById('login-user'),
    passwordInput: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    productsTableBody: document.getElementById('products-table-body'),
    addProductBtn: document.getElementById('add-product-btn'),
    backupBtn: document.getElementById('backup-btn'),
    // Modais e Triggers
    productModal: document.getElementById('product-modal'),
    modalTriggers: document.querySelectorAll('.modal-trigger'),
    modalCloseBtns: document.querySelectorAll('.modal-close-btn'),
    // Formulário de Produto
    productForm: document.getElementById('product-form'),
    modalTitle: document.getElementById('modal-title'),
    promotionCheckbox: document.getElementById('is-promotion'),
    promotionUrlContainer: document.getElementById('promotion-url-container'),
    // Pesquisa e Filtro
    searchInput: document.getElementById('search-input'),
    searchResults: document.getElementById('search-results'),
    categoryFilter: document.getElementById('category-filter'),
    // PDF
    generatePdfBtn: document.getElementById('generate-pdf-btn'),
};

// --- LÓGICA DE LOGIN ---
function attemptLogin() {
    if (DOMElements.userInput.value === USUARIO_CORRETO && DOMElements.passwordInput.value === SENHA_CORRETA) {
        sessionStorage.setItem('loggedIn', 'true');
        showAdminPanel();
    } else {
        DOMElements.loginError.textContent = 'Usuário ou senha inválidos.';
    }
}

function showAdminPanel() {
    DOMElements.loginScreen.style.display = 'none';
    DOMElements.adminPanel.style.display = 'block';
    loadAndRenderProducts();
}

function doLogout() {
    sessionStorage.removeItem('loggedIn');
    DOMElements.loginError.textContent = '';
    DOMElements.userInput.value = '';
    DOMElements.passwordInput.value = '';
    DOMElements.loginScreen.style.display = 'flex';
    DOMElements.adminPanel.style.display = 'none';
}

// --- GERENCIAMENTO DE PRODUTOS (CRUD) ---
async function loadAndRenderProducts(filterFn = null) {
    DOMElements.productsTableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center">Carregando...</td></tr>';
    const querySnapshot = await getDocs(collection(db, "products"));
    allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let productsToRender = filterFn ? allProducts.filter(filterFn) : allProducts;

    renderTable(productsToRender);
}

function renderTable(products) {
    DOMElements.productsTableBody.innerHTML = '';
    if (products.length === 0) {
        DOMElements.productsTableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center">Nenhum produto encontrado.</td></tr>';
        return;
    }
    products.forEach(product => {
        DOMElements.productsTableBody.innerHTML += `
            <tr class="border-b">
                <td class="p-3">${product.name}</td>
                <td class="p-3">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</td>
                <td class="p-3">${product.stock}</td>
                <td class="p-3">${product.category}</td>
                <td class="p-3">
                    <button class="bg-blue-500 text-white px-3 py-1 rounded" onclick="window.editProduct('${product.id}')">Editar</button>
                    <button class="bg-red-500 text-white px-3 py-1 rounded ml-2" onclick="window.deleteProduct('${product.id}')">Excluir</button>
                </td>
            </tr>`;
    });
}

DOMElements.productForm.addEventListener('submit', async e => {
    e.preventDefault();
    const productId = document.getElementById('product-id').value;
    const productData = {
        name: document.getElementById('product-name').value,
        image: document.getElementById('product-image').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value, 10),
        category: document.getElementById('product-category').value,
        brand: document.getElementById('product-brand').value,
        barcode: document.getElementById('product-barcode').value || "",
        cost: parseFloat(document.getElementById('product-cost').value) || 0,
        isPopular: document.getElementById('is-popular').checked,
        isConsagrada: document.getElementById('is-consagrada').checked,
        isPrestigiada: document.getElementById('is-prestigiada').checked,
        isPromotion: document.getElementById('is-promotion').checked,
        promotionUrl: document.getElementById('product-promotionUrl').value || "",
    };

    try {
        if (productId) {
            await setDoc(doc(db, "products", productId), productData);
            alert('Produto atualizado!');
        } else {
            await addDoc(collection(db, "products"), productData);
            alert('Produto adicionado!');
        }
        DOMElements.productModal.classList.remove('flex');
        loadAndRenderProducts();
    } catch (error) {
        console.error("Erro ao salvar produto: ", error);
        alert('Ocorreu um erro ao salvar o produto.');
    }
});

window.editProduct = async id => {
    const product = allProducts.find(p => p.id === id);
    if (product) {
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-image').value = product.image;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-brand').value = product.brand;
        document.getElementById('product-barcode').value = product.barcode || '';
        document.getElementById('product-cost').value = product.cost || '';
        document.getElementById('is-popular').checked = product.isPopular || false;
        document.getElementById('is-consagrada').checked = product.isConsagrada || false;
        document.getElementById('is-prestigiada').checked = product.isPrestigiada || false;
        document.getElementById('is-promotion').checked = product.isPromotion || false;
        document.getElementById('product-promotionUrl').value = product.promotionUrl || '';
        DOMElements.promotionCheckbox.dispatchEvent(new Event('change'));
        
        DOMElements.modalTitle.textContent = 'Editar Produto';
        DOMElements.productModal.classList.add('flex');
    }
};

window.deleteProduct = async id => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        await deleteDoc(doc(db, "products", id));
        alert('Produto excluído!');
        loadAndRenderProducts();
    }
};

// --- LÓGICA DOS MODAIS ---
DOMElements.modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const modalId = trigger.dataset.modal;
        document.getElementById(modalId)?.classList.add('flex');
    });
});

DOMElements.modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.remove('flex');
    });
});

DOMElements.addProductBtn.addEventListener('click', () => {
    DOMElements.productForm.reset();
    document.getElementById('product-id').value = '';
    DOMElements.modalTitle.textContent = 'Adicionar Novo Produto';
    DOMElements.promotionCheckbox.dispatchEvent(new Event('change'));
    DOMElements.productModal.classList.add('flex');
});

// --- LÓGICA DE PESQUISA E FILTRO ---
DOMElements.searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const results = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm));
    DOMElements.searchResults.innerHTML = results.map(p => `<div class="p-2 border-b">${p.name} - ${p.brand}</div>`).join('');
});

DOMElements.categoryFilter.addEventListener('change', (e) => {
    const category = e.target.value;
    if (category === 'all') {
        renderTable(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderTable(filtered);
    }
});

// --- LÓGICA DO FORMULÁRIO DE PRODUTO ---
DOMElements.promotionCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        DOMElements.promotionUrlContainer.style.display = 'block';
    } else {
        DOMElements.promotionUrlContainer.style.display = 'none';
    }
});

// --- FECHAMENTO DE CAIXA E PDF ---
DOMElements.generatePdfBtn.addEventListener('click', () => {
    alert("Funcionalidade em desenvolvimento. Nenhum dado de venda foi encontrado para gerar o relatório.");
    // Exemplo de como o PDF seria gerado quando houver dados:
    /*
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório de Fechamento de Caixa", 14, 16);
    doc.autoTable({
        startY: 22,
        head: [['Descrição', 'Valor']],
        body: [
            ['Total Bruto de Vendas', 'R$ 0,00'],
            ['Custo Total', 'R$ 0,00'],
            ['Lucro Bruto', 'R$ 0,00'],
            ['Itens Vendidos', '0'],
        ],
    })
    doc.save(`fechamento_caixa_${new Date().toLocaleDateString()}.pdf`);
    */
});

// --- EVENTOS DE INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('loggedIn') === 'true') {
        showAdminPanel();
    } else {
        DOMElements.loginScreen.style.display = 'flex';
    }
});

DOMElements.loginButton.addEventListener('click', attemptLogin);
DOMElements.logoutButton.addEventListener('click', doLogout);
DOMElements.passwordInput.addEventListener('keypress', (e) => e.key === 'Enter' && attemptLogin());
