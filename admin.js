import { db } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- (código de login e CRUD de produtos e cupons sem alterações) ---
let allProducts = [];
let salesData = []; // NOVO: Armazena os dados de vendas

// --- FUNÇÕES DE VENDAS E RELATÓRIOS ---
async function loadSalesHistory() {
    const container = document.getElementById('sales-history-container');
    container.innerHTML = '<p class="text-center">Carregando histórico...</p>';
    
    const salesQuery = query(collection(db, "sales"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(salesQuery);
    salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (salesData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">Nenhuma venda registrada ainda.</p>';
        return;
    }

    container.innerHTML = salesData.map(sale => `
        <div class="border rounded-lg p-4 mb-4">
            <div class="flex justify-between items-center border-b pb-2 mb-2">
                <h3 class="font-bold">${new Date(sale.timestamp?.toDate()).toLocaleString('pt-BR')}</h3>
                <span class="font-bold text-lg">Total: R$ ${Number(sale.totalValue).toFixed(2).replace('.',',')}</span>
            </div>
            <p class="text-sm text-gray-600">Cliente: ${sale.customerName}</p>
            <ul class="list-disc pl-5 mt-2 text-sm">
                ${sale.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function calculateAndShowCashier() {
    const container = document.getElementById('cashier-report-container');
    if (salesData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">Nenhum dado de venda para gerar o relatório.</p>';
        return;
    }

    const totalSales = salesData.reduce((acc, sale) => acc + sale.totalValue, 0);
    const totalCost = salesData.reduce((acc, sale) => acc + sale.totalCost, 0);
    const totalItems = salesData.reduce((acc, sale) => acc + sale.items.reduce((iAcc, i) => iAcc + i.quantity, 0), 0);
    const totalProfit = totalSales - totalCost;

    container.innerHTML = `
        <div class="p-3 bg-gray-100 rounded-md flex justify-between items-center"><span class="font-semibold">Total Bruto de Vendas:</span><span class="font-bold">R$ ${totalSales.toFixed(2).replace('.',',')}</span></div>
        <div class="p-3 bg-gray-100 rounded-md flex justify-between items-center"><span class="font-semibold">Custo Total dos Produtos:</span><span class="font-bold">R$ ${totalCost.toFixed(2).replace('.',',')}</span></div>
        <div class="p-3 bg-green-100 rounded-md flex justify-between items-center text-green-800"><span class="font-semibold text-lg">Lucro Bruto:</span><span class="font-bold text-lg">R$ ${totalProfit.toFixed(2).replace('.',',')}</span></div>
        <div class="p-3 bg-gray-100 rounded-md flex justify-between items-center"><span class="font-semibold">Quantidade de Itens Vendidos:</span><span class="font-bold">${totalItems}</span></div>
    `;
}

function generatePdfReport() {
    if (salesData.length === 0) {
        alert("Nenhum dado de venda para gerar o relatório.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const totalSales = salesData.reduce((acc, sale) => acc + sale.totalValue, 0);
    const totalCost = salesData.reduce((acc, sale) => acc + sale.totalCost, 0);
    const totalProfit = totalSales - totalCost;
    const totalItems = salesData.reduce((acc, sale) => acc + sale.items.reduce((iAcc, i) => iAcc + i.quantity, 0), 0);
    
    doc.text("Relatório de Fechamento de Caixa - Yoshi's Bar", 14, 16);
    doc.autoTable({
        startY: 22,
        head: [['Descrição', 'Valor']],
        body: [
            ['Total Bruto de Vendas', `R$ ${totalSales.toFixed(2).replace('.',',')}`],
            ['Custo Total dos Produtos', `R$ ${totalCost.toFixed(2).replace('.',',')}`],
            ['Lucro Bruto', `R$ ${totalProfit.toFixed(2).replace('.',',')}`],
            ['Total de Itens Vendidos', `${totalItems}`],
        ],
    });
    doc.save(`fechamento_caixa_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
}


// --- FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ---
function initializeAdminPanel() {
    // ... (código de inicialização e listeners de login, modais, etc., sem alterações) ...
    document.querySelectorAll('.modal-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.dataset.modal;
            document.getElementById(modalId)?.classList.add('flex');
            if (modalId === 'coupons-modal') loadCoupons();
            // NOVO: Carregar dados ao abrir os modais de relatório
            if (modalId === 'history-modal') loadSalesHistory();
            if (modalId === 'cashier-modal') calculateAndShowCashier();
        });
    });
    
    document.getElementById('generate-pdf-btn').addEventListener('click', generatePdfReport);
}

document.addEventListener('DOMContentLoaded', initializeAdminPanel);
// O restante das funções (CRUD de produtos, cupons, etc.) continua o mesmo.
