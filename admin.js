import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- ESTADO E CONFIGURAÇÕES GLOBAIS ---
const USUARIO_CORRETO = 'Yoshi';
const SENHA_CORRETA = '1985';
let allProducts = [];
let salesData = [];

// --- FUNÇÕES DE LOGIN ---
const Auth = {
    attemptLogin: () => {
        const userInput = document.getElementById('login-user');
        const passInput = document.getElementById('login-password');
        if (userInput.value === USUARIO_CORRETO && passInput.value === SENHA_CORRETA) {
            sessionStorage.setItem('loggedIn', 'true');
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            Admin.loadAndRenderProducts();
        } else {
            document.getElementById('login-error').textContent = 'Usuário ou senha inválidos.';
        }
    },
    doLogout: () => {
        sessionStorage.removeItem('loggedIn');
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
        document.getElementById('login-user').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-error').textContent = '';
    },
    checkLogin: () => {
        if (sessionStorage.getItem('loggedIn') === 'true') {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            Admin.loadAndRenderProducts();
        } else {
            document.getElementById('login-screen').style.display = 'flex';
        }
    }
};

// --- OBJETO COM AS FUNÇÕES PRINCIPAIS DO PAINEL ---
const Admin = {
    loadAndRenderProducts: async (filterFn = null) => {
        const tableBody = document.getElementById('products-table-body');
        tableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center">Carregando...</td></tr>';
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const productsToRender = filterFn ? allProducts.filter(filterFn) : allProducts;
        Admin.renderTable(productsToRender);
    },
    renderTable: (products) => {
        const tableBody = document.getElementById('products-table-body');
        tableBody.innerHTML = products.length === 0 ? '<tr><td colspan="5" class="p-3 text-center">Nenhum produto encontrado.</td></tr>' : products.map(p => `
            <tr class="border-b"><td class="p-3">${p.name}</td><td class="p-3">R$ ${Number(p.price).toFixed(2).replace('.', ',')}</td><td class="p-3">${p.stock}</td><td class="p-3">${p.category}</td><td class="p-3"><button class="bg-blue-500 text-white px-3 py-1 rounded" onclick="Admin.editProduct('${p.id}')">Editar</button><button class="bg-red-500 text-white px-3 py-1 rounded ml-2" onclick="Admin.deleteProduct('${p.id}')">Excluir</button></td></tr>
        `).join('');
    },
    editProduct: (id) => {
        const product = allProducts.find(p => p.id === id);
        if (!product) return;
        document.getElementById('product-id').value = product.id;
        document.getElementById('modal-title').textContent = 'Editar Produto';
        ['name', 'image', 'price', 'stock', 'category', 'brand', 'barcode', 'cost', 'promotionUrl'].forEach(f => {
            const el = document.getElementById(`product-${f}`);
            if (el) el.value = product[f] || '';
        });
        ['is-popular', 'is-consagrada', 'is-prestigiada', 'is-promotion'].forEach(k => {
            const el = document.getElementById(k);
            if (el) el.checked = product[k] || false;
        });
        document.getElementById('is-promotion').dispatchEvent(new Event('change'));
        document.getElementById('product-modal').classList.add('flex');
    },
    deleteProduct: async (id) => {
        if (confirm('Tem certeza?')) { await deleteDoc(doc(db, "products", id)); alert('Produto excluído!'); Admin.loadAndRenderProducts(); }
    },
    loadCoupons: async () => {
        const tableBody = document.getElementById('coupons-table-body');
        tableBody.innerHTML = '<tr><td colspan="4" class="p-3 text-center">Carregando...</td></tr>';
        const querySnapshot = await getDocs(collection(db, "coupons"));
        tableBody.innerHTML = querySnapshot.empty ? '<tr><td colspan="4" class="p-3 text-center">Nenhum cupom criado.</td></tr>' : querySnapshot.docs.map(d => {
            const c = d.data();
            return `<tr class="border-b"><td class="p-3 font-mono">${c.code}</td><td class="p-3">${c.discountPercentage}%</td><td class="p-3">${c.usesLeft}/${c.totalUses}</td><td class="p-3"><button class="bg-red-500 text-white px-3 py-1 rounded" onclick="Admin.deleteCoupon('${d.id}')">Excluir</button></td></tr>`;
        }).join('');
    },
    deleteCoupon: async (id) => {
        if (confirm('Tem certeza?')) { await deleteDoc(doc(db, "coupons", id)); alert('Cupom excluído!'); Admin.loadCoupons(); }
    },
    loadSalesHistory: async () => {
        const container = document.getElementById('sales-history-container');
        container.innerHTML = '<p class="text-center">Carregando histórico...</p>';
        const salesQuery = query(collection(db, "sales"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(salesQuery);
        salesData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        container.innerHTML = salesData.length === 0 ? '<p class="text-center text-gray-500">Nenhuma venda registrada.</p>' : salesData.map(s => `
            <div class="border rounded-lg p-4 mb-4"><div class="flex justify-between items-center border-b pb-2 mb-2"><h3 class="font-bold">${new Date(s.timestamp?.toDate()).toLocaleString('pt-BR')}</h3><span class="font-bold text-lg">Total: R$ ${Number(s.totalValue).toFixed(2).replace('.',',')}</span></div><p class="text-sm text-gray-600">Cliente: ${s.customerName}</p><ul class="list-disc pl-5 mt-2 text-sm">${s.items.map(i => `<li>${i.quantity}x ${i.name}</li>`).join('')}</ul></div>
        `).join('');
    },
    calculateAndShowCashier: () => {
        const container = document.getElementById('cashier-report-container');
        if (salesData.length === 0) { container.innerHTML = '<p class="text-center text-gray-500">Nenhum dado para gerar relatório.</p>'; return; }
        const totalSales = salesData.reduce((a, s) => a + s.totalValue, 0);
        const totalCost = salesData.reduce((a, s) => a + s.totalCost, 0);
        const totalItems = salesData.reduce((a, s) => a + s.items.reduce((ia, i) => ia + i.quantity, 0), 0);
        const totalProfit = totalSales - totalCost;
        container.innerHTML = `<div class="p-3 bg-gray-100 rounded-md flex justify-between items-center"><span class="font-semibold">Total Bruto de Vendas:</span><span class="font-bold">R$ ${totalSales.toFixed(2).replace('.',',')}</span></div><div class="p-3 bg-gray-100 rounded-md flex justify-between items-center"><span class="font-semibold">Custo Total dos Produtos:</span><span class="font-bold">R$ ${totalCost.toFixed(2).replace('.',',')}</span></div><div class="p-3 bg-green-100 rounded-md flex justify-between items-center text-green-800"><span class="font-semibold text-lg">Lucro Bruto:</span><span class="font-bold text-lg">R$ ${totalProfit.toFixed(2).replace('.',',')}</span></div><div class="p-3 bg-gray-100 rounded-md flex justify-between items-center"><span class="font-semibold">Quantidade de Itens Vendidos:</span><span class="font-bold">${totalItems}</span></div>`;
    },
    generatePdfReport: () => {
        if (salesData.length === 0) { alert("Nenhum dado para gerar o relatório."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Relatório de Fechamento de Caixa - Yoshi's Bar", 14, 16);
        doc.autoTable({ startY: 22, head: [['Descrição', 'Valor']], body: [['Total Bruto de Vendas', `R$ ${salesData.reduce((a, s) => a + s.totalValue, 0).toFixed(2).replace('.',',')}`], ['Custo Total dos Produtos', `R$ ${salesData.reduce((a, s) => a + s.totalCost, 0).toFixed(2).replace('.',',')}`], ['Lucro Bruto', `R$ ${(salesData.reduce((a, s) => a + s.totalValue, 0) - salesData.reduce((a, s) => a + s.totalCost, 0)).toFixed(2).replace('.',',')}`], ['Total de Itens Vendidos', `${salesData.reduce((a, s) => a + s.items.reduce((ia, i) => ia + i.quantity, 0), 0)}`]] });
        doc.save(`fechamento_caixa_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    },
    init: () => {
        window.Admin = Admin; // Expõe o objeto para os onclicks
        Auth.checkLogin();
        // Listeners de Login
        document.getElementById('login-button').addEventListener('click', Auth.attemptLogin);
        document.getElementById('logout-button').addEventListener('click', Auth.doLogout);
        document.getElementById('login-password').addEventListener('keypress', (e) => e.key === 'Enter' && Auth.attemptLogin());
        // Listeners dos Modais
        document.querySelectorAll('.modal-trigger').forEach(trigger => trigger.addEventListener('click', () => {
            const modalId = trigger.dataset.modal;
            document.getElementById(modalId)?.classList.add('flex');
            if (modalId === 'coupons-modal') Admin.loadCoupons();
            if (modalId === 'history-modal') Admin.loadSalesHistory();
            if (modalId === 'cashier-modal') Admin.calculateAndShowCashier();
        }));
        document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => btn.closest('.modal').classList.remove('flex')));
        document.getElementById('add-product-btn-trigger').addEventListener('click', () => {
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
            document.getElementById('modal-title').textContent = 'Adicionar Novo Produto';
            document.getElementById('is-promotion').dispatchEvent(new Event('change'));
        });
        // Listeners dos Forms e Filtros
        document.getElementById('product-form').addEventListener('submit', async (e) => { e.preventDefault(); const id = document.getElementById('product-id').value; const data = { name: document.getElementById('product-name').value, image: document.getElementById('product-image').value, price: parseFloat(document.getElementById('product-price').value), stock: parseInt(document.getElementById('product-stock').value), category: document.getElementById('product-category').value, brand: document.getElementById('product-brand').value, barcode: document.getElementById('product-barcode').value || "", cost: parseFloat(document.getElementById('product-cost').value) || 0, isPopular: document.getElementById('is-popular').checked, isConsagrada: document.getElementById('is-consagrada').checked, isPrestigiada: document.getElementById('is-prestigiada').checked, isPromotion: document.getElementById('is-promotion').checked, promotionUrl: document.getElementById('product-promotionUrl').value || "" }; try { if (id) { await setDoc(doc(db, "products", id), data); } else { await addDoc(collection(db, "products"), data); } alert('Produto salvo!'); document.getElementById('product-modal').classList.remove('flex'); Admin.loadAndRenderProducts(); } catch (err) { console.error(err); alert('Erro ao salvar.'); } });
        document.getElementById('is-promotion').addEventListener('change', (e) => document.getElementById('promotion-url-container').style.display = e.target.checked ? 'block' : 'none');
        document.getElementById('search-input').addEventListener('input', (e) => { const term = e.target.value.toLowerCase(); document.getElementById('search-results').innerHTML = allProducts.filter(p => p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)).map(p => `<div class="p-2 border-b">${p.name} - ${p.brand}</div>`).join(''); });
        document.getElementById('category-filter').addEventListener('change', (e) => Admin.renderTable(e.target.value === 'all' ? allProducts : allProducts.filter(p => p.category === e.target.value)));
        document.getElementById('create-coupon-form').addEventListener('submit', async (e) => { e.preventDefault(); const code = document.getElementById('coupon-code').value.toUpperCase(); const discount = parseInt(document.getElementById('coupon-discount').value); const uses = parseInt(document.getElementById('coupon-uses').value); if (!code || !discount || !uses) return alert("Preencha todos os campos."); const data = { code, discountPercentage: discount, totalUses: uses, usesLeft: uses }; await addDoc(collection(db, "coupons"), data); alert(`Cupom "${code}" criado!`); e.target.reset(); Admin.loadCoupons(); });
        document.getElementById('generate-pdf-btn').addEventListener('click', Admin.generatePdfReport);
    }
};

// --- PONTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', Admin.init);
