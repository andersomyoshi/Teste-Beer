import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, updateDoc, increment, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- (código do AppState e Funções de Renderização sem alterações) ---

// --- OBJETO GLOBAL DE FUNÇÕES (PARA `onclick`) ---
window.App = {
    // ... (Funções de Navegação, Telas, Dados do Usuário, Carrinho, Cupom sem alterações) ...

    // FUNÇÃO DE FINALIZAR PEDIDO ATUALIZADA
    finalizeOrder: async () => {
        const { customerName, customerAddress, paymentMethod, cart, coupon, config, allProducts } = AppState;
        if (!customerName || !customerAddress) { alert('Defina seu nome e endereço.'); window.App.openUserDetailsModal(); return; }
        if (!paymentMethod) { alert('Selecione uma forma de pagamento.'); return; }

        // 1. Montar a mensagem completa do WhatsApp
        const subtotal = cart.reduce((acc, item) => acc + (allProducts[item.id].price * item.quantity), 0);
        const discountAmount = subtotal * coupon.discount;
        const total = subtotal - discountAmount + config.frete;

        let orderText = `*NOVO PEDIDO YOSHI'S BAR*\n\n*Cliente:* ${customerName}\n*Endereço:* ${customerAddress}\n\n*Itens:*\n`;
        cart.forEach(item => { const p = allProducts[item.id]; orderText += `${item.quantity}x ${p.name} - R$ ${(p.price * item.quantity).toFixed(2).replace('.', ',')}\n`; });
        orderText += `\n*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        if (coupon.applied) orderText += `\n*Cupom (${coupon.code}):* - R$ ${discountAmount.toFixed(2).replace('.', ',')}`;
        orderText += `\n*Frete:* R$ ${config.frete.toFixed(2).replace('.', ',')}\n*Total:* R$ ${total.toFixed(2).replace('.', ',')}\n\n*Pagamento:* ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`;

        // CORRIGIDO: Adiciona informações de troco
        if (paymentMethod === 'cash') {
            const changeValue = document.getElementById('change').value;
            const noChange = document.getElementById('no-change').checked;
            if (noChange) {
                orderText += '\nNão precisa de troco.';
            } else if (changeValue) {
                orderText += `\n*Levar troco para:* R$ ${parseFloat(changeValue).toFixed(2).replace('.', ',')}`;
            }
        }
        
        // CORRIGIDO: Adiciona instruções para o distribuidor
        const instructions = document.getElementById('instructions').value;
        if (instructions.trim()) {
            orderText += `\n\n*Instruções:* ${instructions.trim()}`;
        }

        // 2. Abrir o link do WhatsApp
        window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(orderText)}`, '_blank');
        
        // 3. Registrar a venda e atualizar o estoque no Firebase
        try {
            // Atualiza o uso do cupom se houver um
            if (coupon.applied && coupon.id) {
                await updateDoc(doc(db, "coupons", coupon.id), { usesLeft: increment(-1) });
            }

            // Prepara os dados da venda
            const saleData = {
                timestamp: serverTimestamp(),
                customerName,
                items: cart.map(item => ({
                    id: item.id,
                    name: allProducts[item.id].name,
                    quantity: item.quantity,
                    price: allProducts[item.id].price,
                    cost: allProducts[item.id].cost || 0
                })),
                totalValue: total,
                totalCost: cart.reduce((acc, item) => acc + ((allProducts[item.id].cost || 0) * item.quantity), 0)
            };
            
            // Adiciona o registro na coleção 'sales'
            await addDoc(collection(db, "sales"), saleData);

            // Atualiza o estoque de cada produto
            const stockUpdates = cart.map(item => {
                const productRef = doc(db, "products", item.id);
                return updateDoc(productRef, { stock: increment(-item.quantity) });
            });
            await Promise.all(stockUpdates);

            alert("Pedido enviado! Obrigado por sua compra.");

        } catch (error) {
            console.error("Erro ao registrar a venda: ", error);
            // Informa ao usuário que o pedido foi enviado, mas o sistema pode ter tido um problema
            alert("Seu pedido foi enviado, mas tivemos um problema ao atualizar nosso sistema interno. Não se preocupe, sua compra está a caminho!");
        }
        
        // Limpa o carrinho e reseta o estado
        window.App.clearCart();
        window.App.navigateTo('home-screen');
    }
};

// --- INICIALIZAÇÃO E EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (código de inicialização sem alterações) ...
    
    // CORRIGIDO: Listener da Barra de Pesquisa
    const searchInput = document.getElementById('home-search');
    const mainContent = document.getElementById('home-main-content');
    const searchResultsContainer = document.getElementById('home-search-results');
    
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm.length < 2) {
            mainContent.style.display = 'block';
            searchResultsContainer.style.display = 'none';
            return;
        }

        const results = Object.values(AppState.allProducts).filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.brand.toLowerCase().includes(searchTerm)
        );
        
        mainContent.style.display = 'none';
        searchResultsContainer.style.display = 'block';
        searchResultsContainer.innerHTML = `<div class="grid grid-cols-2 gap-4">${results.map(renderProductCard).join('') || '<p class="col-span-2 text-center">Nenhum produto encontrado.</p>'}</div>`;
    });
});
