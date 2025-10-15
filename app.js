// app.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, updateDoc, increment, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const AppState = {
    allProducts: {},
    cart: [],
    navigationStack: ['home-screen'],
    customerName: '',
    customerAddress: '',
    paymentMethod: null,
    coupon: { applied: false, id: null, code: '', discount: 0 },
    config: { frete: 1.00, whatsappNumber: '5543984399533' },
    bannerInterval: null
};

const App = {
    init: () => {
        window.App = App;
        App.attachListeners();
        App.fetchAndRenderData();
    },
    fetchAndRenderData: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            querySnapshot.forEach(d => { AppState.allProducts[d.id] = { id: d.id, ...d.data() }; });
            App.renderHomePage();
            App.renderCart();
            setTimeout(() => {
                const loadScreen = document.getElementById('loading-screen');
                if (loadScreen) loadScreen.style.display = 'none';
                if (!AppState.customerName) App.openUserDetailsModal();
            }, 1500);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        }
    },
    renderHomePage: () => {
        const popularsContainer = document.getElementById('popular-items');
        const populars = Object.values(AppState.allProducts).filter(p => p.isPopular);
        popularsContainer.innerHTML = populars.length > 0 ? populars.map(App.renderProductCard).join('') : `<p class="text-gray-500">Nenhum item popular.</p>`;
        App.startBannerAnimation();
    },
    startBannerAnimation: () => {
        const bannerContainer = document.getElementById('banner-scroll');
        const promotions = Object.values(AppState.allProducts).filter(p => p.isPromotion && p.promotionUrl);
        if (promotions.length > 0) {
            bannerContainer.innerHTML = promotions.map(p => `<div class="flex-shrink-0 w-full rounded-lg snap-center cursor-pointer" onclick="App.showProduct('${p.id}')"><img src="${p.promotionUrl}" alt="${p.name}" class="w-full h-auto object-cover rounded-lg"></div>`).join('');
        } else {
            bannerContainer.innerHTML = `<div class="flex-shrink-0 w-full rounded-lg snap-center"><img src="https://cervejaitaipava.com.br/wp-content/uploads/2024/06/CERVE2145-PG008_ITAIPAVA_KV_PROMO_TAMPINHA_FAMILIA_ITAIPAVA_HORIZONTAL_RGB_NOVA-2048x1152.jpg" alt="Banner" class="w-full h-auto object-cover rounded-lg"></div>`;
        }
        clearInterval(AppState.bannerInterval);
        if (bannerContainer.children.length > 1) {
            let current = 0;
            AppState.bannerInterval = setInterval(() => {
                current = (current + 1) % bannerContainer.children.length;
                bannerContainer.scrollTo({ left: bannerContainer.clientWidth * current, behavior: 'smooth' });
            }, 4000);
            ['touchstart', 'wheel'].forEach(evt => bannerContainer.addEventListener(evt, () => clearInterval(AppState.bannerInterval), { once: true }));
        }
    },
    renderProductCard: (product) => {
        const isSoldOut = (product.stock || 0) <= 0;
        return `<div onclick="${isSoldOut ? '' : `App.showProduct('${product.id}')`}" class="text-center w-28 flex-shrink-0 cursor-pointer ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}">
            <div class="relative">
                <img src="${product.image || ''}" alt="${product.name || ''}" class="w-full h-24 object-contain rounded-lg bg-gray-100 p-2 ${isSoldOut ? 'filter grayscale' : ''}">
                ${isSoldOut ? '<span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">ESGOTADO</span>' : ''}
            </div>
            <p class="text-xs font-semibold mt-2 truncate">${product.name || ''}</p>
            <p class="text-sm font-bold">R$ ${Number(product.price || 0).toFixed(2).replace('.', ',')}</p>
        </div>`;
    },
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
            App.navigateTo(AppState.navigationStack[AppState.navigationStack.length - 1]);
        }
    },
    showCategory: (category) => {
        const mainContent = document.getElementById('category-main-content');
        const filtered = Object.values(AppState.allProducts).filter(p => p.category === category);
        mainContent.innerHTML = `<main class="p-4"><h2 class="font-bold text-lg mb-4">${category.charAt(0).toUpperCase() + category.slice(1)}</h2><div class="grid grid-cols-2 gap-4">${filtered.map(App.renderProductCard).join('') || `<p class="col-span-2 text-center text-gray-500">Nenhum produto nesta categoria.</p>`}</div></main>`;
        App.navigateTo('category-screen');
    },
    showProduct: (productId) => {
        const product = AppState.allProducts[productId];
        if (!product) return;
        // IDes únicos para elementos de quantidade/subtotal
        const qId = `product-quantity-${productId}`;
        const subtotalId = `product-subtotal-${productId}`;

        document.getElementById('product-screen-header').innerHTML = `<button class="go-back-btn"><i class="fa fa-arrow-left text-xl"></i></button>`;
        document.getElementById('product-details').innerHTML = `
            <div class="flex justify-center mb-4"><img src="${product.image || ''}" alt="${product.name || ''}" class="w-48 h-48 object-contain"></div>
            <h2 class="text-2xl font-bold">${product.name || ''}</h2>
            <p class="text-sm text-gray-500 mt-2">Estoque: ${product.stock ?? 0} unidades</p>
            <p class="text-3xl font-bold my-4">R$ ${Number(product.price || 0).toFixed(2).replace('.', ',')}</p>
            <div class="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                <button class="update-quantity-btn" data-id="${productId}" data-change="-1">-</button>
                <span id="${qId}" class="text-2xl font-bold">1</span>
                <button class="update-quantity-btn" data-id="${productId}" data-change="1">+</button>
            </div>
        `;
        document.getElementById('product-footer-container').innerHTML = `
            <button class="add-to-cart-btn" data-id="${productId}">
                <span class="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg flex justify-between items-center px-4">
                    <span>ADICIONAR</span>
                    <span id="${subtotalId}">R$ ${Number(product.price || 0).toFixed(2).replace('.', ',')}</span>
                </span>
            </button>
        `;
        App.navigateTo('product-screen');
    },
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
    updateCartItemQuantity: (id, change) => {
        const item = AppState.cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) AppState.cart = AppState.cart.filter(i => i.id !== id);
        }
        App.renderCart();
    },
    clearCart: () => {
        AppState.cart = [];
        Object.assign(AppState.coupon, { applied: false, id: null, code: '', discount: 0 });
        App.renderCart();
    },
    renderCart: () => {
        const { cart, allProducts, coupon, config } = AppState;
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
            return `<div class="flex items-center">
                <img src="${product.image || ''}" class="w-16 h-16 object-contain rounded-lg bg-gray-100 p-1 mr-4">
                <div class="flex-1">
                    <p class="font-semibold">${product.name || ''}</p>
                    <p class="text-gray-500">R$ ${Number(product.price || 0).toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="flex items-center justify-between bg-gray-100 rounded-lg p-1">
                    <button onclick="App.updateCartItemQuantity('${item.id}', -1)" class="w-8 h-8 text-xl font-bold text-yellow-500">-</button>
                    <span class="text-lg font-bold mx-2">${item.quantity}</span>
                    <button onclick="App.updateCartItemQuantity('${item.id}', 1)" class="w-8 h-8 text-xl font-bold text-yellow-500">+</button>
                </div>
            </div>`;
        }).join('');

        const subtotal = cart.reduce((acc, item) => acc + ((allProducts[item.id]?.price || 0) * item.quantity), 0);
        const discountAmount = subtotal * (coupon.discount || 0);
        const total = subtotal - discountAmount + (config.frete || 0);

        document.getElementById('cart-summary-quantity').textContent = `${cart.reduce((a,b)=>a+b.quantity,0)} produtos`;
        document.getElementById('cart-summary-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('frete-value').textContent = `R$ ${config.frete.toFixed(2).replace('.', ',')}`;
        document.getElementById('cart-summary-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        document.getElementById('payment-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        const discountEl = document.getElementById('discount-summary');
        if (coupon.applied) {
            document.getElementById('discount-amount').textContent = `- R$ ${discountAmount.toFixed(2).replace('.',',')}`;
            discountEl.classList.remove('hidden');
            discountEl.classList.add('flex');
        } else {
            discountEl.classList.add('hidden');
        }
    },
    applyCoupon: async () => {
        const code = document.getElementById('coupon-input').value.toUpperCase().trim();
        if (!code) return;
        const q = query(collection(db, "coupons"), where("code", "==", code));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { alert('Cupom inválido.'); return; }
        const couponDoc = snapshot.docs[0];
        if (couponDoc.data().usesLeft <= 0) { alert('Este cupom já esgotou.'); return; }
        Object.assign(AppState.coupon, { applied: true, id: couponDoc.id, code: couponDoc.data().code, discount: couponDoc.data().discountPercentage / 100 });
        document.getElementById('coupon-input-container').classList.add('hidden');
        document.getElementById('applied-coupon-info').innerHTML = `<span>Cupom: ${AppState.coupon.code}</span><span class="text-green-600 font-bold">-${AppState.coupon.discount * 100}%</span>`;
        document.getElementById('applied-coupon-info').classList.remove('hidden');
        App.renderCart();
    },
    selectPayment: (method) => {
        AppState.paymentMethod = method;
        document.querySelectorAll('.payment-option').forEach(el => {
            const isSelected = el.id.includes(method);
            const borderEl = el.querySelector('.border-2');
            if (borderEl) borderEl.classList.toggle('border-yellow-400', isSelected);
            const bgIndicator = el.querySelector('.bg-yellow-400');
            if (bgIndicator) bgIndicator.classList.toggle('hidden', !isSelected);
        });
        document.getElementById('pix-details').classList.toggle('hidden', method !== 'pix');
        document.getElementById('cash-details').classList.toggle('hidden', method !== 'cash');
    },
    finalizeOrder: async () => {
        const { customerName, customerAddress, paymentMethod, cart, coupon, config, allProducts } = AppState;
        if (!customerName || !customerAddress) { alert('Defina seu nome e endereço.'); App.openUserDetailsModal(); return; }
        if (!paymentMethod) { alert('Selecione uma forma de pagamento.'); return; }
        if (cart.length === 0) { alert('Seu carrinho está vazio.'); return; }

        const subtotal = cart.reduce((acc, item) => acc + ((allProducts[item.id]?.price || 0) * item.quantity), 0);
        const discountAmount = subtotal * (coupon.discount || 0);
        const total = subtotal - discountAmount + (config.frete || 0);

        let orderText = `*NOVO PEDIDO YOSHI'S BAR*\n\n*Cliente:* ${customerName}\n*Endereço:* ${customerAddress}\n\n*Itens:*\n`;
        cart.forEach(item => {
            const p = allProducts[item.id];
            orderText += `${item.quantity}x ${p.name} - R$ ${( (p.price||0) * item.quantity).toFixed(2).replace('.', ',')}\n`;
        });
        orderText += `\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        if (coupon.applied) orderText += `\n*Cupom (${coupon.code}):* - R$ ${discountAmount.toFixed(2).replace('.', ',')}`;
        orderText += `\n*Frete:* R$ ${config.frete.toFixed(2).replace('.', ',')}\n*Total:* R$ ${total.toFixed(2).replace('.', ',')}\n\n*Pagamento:* ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`;

        if (paymentMethod === 'cash') {
            const changeValue = document.getElementById('change').value;
            const noChange = document.getElementById('no-change').checked;
            if (noChange) orderText += '\n(Não precisa de troco)';
            else if (changeValue) orderText += `\n*Levar troco para:* R$ ${parseFloat(changeValue).toFixed(2).replace('.', ',')}`;
        }

        const instructions = document.getElementById('instructions').value;
        if (instructions.trim()) orderText += `\n\n*Instruções:* ${instructions.trim()}`;

        window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(orderText)}`, '_blank');

        try {
            if (coupon.applied && coupon.id) { await updateDoc(doc(db, "coupons", coupon.id), { usesLeft: increment(-1) }); }
            const saleData = {
                timestamp: serverTimestamp(),
                customerName,
                items: cart.map(item => ({ id: item.id, name: allProducts[item.id].name, quantity: item.quantity, price: allProducts[item.id].price, cost: allProducts[item.id].cost || 0 })),
                totalValue: total,
                totalCost: cart.reduce((acc, item) => acc + ((allProducts[item.id].cost || 0) * item.quantity), 0)
            };
            await addDoc(collection(db, "sales"), saleData);
            const stockUpdates = cart.map(item => updateDoc(doc(db, "products", item.id), { stock: increment(-item.quantity) }));
            await Promise.all(stockUpdates);
            alert("Pedido enviado! Obrigado.");
        } catch (error) {
            console.error("Erro ao registrar a venda: ", error);
            alert("Seu pedido foi enviado, mas tivemos um problema ao atualizar nosso sistema.");
        }

        App.clearCart();
        App.navigateTo('home-screen');
    },
    attachListeners: () => {
        document.getElementById('save-user-details-btn').addEventListener('click', App.saveUserDetails);
        document.getElementById('header-address-clickable').addEventListener('click', App.openUserDetailsModal);
        document.querySelectorAll('.go-back-btn').forEach(btn => btn.addEventListener('click', App.goBack));
        document.querySelectorAll('.category-btn').forEach(btn => btn.addEventListener('click', () => App.showCategory(btn.dataset.category)));
        document.getElementById('clear-cart-btn').addEventListener('click', App.clearCart);
        document.getElementById('add-more-products-btn').addEventListener('click', () => App.navigateTo('home-screen'));
        document.getElementById('show-coupon-btn').addEventListener('click', () => { document.getElementById('coupon-input-container').classList.remove('hidden'); document.getElementById('show-coupon-btn').classList.add('hidden'); });
        document.getElementById('apply-coupon-btn').addEventListener('click', App.applyCoupon);
        document.getElementById('go-to-payment-btn').addEventListener('click', () => App.navigateTo('payment-screen'));
        document.getElementById('finalize-order-btn').addEventListener('click', App.finalizeOrder);
        document.querySelectorAll('.payment-option').forEach(el => el.addEventListener('click', () => App.selectPayment(el.id.includes('pix') ? 'pix' : 'cash')));

        document.getElementById('home-search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const mainContent = document.getElementById('home-main-content');
            const resultsContainer = document.getElementById('home-search-results');
            if (searchTerm.length < 2) { mainContent.style.display = 'block'; resultsContainer.style.display = 'none'; return; }
            const results = Object.values(AppState.allProducts).filter(p => (p.name || '').toLowerCase().includes(searchTerm) || (p.brand && p.brand.toLowerCase().includes(searchTerm)));
            mainContent.style.display = 'none'; resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `<div class="grid grid-cols-2 gap-4">${results.map(App.renderProductCard).join('') || '<p class="col-span-2 text-center">Nenhum produto encontrado.</p>'}</div>`;
        });

        // Delegação global para botões dinâmicos (add-to-cart, update-quantity, go-back, atualizar subtotal)
        document.body.addEventListener('click', (e) => {
            // adicionar ao carrinho
            const addBtn = e.target.closest('.add-to-cart-btn');
            if (addBtn) {
                const productId = addBtn.dataset.id;
                const quantityEl = document.getElementById(`product-quantity-${productId}`);
                const quantity = quantityEl ? parseInt(quantityEl.textContent, 10) : 1;
                const existing = AppState.cart.find(item => item.id === productId);
                if (existing) { existing.quantity += quantity; } else { AppState.cart.push({ id: productId, quantity }); }
                App.renderCart();
                App.navigateTo('cart-screen');
                return;
            }

            // atualizar quantidade no modal de produto
            const uq = e.target.closest('.update-quantity-btn');
            if (uq) {
                const productId = uq.dataset.id;
                const change = parseInt(uq.dataset.change, 10);
                const quantityEl = document.getElementById(`product-quantity-${productId}`);
                if (!quantityEl) return;
                let quantity = parseInt(quantityEl.textContent, 10) + change;
                if (quantity < 1) quantity = 1;
                const maxStock = AppState.allProducts[productId]?.stock ?? 0;
                if (quantity > maxStock) { alert(`Desculpe, temos apenas ${maxStock} em estoque.`); quantity = maxStock; }
                quantityEl.textContent = quantity;
                // atualizar subtotal do footer do produto
                const subtotalEl = document.getElementById(`product-subtotal-${productId}`);
                const price = AppState.allProducts[productId]?.price || 0;
                if (subtotalEl) subtotalEl.textContent = `R$ ${(price * quantity).toFixed(2).replace('.', ',')}`;
                return;
            }

            // go-back dinâmico
            if (e.target.closest('.go-back-btn')) {
                App.goBack();
                return;
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', App.init);
