import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- VARIÁVEIS GLOBAIS E CONFIGURAÇÕES ---
let allProducts = {};
let cart = [];
let navigationStack = ['home-screen'];
let currentCategory = null;
let customerName = '';
let customerAddress = '';
let paymentMethod = null;
let couponApplied = false;
let discountPercentage = 0;
let appliedCouponCode = '';

const FRETE = 1.00;
const WHATSAPP_NUMBER = '5543984399533';
const COUPONS = {
    'BEBIDA10': 0.10, // 10% de desconto
    'YOSHI20': 0.20,   // 20% de desconto
};

// --- FUNÇÕES DE RENDERIZAÇÃO E DADOS ---
async function fetchAndRenderData() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach(doc => { allProducts[doc.id] = { id: doc.id, ...doc.data() }; });
        renderPopularItems();
        renderPromotionBanners();
    } catch (error) { console.error("Erro ao buscar produtos:", error); }
}

function renderPromotionBanners() { /* ... (código existente sem alterações) ... */ }
function renderProduct(product) { /* ... (código existente sem alterações) ... */ }
function renderPopularItems() { /* ... (código existente sem alterações) ... */ }

// --- NAVEGAÇÃO E TELAS ---
window.navigateTo = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
    if (navigationStack[navigationStack.length - 1] !== screenId) navigationStack.push(screenId);
    window.scrollTo(0, 0);
};
window.goBack = function() { /* ... (código existente sem alterações) ... */ };
window.showCategory = function(category) { /* ... (código existente sem alterações) ... */ };
window.showProduct = function(productId) { /* ... (código existente sem alterações) ... */ };

// --- LÓGICA DO CARRINHO (COMPLETA) ---
window.updateProductQuantity = function(productId, change) { /* ... (código existente sem alterações) ... */ };
window.addToCart = function(productId) { /* ... (código existente sem alterações) ... */ };

window.updateCartItemQuantity = function(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity > allProducts[item.id].stock) {
            alert(`Desculpe, temos apenas ${allProducts[item.id].stock} em estoque.`);
            item.quantity = allProducts[item.id].stock;
        }
        if (item.quantity <= 0) {
            cart = cart.filter(cartItem => cartItem.id !== productId);
        }
    }
    renderCart();
};

window.clearCart = function() {
    cart = [];
    couponApplied = false;
    discountPercentage = 0;
    appliedCouponCode = '';
    document.getElementById('show-coupon-btn').classList.remove('hidden');
    document.getElementById('coupon-input-container').classList.add('hidden');
    document.getElementById('coupon-input').value = '';
    document.getElementById('applied-coupon-info').classList.add('hidden');
    renderCart();
};

