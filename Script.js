// ==========================================
// 1. CONFIGURAÇÃO DO FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "COLE_AQUI_SUA_API_KEY",
    authDomain: "COLE_AQUI_SEU_AUTH_DOMAIN",
    databaseURL: "COLE_AQUI_SEU_DATABASE_URL",
    projectId: "COLE_AQUI_SEU_PROJECT_ID",
    storageBucket: "COLE_AQUI_SEU_STORAGE_BUCKET",
    messagingSenderId: "COLE_AQUI_SEU_MESSAGING_SENDER_ID",
    appId: "COLE_AQUI_SEU_APP_ID"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref('clientes_iptv');

// ==========================================
// 2. VARIÁVEIS E INICIALIZAÇÃO
// ==========================================
const clientForm = document.getElementById('client-form');
const clientList = document.getElementById('client-list');
const editIdField = document.getElementById('edit-id');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

let todosOsClientes = []; // Variável para guardar os dados e filtrar na tela

document.addEventListener('DOMContentLoaded', () => {
    // Escuta o banco de dados em tempo real
    dbRef.on('value', (snapshot) => {
        todosOsClientes = [];
        snapshot.forEach((child) => {
            todosOsClientes.push({ id: child.key, ...child.val() });
        });
        renderTable(); // Atualiza a tabela sempre que o banco mudar
    });

    document.getElementById('search-input').addEventListener('input', renderTable);
    document.getElementById('sort-select').addEventListener('change', renderTable);
});

// ==========================================
// 3. SALVAR OU ATUALIZAR
// ==========================================
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

    const editId = editIdField.value;

    if (editId) {
        // Atualizar existente
        dbRef.child(editId).set(clientData)
            .then(() => resetForm())
            .catch(error => alert("Erro ao atualizar: " + error.message));
    } else {
        // Novo cadastro
        dbRef.push(clientData)
            .then(() => resetForm())
            .catch(error => alert("Erro ao salvar: " + error.message));
    }
});

// ==========================================
// 4. MOSTRAR DADOS NA TABELA (COM FILTROS)
// ==========================================
function renderTable() {
    let clients = [...todosOsClientes];
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
                <button class="edit-btn" onclick="editClient('${client.id}')">Editar</button>
                <button class="del-btn" onclick="deleteClient('${client.id}')">Remover</button>
            </td>
        `;
        clientList.appendChild(row);
    });
}

// ==========================================
// 5. FUNÇÕES AUXILIARES E BOTÕES
// ==========================================
function formatDate(dateStr) {
    if(!dateStr) return "---";
    return dateStr.split('-').reverse().join('/');
}

function editClient(id) {
    const client = todosOsClientes.find(c => c.id === id);
    if(!client) return;

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
        dbRef.child(id).remove();
    }
}

function exportToExcel() {
    if(todosOsClientes.length === 0) return alert("Lista vazia!");

    const dataFormatted = todosOsClientes.map(c => ({
        "Nome": c.nome,
        "Local": c.local,
        "MAC Address": c.mac,
        "Device Key": c.key,
        "App": c.app,
        "Venc. APP": formatDate(c.vencApp),
        "Venc. Lista": formatDate(c.vencLista)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFormatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
    XLSX.writeFile(workbook, "Gerenciamento_IPTV.xlsx");
}