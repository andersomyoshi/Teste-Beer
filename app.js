import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- VARIÁVEIS GLOBAIS ---
let allProducts = {};
let cart = [];
let navigationStack = ['home-screen'];
let currentCategory = null;
let customerName = '';
let customerAddress = '';
const FRETE = 1.00;
const WHATSAPP_NUMBER = '5543984399533';

// --- FUNÇÕES DE RENDERIZAÇÃO E DADOS ---
async function fetchAndRenderData() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach(doc => { allProducts[doc.id] = { id: doc.id, ...doc.data() }; });
        renderPopularItems();
        renderPromotionBanners(); // Nova função para banners
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
    }
}

function renderPromotionBanners() {
    const container = document.getElementById('banner-scroll');
    container.innerHTML = '';
    const promotions = Object.values(allProducts).filter(p => p.isPromotion && p.promotionUrl);
    if (promotions.length > 0) {
        container.innerHTML = promotions.map(p => `
            <div class="flex-shrink-0 w-full rounded-lg snap-center cursor-pointer" onclick="window.showProduct('${p.id}')">
                <img src="${p.promotionUrl}" alt="Banner de ${p.name}" class="w-full h-auto object-cover rounded-lg">
            </div>
        `).join('');
    }
    // Adicionar um banner padrão caso não haja promoções
    else {
        container.innerHTML = `
            <div class="flex-shrink-0 w-full rounded-lg snap-center">
                <img src="https://cervejaitaipava.com.br/wp-content/uploads/2024/06/CERVE2145-PG008_ITAIPAVA_KV_PROMO_TAMPINHA_FAMILIA_ITAIPAVA_HORIZONTAL_RGB_NOVA-2048x1152.jpg" alt="Banner padrão" class="w-full h-auto object-cover rounded-lg">
            </div>`;
    }
}

function renderProduct(product) {
    const isSoldOut = product.stock <= 0;
    return `
        <div onclick="${isSoldOut ? '' : `window.showProduct('${product.id}')`}" class="cursor-pointer product-card ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}" data-brand="${product.brand}">
            <div class="relative bg-gray-100 rounded-lg p-2 flex items-center justify-center h-32">
                <img src="${product.image}" alt="${product.name}" class="max-h-full max-w-full object-contain ${isSoldOut ? 'filter grayscale' : ''}">
                ${isSoldOut ? '<span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">ESGOTADO</span>' : ''}
            </div>
            <p class="font-semibold text-sm mt-2">${product.name}</p>
            <p class="font-bold text-gray-800">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p>
        </div>
    `;
}

function renderPopularItems() {
    const container = document.getElementById('popular-items');
    container.innerHTML = '';
    const populars = Object.values(allProducts).filter(p => p.isPopular);
    if (populars.length > 0) {
        container.innerHTML = populars.map(p => renderProduct(p).replace('product-card', 'text-center w-28 flex-shrink-0')).join('');
    } else {
        container.innerHTML = '<p class="text-gray-500">Nenhum item popular no momento.</p>';
    }
}