function renderCart() {
    const container = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    const emptyMsg = document.getElementById('empty-cart-message');
    if (cart.length === 0) { container.innerHTML = ''; summary.classList.add('hidden'); emptyMsg.classList.remove('hidden'); return; }
    summary.classList.remove('hidden'); emptyMsg.classList.add('hidden');
    container.innerHTML = cart.map(item => {
        const product = allProducts[item.id];
        return `<div class="flex items-center"><img src="${product.image}" class="w-16 h-16 object-contain rounded-lg bg-gray-100 p-1 mr-4"><div class="flex-1"><p class="font-semibold">${product.name}</p><p class="text-gray-500">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p></div><div class="flex items-center justify-between bg-gray-100 rounded-lg p-1"><button onclick="window.updateCartItemQuantity('${item.id}', -1)" class="w-8 h-8 text-xl font-bold text-yellow-500">-</button><span class="text-lg font-bold mx-2">${item.quantity}</span><button onclick="window.updateCartItemQuantity('${item.id}', 1)" class="w-8 h-8 text-xl font-bold text-yellow-500">+</button></div></div>`;
    }).join('');
    let subtotal = cart.reduce((acc, item) => acc + (allProducts[item.id].price * item.quantity), 0);
    let totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
    const discountAmount = subtotal * discountPercentage;
    const total = subtotal - discountAmount + FRETE;
    document.getElementById('cart-summary-quantity').textContent = `${totalQuantity} ${totalQuantity > 1 ? 'produtos' : 'produto'}`;
    document.getElementById('cart-summary-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    const discountSummaryEl = document.getElementById('discount-summary');
    if (couponApplied) {
        document.getElementById('discount-amount').textContent = `- R$ ${discountAmount.toFixed(2).replace('.', ',')}`;
        discountSummaryEl.classList.remove('hidden');
        discountSummaryEl.classList.add('flex');
    } else {
        discountSummaryEl.classList.add('hidden');
    }
    document.getElementById('frete-value').textContent = `R$ ${FRETE.toFixed(2).replace('.', ',')}`;
    document.getElementById('cart-summary-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('payment-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// --- LÓGICA DE CUPOM ---
window.showCouponInput = function() {
    document.getElementById('show-coupon-btn').classList.add('hidden');
    document.getElementById('coupon-input-container').classList.remove('hidden');
};

window.applyCoupon = function() {
    if (couponApplied) { alert('Um cupom já foi aplicado.'); return; }
    if (cart.length === 0) { alert('Adicione itens ao carrinho para aplicar um cupom.'); return; }
    const input = document.getElementById('coupon-input');
    const code = input.value.toUpperCase().trim();
    if (COUPONS[code]) {
        couponApplied = true;
        discountPercentage = COUPONS[code];
        appliedCouponCode = code;
        document.getElementById('coupon-input-container').classList.add('hidden');
        const appliedInfo = document.getElementById('applied-coupon-info');
        appliedInfo.innerHTML = `<span>Cupom: ${appliedCouponCode}</span><span class="text-green-600 font-bold">-${discountPercentage * 100}%</span>`;
        appliedInfo.classList.remove('hidden');
        renderCart();
    } else { alert('Cupom inválido ou expirado.'); }
};

// --- LÓGICA DE PAGAMENTO E FINALIZAÇÃO ---
window.selectPayment = function(method) {
    paymentMethod = method;
    const options = { pix: document.getElementById('payment-pix'), cash: document.getElementById('payment-cash') };
    const details = { pix: document.getElementById('pix-details'), cash: document.getElementById('cash-details') };
    for (const key in options) {
        options[key].querySelector('.border-2').classList.toggle('border-yellow-400', key === method);
        options[key].querySelector('.bg-yellow-400').classList.toggle('hidden', key !== method);
        details[key].classList.toggle('hidden', key !== method);
    }
};

window.finalizeOrder = function() {
    if (!customerName || !customerAddress) { alert('Por favor, defina seu nome e endereço para entrega.'); window.openUserDetailsModal(); return; }
    if (!paymentMethod) { alert('Por favor, selecione uma forma de pagamento.'); return; }
    
    let subtotal = cart.reduce((acc, item) => acc + (allProducts[item.id].price * item.quantity), 0);
    const discountAmount = subtotal * discountPercentage;
    const total = subtotal - discountAmount + FRETE;
    
    let orderText = `*--- NOVO PEDIDO YOSHI'S BAR ---*\n\n*Cliente:* ${customerName}\n*Endereço:* ${customerAddress}\n\n*Itens:*\n`;
    cart.forEach(item => { const p = allProducts[item.id]; orderText += `${item.quantity}x ${p.name} - R$ ${(p.price * item.quantity).toFixed(2).replace('.', ',')}\n`; });
    
    orderText += `\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (couponApplied) orderText += `\n*Cupom (${appliedCouponCode}):* - R$ ${discountAmount.toFixed(2).replace('.', ',')}`;
    orderText += `\n*Frete:* R$ ${FRETE.toFixed(2).replace('.', ',')}\n*Total:* R$ ${total.toFixed(2).replace('.', ',')}\n\n*Pagamento:*\n`;
    
    if (paymentMethod === 'pix') {
        orderText += 'PIX (pagamento a ser confirmado)';
    } else {
        orderText += 'Dinheiro\n';
        const changeValue = document.getElementById('change').value;
        const noChange = document.getElementById('no-change').checked;
        if (noChange) orderText += 'Não precisa de troco.';
        else if (changeValue) orderText += `Levar troco para R$ ${parseFloat(changeValue).toFixed(2).replace('.', ',')}`;
    }
    
    const instructions = document.getElementById('instructions').value;
    if (instructions) orderText += `\n\n*Instruções:* ${instructions}`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`, '_blank');
};

// --- DADOS DO USUÁRIO ---
window.openUserDetailsModal = () => document.getElementById('user-details-modal').style.display = 'flex';
window.saveUserDetails = () => { /* ... (código existente sem alterações) ... */ };

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderData();
    renderCart();
    setTimeout(() => { document.getElementById('loading-screen').style.display = 'none'; if (!customerName) window.openUserDetailsModal(); }, 2000);
});
