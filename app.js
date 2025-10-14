import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- ESTADO DA APLICAÇÃO ---
const AppState = {
    allProducts: {},
    cart: [],
    navigationStack: ['home-screen'],
    customerName: '',
    customerAddress: '',
    paymentMethod: null,
    coupon: {
        applied: false,
        id: null,
        code: '',
        discount: 0,
    },
    config: {
        frete: 1.00,
        whatsappNumber: '5543984399533',
    }
};

// --- FUNÇÕES DE RENDERIZAÇÃO E DADOS ---
async function fetchAndRenderData() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach(doc => { AppState.allProducts[doc.id] = { id: doc.id, ...doc.data() }; });
        renderHomePage();
    } catch (error) { console.error("Erro ao buscar produtos:", error); }
}

function renderHomePage() {
    // Renderiza Banners de Promoção
    const bannerContainer = document.getElementById('banner-scroll');
    const promotions = Object.values(AppState.allProducts).filter(p => p.isPromotion && p.promotionUrl);
    if (promotions.length > 0) {
        bannerContainer.innerHTML = promotions.map(p => `<div class="flex-shrink-0 w-full rounded-lg snap-center cursor-pointer" onclick="App.showProduct('${p.id}')"><img src="${p.promotionUrl}" alt="${p.name}" class="w-full h-auto object-cover rounded-lg"></div>`).join('');
    } else {
        bannerContainer.innerHTML = `<div class="flex-shrink-0 w-full rounded-lg snap-center"><img src="https://cervejaitaipava.com.br/wp-content/uploads/2024/06/CERVE2145-PG008_ITAIPAVA_KV_PROMO_TAMPINHA_FAMILIA_ITAIPAVA_HORIZONTAL_RGB_NOVA-2048x1152.jpg" alt="Banner padrão" class="w-full h-auto object-cover rounded-lg"></div>`;
    }
    // Renderiza Itens Populares
    const popularsContainer = document.getElementById('popular-items');
    const populars = Object.values(AppState.allProducts).filter(p => p.isPopular);
    popularsContainer.innerHTML = populars.length > 0 ? populars.map(renderProductCard).join('') : `<p class="text-gray-500">Nenhum item popular.</p>`;
}

function renderProductCard(product) {
    const isSoldOut = product.stock <= 0;
    return `<div onclick="${isSoldOut ? '' : `App.showProduct('${product.id}')`}" class="text-center w-28 flex-shrink-0 cursor-pointer ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}"><div class="relative"><img src="${product.image}" alt="${product.name}" class="w-full h-24 object-contain rounded-lg bg-gray-100 p-2 ${isSoldOut ? 'filter grayscale' : ''}">${isSoldOut ? '<span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">ESGOTADO</span>' : ''}</div><p class="text-xs font-semibold mt-2 truncate">${product.name}</p><p class="text-sm font-bold">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p></div>`;
}

