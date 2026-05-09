const clientForm = document.getElementById('client-form');
const clientList = document.getElementById('client-list');
const editIdField = document.getElementById('edit-id');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    displayClients();
    document.getElementById('search-input').addEventListener('input', displayClients);
    document.getElementById('sort-select').addEventListener('change', displayClients);
});

// Função para Salvar ou Atualizar
clientForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const clientData = {
        nome: document.getElementById('nome').value,
        mac: document.getElementById('mac').value,
        key: document.getElementById('key').value,
        app: document.getElementById('app').value,
        local: document.getElementById('local').value,
        vencApp: document.getElementById('vencApp').value,
        vencLista: document.getElementById('vencLista').value
    };

    let clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const editId = editIdField.value;

    if (editId) {
        // Atualizar existente
        const index = clients.findIndex(c => c.id == editId);
        if(index !== -1) clients[index] = { ...clientData, id: Number(editId) };
    } else {
        // Novo cadastro
        clients.push({ ...clientData, id: Date.now() });
    }

    localStorage.setItem('clients', JSON.stringify(clients));
    resetForm();
    displayClients();
});

function displayClients() {
    let clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortType = document.getElementById('sort-select').value;

    // Filtragem por nome
    clients = clients.filter(c => c.nome.toLowerCase().includes(searchTerm));

    // Ordenação
    clients.sort((a, b) => {
        if (sortType === 'nome-asc') return a.nome.localeCompare(b.nome);
        if (sortType === 'nome-desc') return b.nome.localeCompare(a.nome);
        if (sortType === 'venc-app') return new Date(a.vencApp) - new Date(b.vencApp);
        if (sortType === 'venc-lista') return new Date(a.vencLista) - new Date(b.vencLista);
        return 0;
    });

    clientList.innerHTML = '';
    const hoje = new Date().setHours(0,0,0,0);

    clients.forEach(client => {
        const row = document.createElement('tr');
        const vApp = new Date(client.vencApp).setHours(0,0,0,0);
        const vLista = new Date(client.vencLista).setHours(0,0,0,0);

        row.innerHTML = `
            <td>
                <strong>${client.nome}</strong><br>
                <small>${client.local || 'Sem Local'}</small>
            </td>
            <td>
                <small>MAC:</small> ${client.mac}<br>
                <small>Key:</small> ${client.key || '---'}<br>
                <span class="app-label">${client.app}</span>
            </td>
            <td class="${vApp < hoje ? 'vencido' : ''}">${formatDate(client.vencApp)}</td>
            <td class="${vLista < hoje ? 'vencido' : ''}">${formatDate(client.vencLista)}</td>
            <td>
                <button class="edit-btn" onclick="editClient(${client.id})">Editar</button>
                <button class="del-btn" onclick="deleteClient(${client.id})">Remover</button>
            </td>
        `;
        clientList.appendChild(row);
    });
}

function formatDate(dateStr) {
    if(!dateStr) return "---";
    return dateStr.split('-').reverse().join('/');
}

function editClient(id) {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const client = clients.find(c => c.id === id);

    document.getElementById('nome').value = client.nome;
    document.getElementById('mac').value = client.mac;
    document.getElementById('key').value = client.key || '';
    document.getElementById('app').value = client.app;
    document.getElementById('local').value = client.local || '';
    document.getElementById('vencApp').value = client.vencApp;
    document.getElementById('vencLista').value = client.vencLista;

    editIdField.value = id;
    saveBtn.innerText = "Atualizar Cadastro";
    saveBtn.style.background = "#007bff";
    cancelBtn.style.display = "inline-block";
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetForm() {
    clientForm.reset();
    editIdField.value = '';
    saveBtn.innerText = "Salvar Cliente";
    saveBtn.style.background = "#28a745";
    cancelBtn.style.display = "none";
}

cancelBtn.onclick = resetForm;

function deleteClient(id) {
    if(confirm("Tem certeza que deseja remover este cliente?")) {
        let clients = JSON.parse(localStorage.getItem('clients') || '[]');
        clients = clients.filter(c => c.id !== id);
        localStorage.setItem('clients', JSON.stringify(clients));
        displayClients();
    }
}

function exportToExcel() {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    if(clients.length === 0) return alert("Lista vazia!");

    const dataFormatted = clients.map(c => ({
        "Nome": c.nome,
        "Local": c.local,
        "MAC Address": c.mac,
        "Device Key": c.key,
        "App": c.app,
        "Venc. APP": c.vencApp,
        "Venc. Lista": c.vencLista
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
    XLSX.writeFile(workbook, "Gerenciamento_Clientes_LI_Express.xlsx");
}