import { db } from './firebase-config.js';
// NOVO: Importar mais funções do Firestore
import { collection, getDocs, query, where, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- VARIÁVEIS GLOBAIS ---
// ... (outras variáveis existentes) ...
let appliedCouponId = null; // NOVO: Armazena o ID do cupom aplicado

// REMOVIDO: const COUPONS = { ... };

// --- LÓGICA DE CUPOM (ATUALIZADA) ---
window.showCouponInput = function() { /* ... (sem alterações) ... */ };

window.applyCoupon = async function() { // Função agora é async
    if (couponApplied) { alert('Um cupom já foi aplicado.'); return; }
    if (cart.length === 0) { alert('Adicione itens ao carrinho para aplicar um cupom.'); return; }
    
    const input = document.getElementById('coupon-input');
    const code = input.value.toUpperCase().trim();
    if (!code) return;

    // Procura o cupom no banco de dados
    const couponsRef = collection(db, "coupons");
    const q = query(couponsRef, where("code", "==", code));
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        alert('Código de cupom inválido.');
        return;
    }

    const couponDoc = querySnapshot.docs[0];
    const couponData = couponDoc.data();

    if (couponData.usesLeft > 0) {
        couponApplied = true;
        appliedCouponId = couponDoc.id; // Salva o ID do documento
        discountPercentage = couponData.discountPercentage / 100; // Converte para decimal
        appliedCouponCode = couponData.code;
        
        document.getElementById('coupon-input-container').classList.add('hidden');
        const appliedInfo = document.getElementById('applied-coupon-info');
        appliedInfo.innerHTML = `<span>Cupom: ${appliedCouponCode}</span><span class="text-green-600 font-bold">-${couponData.discountPercentage}%</span>`;
        appliedInfo.classList.remove('hidden');
        renderCart();
    } else {
        alert('Este código de cupom já esgotou seus usos.');
    }
};

window.clearCart = function() {
    // ... (código existente) ...
    appliedCouponId = null; // Limpa o ID do cupom
    // ... (resto do código) ...
};

// --- LÓGICA DE PAGAMENTO E FINALIZAÇÃO (ATUALIZADA) ---
window.finalizeOrder = async function() { // Função agora é async
    if (!customerName || !customerAddress) { alert('Por favor, defina seu nome e endereço.'); window.openUserDetailsModal(); return; }
    if (!paymentMethod) { alert('Por favor, selecione uma forma de pagamento.'); return; }

    // NOVO: Decrementar o uso do cupom no Firebase ANTES de gerar a mensagem
    if (couponApplied && appliedCouponId) {
        try {
            const couponRef = doc(db, "coupons", appliedCouponId);
            await updateDoc(couponRef, {
                usesLeft: increment(-1) // Diminui o contador em 1
            });
        } catch (error) {
            console.error("Erro ao atualizar o cupom: ", error);
            alert("Ocorreu um erro ao processar seu cupom. Tente novamente.");
            return; // Interrompe a finalização se não conseguir atualizar o cupom
        }
    }
    
    // O restante da função para gerar a mensagem do WhatsApp continua igual
    let subtotal = cart.reduce((acc, item) => acc + (allProducts[item.id].price * item.quantity), 0);
    const discountAmount = subtotal * discountPercentage;
    // ... (resto do código para gerar a mensagem) ...
    
    // A linha final que abre o WhatsApp
    // window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`, '_blank');
};

// --- (RESTANTE DO ARQUIVO app.js SEM ALTERAÇÕES) ---