// --- OBJETO GLOBAL DE FUNÇÕES (PARA `onclick`) ---
window.App = {
    // NAVEGAÇÃO
    navigateTo: (screenId) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId)?.classList.add('active');
        const stack = AppState.navigationStack;
        if (stack[stack.length - 1] !== screenId) stack.push(screenId);
        window.scrollTo(0, 0);
    },
    goBack: () => {
        if (AppState.navigationStack.length > 1) {
            AppState.navigationStack.pop();
            const lastScreen = AppState.navigationStack[AppState.navigationStack.length - 1];
            window.App.navigateTo(lastScreen);
        }
    },

    // TELAS
    showCategory: (category) => {
        AppState.currentCategory = category;
        const mainContent = document.getElementById('category-main-content');
        const filtered = Object.values(AppState.allProducts).filter(p => p.category === category);
        mainContent.innerHTML = `<main class="p-4"><h2 class="font-bold text-lg mb-4">${category.charAt(0).toUpperCase() + category.slice(1)}</h2><div class="grid grid-cols-2 gap-4">${filtered.map(renderProductCard).join('')}</div></main>`;
        window.App.navigateTo('category-screen');
    },
    showProduct: (productId) => {
        const product = AppState.allProducts[productId];
        if (!product) return;
        document.getElementById('product-screen-header').innerHTML = `<button class="go-back-btn"><i class="fa fa-arrow-left text-xl"></i></button>`;
        document.getElementById('product-details').innerHTML = `<div class="flex justify-center mb-4"><img src="${product.image}" alt="${product.name}" class="w-48 h-48 object-contain"></div><h2 class="text-2xl font-bold">${product.name}</h2><p class="text-sm text-gray-500 mt-2">Estoque: ${product.stock} unidades</p><p class="text-3xl font-bold my-4">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p><div class="flex items-center justify-between bg-gray-100 rounded-lg p-2"><button class="update-quantity-btn" data-change="-1">-</button><span id="product-quantity-${productId}" class="text-2xl font-bold">1</span><button class="update-quantity-btn" data-change="1">+</button></div>`;
        document.getElementById('product-footer-container').innerHTML = `<button class="add-to-cart-btn w-full bg-yellow-400 text-black font-bold py-3 rounded-lg flex justify-between items-center px-4"><span>ADICIONAR</span><span id="product-subtotal-${productId}">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</span></button>`;
        window.App.navigateTo('product-screen');
    },

    // DADOS DO USUÁRIO
    openUserDetailsModal: () => document.getElementById('user-details-modal').style.display = 'flex',
    saveUserDetails: () => {
        const nameEl = document.getElementById('customer-name');
        const addressEl = document.getElementById('customer-address');
        if (!nameEl.value.trim() || !addressEl.value.trim()) { alert('Preencha nome e endereço.'); return; }
        AppState.customerName = nameEl.value.trim();
        AppState.customerAddress = addressEl.value.trim();
        document.getElementById('header-address-container').innerHTML = `<p class="text-xs text-gray-400">Receber em</p><p class="font-semibold truncate">${AppState.customerAddress}</p>`;
        document.getElementById('user-details-modal').style.display = 'none';
    },

    // LÓGICA DO CARRINHO
    updateCartItemQuantity: (id, change) => {
        const item = AppState.cart.find(i => i.id === id);
        if (!item) return;
        item.quantity += change;
        if (item.quantity <= 0) AppState.cart = AppState.cart.filter(i => i.id !== id);
        window.App.renderCart();
    },
    clearCart: () => {
        AppState.cart = [];
        Object.assign(AppState.coupon, { applied: false, id: null, code: '', discount: 0 }); // Reseta o cupom
        window.App.renderCart();
    },
    renderCart: () => {
        const { cart, allProducts, coupon, config } = AppState;
        // ... (lógica de renderização do carrinho completa, incluindo cupom)
        const cartItemsEl = document.getElementById('cart-items');
        const cartSummaryEl = document.getElementById('cart-summary');
        const emptyMsgEl = document.getElementById('empty-cart-message');

        if (cart.length === 0) {
            cartItemsEl.innerHTML = '';
            cartSummaryEl.classList.add('hidden');
            emptyMsgEl.classList.remove('hidden');
            return;
        }

        cartSummaryEl.classList.remove('hidden');
        emptyMsgEl.classList.add('hidden');

        cartItemsEl.innerHTML = cart.map(item => {
            const product = allProducts[item.id];
            return `<div class="flex items-center"><img src="${product.image}" class="w-16 h-16 object-contain rounded-lg bg-gray-100 p-1 mr-4"><div class="flex-1"><p class="font-semibold">${product.name}</p><p class="text-gray-500">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p></div><div class="flex items-center justify-between bg-gray-100 rounded-lg p-1"><button onclick="App.updateCartItemQuantity('${item.id}', -1)" class="w-8 h-8 text-xl font-bold text-yellow-500">-</button><span class="text-lg font-bold mx-2">${item.quantity}</span><button onclick="App.updateCartItemQuantity('${item.id}', 1)" class="w-8 h-8 text-xl font-bold text-yellow-500">+</button></div></div>`;
        }).join('');

        const subtotal = cart.reduce((acc, item) => acc + (allProducts[item.id].price * item.quantity), 0);
        const discountAmount = subtotal * coupon.discount;
        const total = subtotal - discountAmount + config.frete;

        document.getElementById('cart-summary-quantity').textContent = `${cart.reduce((a, b) => a + b.quantity, 0)} produtos`;
        document.getElementById('cart-summary-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('frete-value').textContent = `R$ ${config.frete.toFixed(2).replace('.', ',')}`;
        document.getElementById('cart-summary-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        document.getElementById('payment-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        
        const discountEl = document.getElementById('discount-summary');
        if(coupon.applied){
            document.getElementById('discount-amount').textContent = `- R$ ${discountAmount.toFixed(2).replace('.',',')}`;
            discountEl.classList.remove('hidden');
            discountEl.classList.add('flex');
        } else {
            discountEl.classList.add('hidden');
        }
    },

    // CUPOM E PAGAMENTO
    applyCoupon: async () => {
        const code = document.getElementById('coupon-input').value.toUpperCase().trim();
        if (!code) return;
        const q = query(collection(db, "coupons"), where("code", "==", code));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { alert('Cupom inválido.'); return; }
        const couponDoc = snapshot.docs[0];
        if (couponDoc.data().usesLeft <= 0) { alert('Este cupom já esgotou.'); return; }

        Object.assign(AppState.coupon, {
            applied: true,
            id: couponDoc.id,
            code: couponDoc.data().code,
            discount: couponDoc.data().discountPercentage / 100,
        });
        
        document.getElementById('coupon-input-container').classList.add('hidden');
        document.getElementById('applied-coupon-info').innerHTML = `<span>Cupom: ${AppState.coupon.code}</span><span class="text-green-600 font-bold">-${AppState.coupon.discount * 100}%</span>`;
        document.getElementById('applied-coupon-info').classList.remove('hidden');
        window.App.renderCart();
    },
    selectPayment: (method) => {
        AppState.paymentMethod = method;
        document.querySelectorAll('.payment-option').forEach(el => {
            const isSelected = el.id.includes(method);
            el.querySelector('.border-2').classList.toggle('border-yellow-400', isSelected);
            el.querySelector('.bg-yellow-400').classList.toggle('hidden', !isSelected);
        });
        document.getElementById('pix-details').classList.toggle('hidden', method !== 'pix');
        document.getElementById('cash-details').classList.toggle('hidden', method !== 'cash');
    },
    finalizeOrder: async () => {
        const { customerName, customerAddress, paymentMethod, cart, coupon, config, allProducts } = AppState;
        if (!customerName || !customerAddress) { alert('Defina seu nome e endereço.'); window.App.openUserDetailsModal(); return; }
        if (!paymentMethod) { alert('Selecione uma forma de pagamento.'); return; }

        if (coupon.applied && coupon.id) {
            await updateDoc(doc(db, "coupons", coupon.id), { usesLeft: increment(-1) });
        }

        const subtotal = cart.reduce((acc, item) => acc + (allProducts[item.id].price * item.quantity), 0);
        const discountAmount = subtotal * coupon.discount;
        const total = subtotal - discountAmount + config.frete;

        let orderText = `*NOVO PEDIDO YOSHI'S BAR*\n\n*Cliente:* ${customerName}\n*Endereço:* ${customerAddress}\n\n*Itens:*\n`;
        cart.forEach(item => { const p = allProducts[item.id]; orderText += `${item.quantity}x ${p.name} - R$ ${(p.price * item.quantity).toFixed(2).replace('.', ',')}\n`; });
        orderText += `\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        if (coupon.applied) orderText += `\n*Cupom (${coupon.code}):* - R$ ${discountAmount.toFixed(2).replace('.', ',')}`;
        orderText += `\n*Frete:* R$ ${config.frete.toFixed(2).replace('.', ',')}\n*Total:* R$ ${total.toFixed(2).replace('.', ',')}\n\n*Pagamento:* ${paymentMethod === 'pix' ? 'PIX' : 'Dinheiro'}`;
        
        window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(orderText)}`, '_blank');
    }
};

