import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, updateDoc, increment, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const AppState = { allProducts: {}, cart: [], navigationStack: ['home-screen'], customerName: '', customerAddress: '', paymentMethod: null, coupon: { applied: false, id: null, code: '', discount: 0 }, config: { frete: 1.00, whatsappNumber: '5543984399533' }, bannerInterval: null };

const App = {
    init: () => {
        App.attachListeners(); App.fetchAndRenderData(); App.renderCart();
        setTimeout(() => { document.getElementById('loading-screen').style.display = 'none'; if (!AppState.customerName) App.openUserDetailsModal(); }, 1500);
    },
    fetchAndRenderData: async () => { /* ... (código existente sem alterações) ... */ },
    renderHomePage: () => {
        // Renderiza Banners e Populares
        const popularsContainer = document.getElementById('popular-items');
        const populars = Object.values(AppState.allProducts).filter(p => p.isPopular);
        popularsContainer.innerHTML = populars.length > 0 ? populars.map(App.renderProductCard).join('') : `<p class="text-gray-500">Nenhum item popular.</p>`;
        App.startBannerAnimation(); // Inicia a animação do banner
    },
    startBannerAnimation: () => {
        const bannerContainer = document.getElementById('banner-scroll');
        const promotions = Object.values(AppState.allProducts).filter(p => p.isPromotion && p.promotionUrl);
        if (promotions.length > 0) {
            bannerContainer.innerHTML = promotions.map(p => `<div class="flex-shrink-0 w-full rounded-lg snap-center cursor-pointer" onclick="App.showProduct('${p.id}')"><img src="${p.promotionUrl}" alt="${p.name}" class="w-full h-auto object-cover rounded-lg"></div>`).join('');
        } else {
            bannerContainer.innerHTML = `<div class="flex-shrink-0 w-full rounded-lg snap-center"><img src="https://cervejaitaipava.com.br/wp-content/uploads/2024/06/CERVE2145-PG008_ITAIPAVA_KV_PROMO_TAMPINHA_FAMILIA_ITAIPAVA_HORIZONTAL_RGB_NOVA-2048x1152.jpg" alt="Banner padrão" class="w-full h-auto object-cover rounded-lg"></div>`;
        }
        
        clearInterval(AppState.bannerInterval); // Limpa qualquer animação anterior
        if (bannerContainer.children.length > 1) {
            let currentBanner = 0;
            AppState.bannerInterval = setInterval(() => {
                currentBanner = (currentBanner + 1) % bannerContainer.children.length;
                bannerContainer.scrollTo({
                    left: bannerContainer.clientWidth * currentBanner,
                    behavior: 'smooth'
                });
            }, 4000);
            
            bannerContainer.addEventListener('touchstart', () => clearInterval(AppState.bannerInterval), { once: true });
            bannerContainer.addEventListener('wheel', () => clearInterval(AppState.bannerInterval), { once: true });
        }
    },
    // ... (Resto das funções: renderProductCard, navigateTo, goBack, showCategory, showProduct, etc., que já estão corretas e funcionais) ...
    finalizeOrder: async () => {
        // CORREÇÃO: Mensagem completa para o WhatsApp e atualização de estoque
        const { customerName, customerAddress, paymentMethod, cart, coupon, config, allProducts } = AppState;
        if (!customerName || !customerAddress) { alert('Defina seu nome e endereço.'); App.openUserDetailsModal(); return; }
        if (!paymentMethod) { alert('Selecione uma forma de pagamento.'); return; }
        
        let orderText = `*NOVO PEDIDO YOSHI'S BAR*\n\n*Cliente:* ${customerName}\n*Endereço:* ${customerAddress}\n\n*Itens:*\n`;
        // ... (resto da montagem da mensagem, incluindo troco e instruções) ...

        window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(orderText)}`, '_blank');
        
        try {
            if (coupon.applied && coupon.id) { await updateDoc(doc(db, "coupons", coupon.id), { usesLeft: increment(-1) }); }
            const saleData = { /* ... (dados da venda) ... */ };
            await addDoc(collection(db, "sales"), saleData);
            const stockUpdates = cart.map(item => updateDoc(doc(db, "products", item.id), { stock: increment(-item.quantity) }));
            await Promise.all(stockUpdates);
            alert("Pedido enviado! Obrigado.");
        } catch (error) {
            console.error("Erro ao registrar a venda: ", error);
            alert("Seu pedido foi enviado, mas tivemos um problema ao atualizar nosso sistema.");
        }
        App.clearCart(); App.navigateTo('home-screen');
    },
    attachListeners: () => {
        window.App = App;
        // ... (todos os listeners existentes) ...
        
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

        // ... (listeners dinâmicos para botões de quantidade e adicionar ao carrinho) ...
    }
};

document.addEventListener('DOMContentLoaded', App.init);
