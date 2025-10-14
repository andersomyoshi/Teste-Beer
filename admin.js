import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- (código de variáveis e login sem alterações) ---

// NOVO: Selecionar elementos do modal de cupons
const DOMElements = {
    // ... (outros elementos existentes) ...
    createCouponForm: document.getElementById('create-coupon-form'),
    couponsTableBody: document.getElementById('coupons-table-body'),
};

// --- (lógica de login sem alterações) ---

// --- GERENCIAMENTO DE PRODUTOS (CRUD) ---
// --- (todo o código de produtos sem alterações) ---

// --- NOVO: GERENCIAMENTO DE CUPONS (CRUD) ---
async function loadCoupons() {
    DOMElements.couponsTableBody.innerHTML = '<tr><td colspan="4" class="p-3 text-center">Carregando...</td></tr>';
    const querySnapshot = await getDocs(collection(db, "coupons"));
    
    DOMElements.couponsTableBody.innerHTML = '';
    if (querySnapshot.empty) {
        DOMElements.couponsTableBody.innerHTML = '<tr><td colspan="4" class="p-3 text-center">Nenhum cupom criado.</td></tr>';
        return;
    }
    
    querySnapshot.forEach(doc => {
        const coupon = doc.data();
        DOMElements.couponsTableBody.innerHTML += `
            <tr class="border-b">
                <td class="p-3 font-mono">${coupon.code}</td>
                <td class="p-3">${coupon.discountPercentage}%</td>
                <td class="p-3">${coupon.usesLeft} / ${coupon.totalUses}</td>
                <td class="p-3">
                    <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="window.deleteCoupon('${doc.id}')">Excluir</button>
                </td>
            </tr>`;
    });
}

DOMElements.createCouponForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('coupon-code').value.toUpperCase();
    const discount = parseInt(document.getElementById('coupon-discount').value);
    const uses = parseInt(document.getElementById('coupon-uses').value);

    if (!code || !discount || !uses) {
        alert("Por favor, preencha todos os campos do cupom.");
        return;
    }

    const couponData = {
        code: code,
        discountPercentage: discount,
        totalUses: uses,
        usesLeft: uses, // Começa com o número total de usos
    };

    try {
        await addDoc(collection(db, "coupons"), couponData);
        alert(`Cupom "${code}" criado com sucesso!`);
        DOMElements.createCouponForm.reset();
        loadCoupons(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao criar cupom: ", error);
        alert("Ocorreu um erro ao criar o cupom.");
    }
});

window.deleteCoupon = async (couponId) => {
    if (confirm('Tem certeza que deseja excluir este cupom permanentemente?')) {
        try {
            await deleteDoc(doc(db, "coupons", couponId));
            alert('Cupom excluído com sucesso!');
            loadCoupons();
        } catch (error) {
            console.error("Erro ao excluir cupom: ", error);
            alert("Ocorreu um erro ao excluir o cupom.");
        }
    }
};


// --- LÓGICA DOS MODAIS ---
DOMElements.modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const modalId = trigger.dataset.modal;
        document.getElementById(modalId)?.classList.add('flex');
        // NOVO: Carregar cupons ao abrir o modal de cupons
        if (modalId === 'coupons-modal') {
            loadCoupons();
        }
    });
});

// --- (resto do admin.js sem alterações) ---
