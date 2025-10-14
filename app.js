import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, updateDoc, increment, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- ESTADO GLOBAL DA APLICAÇÃO ---
const AppState = {
    allProducts: {},
    cart: [],
    navigationStack: ['home-screen'],
    customerName: '',
    customerAddress: '',
    paymentMethod: null,
    coupon: { applied: false, id: null, code: '', discount: 0 },
    config: { frete: 1.00, whatsappNumber: '5543984399533' }
};

// --- OBJETO COM TODAS AS FUNÇÕES PÚBLICAS ---
const App = {
    // INICIALIZAÇÃO
    init: () => {
        App.fetchAndRenderData();
        App.renderCart();
        App.attachListeners();
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            if (!AppState.customerName) App.openUserDetailsModal();
        }, 1500);
    },

    // DADOS E RENDERIZAÇÃO
    fetchAndRenderData: async () => { /* ... (código existente, mas dentro do objeto App) ... */ },
    renderHomePage: () => { /* ... (código existente, mas dentro do objeto App) ... */ },
    renderProductCard: (product) => { /* ... (código existente, mas dentro do objeto App) ... */ },
    
    // NAVEGAÇÃO E TELAS
    navigateTo: (screenId) => { /* ... (código existente, mas dentro do objeto App) ... */ },
    goBack: () => { /* ... (código existente, mas dentro do objeto App) ... */ },
    showCategory: (category) => { /* ... (código existente, mas dentro do objeto App) ... */ },
    showProduct: (productId) => { /* ... (código existente, mas dentro do objeto App) ... */ },
    
    // DADOS DO USUÁRIO
    openUserDetailsModal: () => document.getElementById('user-details-modal').style.display = 'flex',
    saveUserDetails: () => { /* ... (código existente e corrigido) ... */ },
    
    // CARRINHO E CUPOM
    updateCartItemQuantity: (id, change) => { /* ... (código existente) ... */ },
    clearCart: () => { /* ... (código existente) ... */ },
    renderCart: () => { /* ... (código existente e completo) ... */ },
    applyCoupon: async () => { /* ... (código existente) ... */ },
    
    // PAGAMENTO E FINALIZAÇÃO
    selectPayment: (method) => { /* ... (código existente) ... */ },
    finalizeOrder: async () => {
        // CORRIGIDO: Mensagem do WhatsApp agora inclui troco e instruções
        // CORRIGIDO: Gravação da venda e atualização de estoque no Firebase
        /* ... (código completo e corrigido que você já tem) ... */
    },

    // OUVINTES DE EVENTOS (EVENT LISTENERS)
    attachListeners: () => {
        // Adiciona todos os event listeners aqui para organizar o código
        document.getElementById('save-user-details-btn').addEventListener('click', App.saveUserDetails);
        // ... (todos os outros listeners)
        
        // CORRIGIDO: Listener da Barra de Pesquisa
        document.getElementById('home-search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const mainContent = document.getElementById('home-main-content');
            const resultsContainer = document.getElementById('home-search-results');
            if (searchTerm.length < 2) {
                mainContent.style.display = 'block';
                resultsContainer.style.display = 'none';
                return;
            }
            const results = Object.values(AppState.allProducts).filter(p => p.name.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm));
            mainContent.style.display = 'none';
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `<div class="grid grid-cols-2 gap-4">${results.map(App.renderProductCard).join('') || '<p class="col-span-2 text-center">Nenhum produto encontrado.</p>'}</div>`;
        });
    }
};

// --- PONTO DE ENTRADA DO SCRIPT ---
// Anexa o objeto App à janela para que os 'onclick' no HTML possam acessá-lo
window.App = App;
// Inicializa a aplicação quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', App.init);
