import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, updateDoc, increment, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const AppState = { allProducts: {}, cart: [], navigationStack: ['home-screen'], customerName: '', customerAddress: '', paymentMethod: null, coupon: { applied: false, id: null, code: '', discount: 0 }, config: { frete: 1.00, whatsappNumber: '5543984399533' } };

const App = {
    init: () => {
        App.attachListeners();
        App.fetchAndRenderData();
        App.renderCart();
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            if (!AppState.customerName) App.openUserDetailsModal();
        }, 1500);
    },
    fetchAndRenderData: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            querySnapshot.forEach(d => { AppState.allProducts[d.id] = { id: d.id, ...d.data() }; });
            App.renderHomePage();
        } catch (error) { console.error("Erro ao buscar produtos:", error); }
    },
    renderHomePage: () => {
        const bannerContainer = document.getElementById('banner-scroll');
        const promotions = Object.values(AppState.allProducts).filter(p => p.isPromotion && p.promotionUrl);
        bannerContainer.innerHTML = promotions.length > 0 ? promotions.map(p => `<div class="flex-shrink-0 w-full rounded-lg snap-center cursor-pointer" onclick="App.showProduct('${p.id}')"><img src="${p.promotionUrl}" alt="${p.name}" class="w-full h-auto object-cover rounded-lg"></div>`).join('') : `<div class="flex-shrink-0 w-full rounded-lg snap-center"><img src="https://cervejaitaipava.com.br/wp-content/uploads/2024/06/CERVE2145-PG008_ITAIPAVA_KV_PROMO_TAMPINHA_FAMILIA_ITAIPAVA_HORIZONTAL_RGB_NOVA-2048x1152.jpg" alt="Banner padrão" class="w-full h-auto object-cover rounded-lg"></div>`;
        const popularsContainer = document.getElementById('popular-items');
        const populars = Object.values(AppState.allProducts).filter(p => p.isPopular);
        popularsContainer.innerHTML = populars.length > 0 ? populars.map(App.renderProductCard).join('') : `<p class="text-gray-500">Nenhum item popular.</p>`;
    },
    renderProductCard: (product) => {
        const isSoldOut = product.stock <= 0;
        return `<div onclick="${isSoldOut ? '' : `App.showProduct('${product.id}')`}" class="text-center w-28 flex-shrink-0 cursor-pointer ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}"><div class="relative"><img src="${product.image}" alt="${product.name}" class="w-full h-24 object-contain rounded-lg bg-gray-100 p-2 ${isSoldOut ? 'filter grayscale' : ''}">${isSoldOut ? '<span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">ESGOTADO</span>' : ''}</div><p class="text-xs font-semibold mt-2 truncate">${product.name}</p><p class="text-sm font-bold">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p></div>`;
    },
    navigateTo: (screenId) => { /* ... (código existente sem alterações) ... */ },
    goBack: () => { /* ... (código existente sem alterações) ... */ },
    showCategory: (category) => { /* ... (código existente sem alterações) ... */ },
    showProduct: (productId) => { /* ... (código existente sem alterações) ... */ },
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
    updateCartItemQuantity: (id, change) => { /* ... (código existente sem alterações) ... */ },
    clearCart: () => { /* ... (código existente sem alterações) ... */ },
    renderCart: () => { /* ... (código existente sem alterações) ... */ },
    applyCoupon: async () => { /* ... (código existente sem alterações) ... */ },
    selectPayment: (method) => { /* ... (código existente sem alterações) ... */ },
    finalizeOrder: async () => {
        const { customerName, customerAddress, paymentMethod, cart, coupon, config, allProducts } = AppState;
        if (!customerName || !customerAddress) { alert('Defina seu nome e endereço.'); App.openUserDetailsModal(); return; }
        if (!paymentMethod) { alert('Selecione uma forma de pagamento.'); return; }

        const subtotal = cart.reduce((acc, item) => acc + (allProducts[item.id].price * item.quantity), 0);
        const discountAmount = subtotal * coupon.discount;
        const total = subtotal - discountAmount + config.frete;

        // CORREÇÃO: Mensagem completa para o WhatsApp
        let orderText = `*NOVO PEDIDO YOSHI'S BAR*\n\n*Cliente:* ${customerName}\n*Endereço:* ${customerAddress}\n\n*Itens:*\n`;
        cart.forEach(item => { const p = allProducts[item.id]; orderText += `${item.quantity}x ${p.name} - R$ ${(p.price * item.quantity).toFixed(2).replace('.', ',')}\n`; });
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

        // CORREÇÃO: Lógica de atualização de estoque e registro de venda
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
            alert("Seu pedido foi enviado, mas tivemos um problema ao atualizar nosso sistema. Não se preocupe, sua compra está a caminho!");
        }
        App.clearCart(); App.navigateTo('home-screen');
    },
    attachListeners: () => {
        window.App = App; // Expõe o objeto para os onclicks
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
        
        // CORREÇÃO: Listener da barra de pesquisa
        document.getElementById('home-search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const mainContent = document.getElementById('home-main-content');
            const resultsContainer = document.getElementById('home-search-results');
            if (searchTerm.length < 2) {
                mainContent.style.display = 'block';
                resultsContainer.style.display = 'none';
                return;
            }
            const results = Object.values(AppState.allProducts).filter(p => p.name.toLowerCase().includes(searchTerm) || (p.brand && p.brand.toLowerCase().includes(searchTerm)));
            mainContent.style.display = 'none';
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `<div class="grid grid-cols-2 gap-4">${results.map(App.renderProductCard).join('') || '<p class="col-span-2 text-center">Nenhum produto encontrado.</p>'}</div>`;
        });
        
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) { /* ... (código existente) ... */ }
            if (e.target.closest('.update-quantity-btn')) { /* ... (código existente) ... */ }
        });
    }
};

document.addEventListener('DOMContentLoaded', App.init);
