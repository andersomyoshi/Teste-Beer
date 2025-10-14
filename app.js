// Importa o banco de dados do seu arquivo de configuração
import { db } from './firebase-config.js';
// Importa as funções necessárias do Firestore SDK
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- VARIÁVEIS GLOBAIS ---
let allProducts = {}; // Armazenará todos os produtos carregados do Firebase
let cart = [];
let navigationStack = ['home-screen'];
let currentCategory = null;
let customerName = '';
let customerAddress = '';
const FRETE = 1.00; // Defina seu valor de frete
const WHATSAPP_NUMBER = '5543984399533'; // Seu número do WhatsApp

// --- LÓGICA PRINCIPAL ---

// Função para buscar os produtos do Firebase
async function fetchProducts() {
    const loadingMessage = '<p class="text-gray-500">Carregando produtos...</p>';
    document.getElementById('popular-items').innerHTML = loadingMessage;
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach((doc) => {
            allProducts[doc.id] = { id: doc.id, ...doc.data() };
        });

        // Após carregar os produtos, renderiza os componentes da página inicial
        renderPopularItems();
        // Você pode adicionar renderBanners() aqui se criar essa coleção no Firebase
    } catch (error) {
        console.error("Erro ao buscar produtos: ", error);
        document.getElementById('popular-items').innerHTML = '<p class="text-red-500">Erro ao carregar produtos.</p>';
    }
}

// Renderiza os itens marcados como 'Populares'
function renderPopularItems() {
    const container = document.getElementById('popular-items');
    container.innerHTML = '';
    const popularProducts = Object.values(allProducts).filter(p => p.isPopular);

    if (popularProducts.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Nenhum produto popular no momento.</p>';
        return;
    }

    popularProducts.forEach(product => {
        const isSoldOut = product.stock <= 0;
        const productHTML = `
            <div class="text-center w-28 flex-shrink-0 cursor-pointer ${isSoldOut ? 'opacity-50' : ''}" ${!isSoldOut ? `onclick="showProduct('${product.id}')"` : ''}>
                <div class="relative">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-24 object-contain rounded-lg bg-gray-100 p-2 ${isSoldOut ? 'filter grayscale' : ''}">
                    ${isSoldOut ? '<span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">ESGOTADO</span>' : ''}
                </div>
                <p class="text-xs font-semibold mt-2 truncate">${product.name}</p>
                <p class="text-sm font-bold">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p>
            </div>
        `;
        container.innerHTML += productHTML;
    });
}

// TODO: Adicionar o resto da lógica do app.js aqui
// (showCategory, showProduct, addToCart, renderCart, finalizeOrder, etc.)
// O código é extenso, então vou focar nas partes essenciais para o funcionamento inicial.
// O resto da sua lógica de carrinho e navegação pode ser adaptada e colada aqui.

// --- NAVEGAÇÃO E EVENTOS ---

function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (navigationStack[navigationStack.length - 1] !== screenId) {
        navigationStack.push(screenId);
    }
    window.scrollTo(0, 0);
}

window.goBack = function() {
    if (navigationStack.length > 1) {
        navigationStack.pop();
        const lastScreen = navigationStack[navigationStack.length - 1];
        navigateTo(lastScreen);
    }
}

// Expondo funções para o onclick no HTML
window.showProduct = function(productId) {
    const product = allProducts[productId];
    if (!product) return;

    const detailsContainer = document.getElementById('product-details');
    // Adicionar a exibição do estoque
    detailsContainer.innerHTML = `
        <div class="flex justify-center mb-4">
            <img src="${product.image}" alt="${product.name}" class="w-48 h-48 object-contain">
        </div>
        <h2 class="text-2xl font-bold">${product.name}</h2>
        <p class="text-sm text-gray-500 mt-2">Estoque disponível: ${product.stock} unidades</p>
        <p class="text-3xl font-bold my-4">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p>
        
        <div class="flex items-center justify-between bg-gray-100 rounded-lg p-2">
            <button onclick="updateProductQuantity('${productId}', -1)" class="w-10 h-10 text-2xl font-bold text-yellow-500">-</button>
            <span id="product-quantity-${productId}" class="text-2xl font-bold">1</span>
            <button onclick="updateProductQuantity('${productId}', 1)" class="w-10 h-10 text-2xl font-bold text-yellow-500">+</button>
        </div>
        
        <footer class="p-4 border-t sticky bottom-0 bg-white" id="product-footer">
            <button id="add-to-cart-btn-${productId}" onclick="addToCart('${productId}')" class="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg flex justify-between items-center px-4">
                <span>ADICIONAR</span>
                <span id="product-subtotal-${productId}">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</span>
            </button>
        </footer>
    `;
    navigateTo('product-screen');
}


// Adiciona ouvintes de eventos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os produtos do Firebase assim que a página abre
    fetchProducts();
    
    // Configura os botões de categoria
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            // A função showCategory precisa ser implementada aqui
            alert(`Navegando para a categoria: ${category}`);
            // showCategory(category);
        });
    });

    // Configura outros botões
    document.querySelectorAll('.go-back-btn').forEach(btn => btn.addEventListener('click', goBack));
    
    // Esconde a tela de carregamento e mostra o modal
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        if (!customerName && !customerAddress) {
             document.getElementById('user-details-modal').style.display = 'flex';
        }
    }, 2000);
});