// O restante do seu arquivo app.js continua igual...
// (funções de navegação, carrinho, etc.)
// --- NAVEGAÇÃO E TELAS ---
window.navigateTo = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
    if (navigationStack[navigationStack.length - 1] !== screenId) navigationStack.push(screenId);
    window.scrollTo(0, 0);
};
window.goBack = function() {
    if (navigationStack.length > 1) { navigationStack.pop(); window.navigateTo(navigationStack[navigationStack.length - 1]); }
};
window.showCategory = function(category) {
    currentCategory = category;
    const mainContent = document.getElementById('category-main-content');
    const filtered = Object.values(allProducts).filter(p => p.category === category);
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
    let contentHTML = `<main class="p-4"><h2 class="font-bold text-lg mb-4">${categoryTitle}</h2>`;
    if (category === 'cervejas') {
        contentHTML += `<h3 class="font-bold text-gray-500 text-sm mb-3">AS CONSAGRADAS</h3><div class="flex overflow-x-auto gap-3 mb-8 no-scrollbar pb-2">${Object.values(allProducts).filter(p=>p.isConsagrada).map(p=>`<div onclick="window.showProduct('${p.id}')" data-brand="${p.brand}" class="brand-button border rounded-lg flex-shrink-0 w-28 h-20 cursor-pointer bg-center bg-contain bg-no-repeat p-1" style="background-image: url('${p.image}')"></div>`).join('')}</div>`;
        contentHTML += `<h3 class="font-bold text-gray-500 text-sm mb-3">AS PRESTIGIADAS</h3><div class="flex overflow-x-auto gap-3 mb-8 no-scrollbar pb-2">${Object.values(allProducts).filter(p=>p.isPrestigiada).map(p=>`<div onclick="window.showProduct('${p.id}')" data-brand="${p.brand}" class="brand-button border rounded-lg flex-shrink-0 w-28 h-20 cursor-pointer bg-center bg-contain bg-no-repeat p-1" style="background-image: url('${p.image}')"></div>`).join('')}</div>`;
        contentHTML += `<h3 class="font-bold text-gray-500 text-sm mb-3">TODAS AS CERVEJAS</h3>`;
    }
    contentHTML += '<div class="grid grid-cols-2 gap-4" id="category-products-grid">';
    contentHTML += filtered.length > 0 ? filtered.map(renderProduct).join('') : `<p class="col-span-2 text-center text-gray-500 py-10">Nenhum produto aqui.</p>`;
    contentHTML += '</div></main>';
    mainContent.innerHTML = contentHTML;
    window.navigateTo('category-screen');
};
window.showProduct = function(productId) {
    const product = allProducts[productId];
    if (!product) return;
    document.getElementById('product-screen-header').innerHTML = `<button onclick="window.goBack()"><i class="fa fa-arrow-left text-xl"></i></button>`;
    document.getElementById('product-details').innerHTML = `<div class="flex justify-center mb-4"><img src="${product.image}" alt="${product.name}" class="w-48 h-48 object-contain"></div><h2 class="text-2xl font-bold">${product.name}</h2><p class="text-sm text-gray-500 mt-2">Estoque: ${product.stock} unidades</p><p class="text-3xl font-bold my-4">R$ ${Number(product.price).toFixed(2).replace('.',',')}</p><div class="flex items-center justify-between bg-gray-100 rounded-lg p-2"><button onclick="window.updateProductQuantity('${productId}', -1)" class="w-10 h-10 text-2xl font-bold text-yellow-500">-</button><span id="product-quantity-${productId}" class="text-2xl font-bold">1</span><button onclick="window.updateProductQuantity('${productId}', 1)" class="w-10 h-10 text-2xl font-bold text-yellow-500">+</button></div><footer class="p-4 border-t fixed bottom-0 bg-white w-full max-w-md mx-auto"><button onclick="window.addToCart('${productId}')" class="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg flex justify-between items-center px-4"><span>ADICIONAR</span><span id="product-subtotal-${productId}">R$ ${Number(product.price).toFixed(2).replace('.',',')}</span></button></footer>`;
    window.navigateTo('product-screen');
};
window.updateProductQuantity = function(productId, change) {
    const quantityEl = document.getElementById(`product-quantity-${productId}`);
    let quantity = parseInt(quantityEl.textContent) + change;
    if (quantity < 1) quantity = 1;
    const maxStock = allProducts[productId].stock;
    if (quantity > maxStock) { alert(`Desculpe, temos apenas ${maxStock} em estoque.`); quantity = maxStock; }
    quantityEl.textContent = quantity;
    document.getElementById(`product-subtotal-${productId}`).textContent = `R$ ${(allProducts[productId].price * quantity).toFixed(2).replace('.', ',')}`;
};
window.addToCart = function(productId) {
    const quantity = parseInt(document.getElementById(`product-quantity-${productId}`).textContent);
    const existing = cart.find(item => item.id === productId);
    if (existing) { existing.quantity += quantity; } else { cart.push({ id: productId, quantity }); }
    renderCart();
    window.navigateTo('cart-screen');
};
window.clearCart = function() { cart = []; renderCart(); };
function renderCart() {
    const container = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    const emptyMsg = document.getElementById('empty-cart-message');
    if (cart.length === 0) { container.innerHTML = ''; summary.classList.add('hidden'); emptyMsg.classList.remove('hidden'); return; }
    summary.classList.remove('hidden'); emptyMsg.classList.add('hidden');
    container.innerHTML = cart.map(item => { const product = allProducts[item.id]; return `<div class="flex items-center"><img src="${product.image}" class="w-16 h-16 object-contain rounded-lg bg-gray-100 p-1 mr-4"><div class="flex-1"><p class="font-semibold">${product.name}</p><p class="text-gray-500">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p></div><div class="flex items-center justify-between bg-gray-100 rounded-lg p-1"><span>${item.quantity} un.</span></div></div>`; }).join('');
    let subtotal = cart.reduce((acc, item) => acc + (allProducts[item.id].price * item.quantity), 0);
    let totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
    let total = subtotal + FRETE;
    document.getElementById('cart-summary-quantity').textContent = `${totalQuantity} ${totalQuantity > 1 ? 'produtos' : 'produto'}`;
    document.getElementById('cart-summary-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('frete-value').textContent = `R$ ${FRETE.toFixed(2).replace('.', ',')}`;
    document.getElementById('cart-summary-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}
window.finalizeOrder = function() {
    if (!customerName || !customerAddress) { alert('Por favor, defina seu nome e endereço para entrega.'); window.openUserDetailsModal(); return; }
    let subtotal = cart.reduce((acc, item) => acc + (allProducts[item.id].price * item.quantity), 0);
    let total = subtotal + FRETE;
    let orderText = `*--- NOVO PEDIDO YOSHI'S BAR ---*\n\n*Cliente:* ${customerName}\n*Endereço:* ${customerAddress}\n\n*Itens:*\n`;
    cart.forEach(item => { const product = allProducts[item.id]; orderText += `${item.quantity}x ${product.name} - R$ ${(product.price * item.quantity).toFixed(2).replace('.', ',')}\n`; });
    orderText += `\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n*Frete:* R$ ${FRETE.toFixed(2).replace('.', ',')}\n*Total:* R$ ${total.toFixed(2).replace('.', ',')}\n\n*Pedido gerado via catálogo online.*`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`, '_blank');
};
window.openUserDetailsModal = () => document.getElementById('user-details-modal').style.display = 'flex';
window.saveUserDetails = () => {
    const nameInput = document.getElementById('customer-name');
    const addressInput = document.getElementById('customer-address');
    if (!nameInput.value.trim() || !addressInput.value.trim()) { alert('Por favor, preencha nome e endereço.'); return; }
    customerName = nameInput.value.trim();
    customerAddress = addressInput.value.trim();
    document.getElementById('header-address-container').innerHTML = `<p class="text-xs text-gray-400">Receber agora em</p><p class="font-semibold truncate">${customerAddress} <i class="fa fa-pen-to-square text-xs ml-1"></i></p>`;
    document.getElementById('user-details-modal').style.display = 'none';
};
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderData();
    renderCart();
    setTimeout(() => { document.getElementById('loading-screen').style.display = 'none'; if (!customerName) window.openUserDetailsModal(); }, 2000);
});