// --- INICIALIZAÇÃO E EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicia o app
    fetchAndRenderData();
    window.App.renderCart();
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        if (!AppState.customerName) window.App.openUserDetailsModal();
    }, 1500);

    // Listeners que não usam onclick
    document.getElementById('save-user-details-btn').addEventListener('click', window.App.saveUserDetails);
    document.getElementById('header-address-clickable').addEventListener('click', window.App.openUserDetailsModal);
    document.querySelectorAll('.go-back-btn').forEach(btn => btn.addEventListener('click', window.App.goBack));
    document.querySelectorAll('.category-btn').forEach(btn => btn.addEventListener('click', () => window.App.showCategory(btn.dataset.category)));
    document.getElementById('clear-cart-btn').addEventListener('click', window.App.clearCart);
    document.getElementById('add-more-products-btn').addEventListener('click', () => window.App.navigateTo('home-screen'));
    document.getElementById('show-coupon-btn').addEventListener('click', () => document.getElementById('coupon-input-container').classList.remove('hidden'));
    document.getElementById('apply-coupon-btn').addEventListener('click', window.App.applyCoupon);
    document.getElementById('go-to-payment-btn').addEventListener('click', () => window.App.navigateTo('payment-screen'));
    document.getElementById('finalize-order-btn').addEventListener('click', window.App.finalizeOrder);
    document.querySelectorAll('.payment-option').forEach(el => el.addEventListener('click', () => window.App.selectPayment(el.id.includes('pix') ? 'pix' : 'cash')));

    // Listeners dinâmicos (para elementos que são criados depois)
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart-btn')) {
            const productId = document.querySelector('[id^="product-quantity-"]').id.split('-')[2];
            const quantity = parseInt(document.getElementById(`product-quantity-${productId}`).textContent);
            const existing = AppState.cart.find(item => item.id === productId);
            if (existing) { existing.quantity += quantity; } else { AppState.cart.push({ id: productId, quantity }); }
            window.App.renderCart();
            window.App.navigateTo('cart-screen');
        }
        if (e.target.closest('.update-quantity-btn')) {
            const productId = document.querySelector('[id^="product-quantity-"]').id.split('-')[2];
            const change = parseInt(e.target.closest('.update-quantity-btn').dataset.change);
            const quantityEl = document.getElementById(`product-quantity-${productId}`);
            let quantity = parseInt(quantityEl.textContent) + change;
            if (quantity < 1) quantity = 1;
            const maxStock = AppState.allProducts[productId].stock;
            if (quantity > maxStock) { alert(`Desculpe, temos apenas ${maxStock} em estoque.`); quantity = maxStock; }
            quantityEl.textContent = quantity;
            document.getElementById(`product-subtotal-${productId}`).textContent = `R$ ${(AppState.allProducts[productId].price * quantity).toFixed(2).replace('.', ',')}`;
        }
    });
});
