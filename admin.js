import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- CREDENCIAIS DE LOGIN ---
const USUARIO_CORRETO = 'Yoshi';
const SENHA_CORRETA = '1985';

// --- ELEMENTOS DA PÁGINA ---
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const userInput = document.getElementById('login-user');
const passwordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const productsTableBody = document.getElementById('products-table-body');
const addProductBtn = document.getElementById('add-product-btn');
const productModal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const productForm = document.getElementById('product-form');
const cancelBtn = document.getElementById('cancel-btn');
const backupBtn = document.getElementById('backup-btn');

// --- LÓGICA DE LOGIN ---
function attemptLogin() {
    if (userInput.value === USUARIO_CORRETO && passwordInput.value === SENHA_CORRETA) {
        sessionStorage.setItem('loggedIn', 'true');
        showAdminPanel();
    } else {
        loginError.textContent = 'Usuário ou senha inválidos.';
    }
}

function showAdminPanel() {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    loadProducts();
}

function doLogout() {
    sessionStorage.removeItem('loggedIn');
    loginError.textContent = '';
    userInput.value = '';
    passwordInput.value = '';
    loginScreen.style.display = 'flex';
    adminPanel.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('loggedIn') === 'true') {
        showAdminPanel();
    } else {
        loginScreen.style.display = 'flex';
    }
});

loginButton.addEventListener('click', attemptLogin);
logoutButton.addEventListener('click', doLogout);
passwordInput.addEventListener('keypress', (e) => e.key === 'Enter' && attemptLogin());

// --- GERENCIAMENTO DE PRODUTOS (CRUD) ---
// (O restante do código de gerenciamento de produtos permanece o mesmo)
async function loadProducts() {
    productsTableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center">Carregando...</td></tr>';
    const querySnapshot = await getDocs(collection(db, "products"));
    productsTableBody.innerHTML = '';
    if (querySnapshot.empty) {
        productsTableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center">Nenhum produto cadastrado.</td></tr>';
        return;
    }
    querySnapshot.forEach(doc => {
        const product = doc.data();
        productsTableBody.innerHTML += `<tr class="border-b"><td class="p-3">${product.name}</td><td class="p-3">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</td><td class="p-3">${product.stock}</td><td class="p-3">${product.category}</td><td class="p-3"><button class="bg-blue-500 text-white px-3 py-1 rounded" onclick="window.editProduct('${doc.id}')">Editar</button><button class="bg-red-500 text-white px-3 py-1 rounded ml-2" onclick="window.deleteProduct('${doc.id}')">Excluir</button></td></tr>`;
    });
}

addProductBtn.addEventListener('click', () => {
    productForm.reset();
    document.getElementById('product-id').value = '';
    modalTitle.textContent = 'Adicionar Novo Produto';
    productModal.classList.add('flex');
});

cancelBtn.addEventListener('click', () => productModal.classList.remove('flex'));

productForm.addEventListener('submit', async e => {
    e.preventDefault();
    const productId = document.getElementById('product-id').value;
    const productData = { name: document.getElementById('product-name').value, image: document.getElementById('product-image').value, price: parseFloat(document.getElementById('product-price').value), stock: parseInt(document.getElementById('product-stock').value, 10), category: document.getElementById('product-category').value, brand: document.getElementById('product-brand').value, barcode: document.getElementById('product-barcode').value || "", isPopular: document.getElementById('is-popular').checked, isConsagrada: document.getElementById('is-consagrada').checked, isPrestigiada: document.getElementById('is-prestigiada').checked };
    try {
        if (productId) { await setDoc(doc(db, "products", productId), productData); alert('Produto atualizado!'); } else { await addDoc(collection(db, "products"), productData); alert('Produto adicionado!'); }
        productModal.classList.remove('flex');
        loadProducts();
    } catch (error) { console.error("Erro ao salvar: ", error); alert('Ocorreu um erro.'); }
});

window.editProduct = async id => {
    const docSnap = await getDoc(doc(db, "products", id));
    if (docSnap.exists()) {
        const product = docSnap.data();
        Object.keys(product).forEach(key => {
            const el = document.getElementById(`product-${key.toLowerCase()}`) || document.getElementById(`is-${key.toLowerCase().replace('is','')}`);
            if (el) {
                if (el.type === 'checkbox') el.checked = product[key];
                else el.value = product[key];
            }
        });
        document.getElementById('product-id').value = id;
        modalTitle.textContent = 'Editar Produto';
        productModal.classList.add('flex');
    }
};

window.deleteProduct = async id => {
    if (confirm('Tem certeza que deseja excluir este produto?')) { await deleteDoc(doc(db, "products", id)); alert('Produto excluído!'); loadProducts(); }
};

backupBtn.addEventListener('click', async () => {
    const productsData = {};
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach(doc => { productsData[doc.id] = doc.data(); });
    const jsonString = JSON.stringify(productsData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backup_yoshis_bar_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url); alert('Backup gerado!');
});