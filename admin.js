import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const USUARIO_CORRETO = 'Yoshi', SENHA_CORRETA = '1985';
let allProducts = [], salesData = [];

const Auth = { /* ... (código de autenticação sem alterações) ... */ };

const Admin = {
    // ... (funções de CRUD de produtos e cupons sem alterações) ...
    
    // BACKUP E RESTAURAÇÃO
    backupProducts: async () => {
        if (allProducts.length === 0) {
            await Admin.loadAndRenderProducts(); // Garante que os produtos estão carregados
        }
        if (allProducts.length === 0) {
            alert("Nenhum produto para fazer backup.");
            return;
        }
        const backupData = { products: allProducts };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_produtos_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Backup dos produtos gerado com sucesso!');
    },
    restoreBackup: () => {
        const fileInput = document.getElementById('backup-file-input');
        fileInput.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    if (!backupData.products || !Array.isArray(backupData.products)) {
                        throw new Error("Formato de backup inválido.");
                    }
                    if (!confirm(`Você tem certeza que quer restaurar ${backupData.products.length} produtos? ISSO IRÁ SOBRESCREVER OS PRODUTOS EXISTENTES COM O MESMO ID.`)) return;

                    const restorePromises = backupData.products.map(product => {
                        const { id, ...data } = product;
                        return setDoc(doc(db, "products", id), data);
                    });
                    
                    await Promise.all(restorePromises);
                    alert("Backup restaurado com sucesso!");
                    Admin.loadAndRenderProducts();
                } catch (error) {
                    console.error("Erro ao restaurar backup:", error);
                    alert("Erro ao ler o arquivo de backup. Verifique se o formato está correto.");
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    },

    // INICIALIZAÇÃO E LISTENERS
    init: () => {
        window.Admin = Admin; // Expõe para os onclicks
        Auth.checkLogin();

        // Listeners principais
        document.getElementById('login-button').addEventListener('click', Auth.attemptLogin);
        document.getElementById('logout-button').addEventListener('click', Auth.doLogout);
        document.getElementById('login-password').addEventListener('keypress', (e) => e.key === 'Enter' && Auth.attemptLogin());
        document.getElementById('backup-btn').addEventListener('click', Admin.backupProducts);
        document.getElementById('restore-backup-btn').addEventListener('click', Admin.restoreBackup);

        // Listeners dos Modais
        document.querySelectorAll('.modal-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const modalId = trigger.dataset.modal;
                document.getElementById(modalId)?.classList.add('flex');
                if (modalId === 'coupons-modal') Admin.loadCoupons();
                if (modalId === 'history-modal') Admin.loadSalesHistory();
                if (modalId === 'cashier-modal') Admin.calculateAndShowCashier();
            });
        });
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.modal').classList.remove('flex'));
        });
        document.getElementById('add-product-btn-trigger').addEventListener('click', () => {
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
            document.getElementById('modal-title').textContent = 'Adicionar Novo Produto';
            document.getElementById('is-promotion').dispatchEvent(new Event('change'));
        });

        // Listener do formulário de produto (com conversão para número)
        document.getElementById('product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('product-id').value;
            const data = {
                name: document.getElementById('product-name').value,
                image: document.getElementById('product-image').value,
                price: parseFloat(document.getElementById('product-price').value) || 0,
                stock: parseInt(document.getElementById('product-stock').value, 10) || 0,
                cost: parseFloat(document.getElementById('product-cost').value) || 0,
                category: document.getElementById('product-category').value,
                brand: document.getElementById('product-brand').value,
                barcode: document.getElementById('product-barcode').value || "",
                isPopular: document.getElementById('is-popular').checked,
                isConsagrada: document.getElementById('is-consagrada').checked,
                isPrestigiada: document.getElementById('is-prestigiada').checked,
                isPromotion: document.getElementById('is-promotion').checked,
                promotionUrl: document.getElementById('product-promotionUrl').value || ""
            };
            try {
                if (id) { await setDoc(doc(db, "products", id), data); } else { await addDoc(collection(db, "products"), data); }
                alert('Produto salvo!');
                document.getElementById('product-modal').classList.remove('flex');
                Admin.loadAndRenderProducts();
            } catch (err) { console.error("Erro ao salvar:", err); alert('Erro ao salvar.'); }
        });
        
        document.getElementById('is-promotion').addEventListener('change', (e) => {
            document.getElementById('promotion-url-container').style.display = e.target.checked ? 'block' : 'none';
        });

        // ... (Resto dos listeners para pesquisa, categoria, cupons, etc.) ...
    }
};

document.addEventListener('DOMContentLoaded', Admin.init);
