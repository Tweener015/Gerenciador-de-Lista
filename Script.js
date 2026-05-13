// ==========================================
// 1. CONFIGURAÇÃO DO FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyC5Fjs0bTcB26oOK9hXkI_ZTFoYWk2VXR4",
    authDomain: "gerenciador-de-lista-iptv.firebaseapp.com",
    databaseURL: "https://gerenciador-de-lista-iptv-default-rtdb.firebaseio.com",
    projectId: "gerenciador-de-lista-iptv",
    storageBucket: "gerenciador-de-lista-iptv.firebasestorage.app",
    messagingSenderId: "783187122324",
    appId: "1:783187122324:web:da5245a33f646a164b7c81",
    measurementId: "G-FTFM90Y2LQ"
};

// Inicializa o Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase Inicializado com sucesso!");
}

const dbRef = firebase.database().ref('clientes_iptv');

// ==========================================
// 2. VARIÁVEIS DO SISTEMA E DA TELA
// ==========================================
const clientForm = document.getElementById('client-form');
const clientList = document.getElementById('client-list');
const editIdField = document.getElementById('edit-id');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

let todosOsClientes = [];

// ==========================================
// 3. SISTEMA DE LOGIN E SEGURANÇA (NOVO)
// ==========================================

// Monitora se o usuário está logado ou não
firebase.auth().onAuthStateChanged((user) => {
    const loginDiv = document.getElementById('login-container');
    const mainDiv = document.getElementById('main-content');

    if (user) {
        // Se estiver logado: esconde login, mostra sistema e carrega dados
        loginDiv.style.display = 'none';
        mainDiv.style.display = 'block';
        console.log("✅ Usuário autenticado!");
        carregarDadosFirebase(); 
    } else {
        // Se NÃO estiver logado: mostra login, esconde sistema e limpa memória
        loginDiv.style.display = 'block';
        mainDiv.style.display = 'none';
        todosOsClientes = [];
        clientList.innerHTML = '';
        console.log("🔒 Acesso bloqueado. Aguardando login.");
    }
});

// Função acionada pelo botão "Entrar" no HTML
window.fazerLogin = function() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    if(!email || !senha) return alert("Preencha e-mail e senha!");

    firebase.auth().signInWithEmailAndPassword(email, senha)
        .then(() => console.log("Login realizado com sucesso!"))
        .catch((error) => alert("Erro ao acessar: Verifique seu e-mail e senha."));
};

// Função acionada pelo botão "Sair" no HTML
window.fazerLogout = function() {
    firebase.auth().signOut().then(() => {
        console.log("Sessão encerrada.");
    });
};

// ==========================================
// 4. CARREGAR DADOS (SÓ RODA SE ESTIVER LOGADO)
// ==========================================
function carregarDadosFirebase() {
    console.log("📡 Conectando ao Banco de Dados...");

    dbRef.on('value', (snapshot) => {
        console.log("🔄 Dados recebidos do Firebase!");
        todosOsClientes = [];
        
        snapshot.forEach((child) => {
            todosOsClientes.push({ id: child.key, ...child.val() });
        });
        
        console.log(`📊 Total de clientes carregados: ${todosOsClientes.length}`);
        renderTable(); 
    }, (error) => {
        console.error("❌ Erro de Permissão ou Conexão:", error.message);
        alert("Sua sessão pode ter expirado ou você não tem permissão.");
    });
}

// Configura os ouvintes de filtro e busca na inicialização
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-input').addEventListener('input', renderTable);
    document.getElementById('sort-select').addEventListener('change', renderTable);
});

// ==========================================
// 5. SALVAR OU ATUALIZAR
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
        vencLista: document.getElementById('vencLista').value,
        ultimaAtualizacao: new Date().toISOString()
    };

    const editId = editIdField.value;

    if (editId) {
        // Atualizar existente
        console.log(`⏳ Atualizando cliente ID: ${editId}...`);
        dbRef.child(editId).set(clientData)
            .then(() => {
                console.log("✅ Atualização concluída!");
                resetForm();
            })
            .catch(error => {
                console.error("❌ Erro ao atualizar:", error);
                alert("Erro ao atualizar: " + error.message);
            });
    } else {
        // Novo cadastro
        console.log("⏳ Criando novo cadastro...");
        dbRef.push(clientData)
            .then(() => {
                console.log("✅ Cliente salvo com sucesso!");
                resetForm();
            })
            .catch(error => {
                console.error("❌ Erro ao salvar:", error);
                alert("Erro ao salvar: " + error.message);
            });
    }
});

// ==========================================
// 6. MOSTRAR DADOS NA TABELA (COM FILTROS)
// ==========================================
function renderTable() {
    let clients = [...todosOsClientes];
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortType = document.getElementById('sort-select').value;

    // Filtragem
    clients = clients.filter(c => 
        c.nome.toLowerCase().includes(searchTerm) || 
        c.mac.toLowerCase().includes(searchTerm)
    );

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
            <td class="${vApp < hoje ? 'vencido' : ''}" style="color: ${vApp < hoje ? 'red' : 'inherit'}">
                ${formatDate(client.vencApp)}
            </td>
            <td class="${vLista < hoje ? 'vencido' : ''}" style="color: ${vLista < hoje ? 'red' : 'inherit'}">
                ${formatDate(client.vencLista)}
            </td>
            <td>
                <button class="edit-btn" onclick="editClient('${client.id}')">Editar</button>
                <button class="del-btn" onclick="deleteClient('${client.id}')" style="background:#dc3545; color:white;">Remover</button>
            </td>
        `;
        clientList.appendChild(row);
    });
}

// ==========================================
// 7. FUNÇÕES AUXILIARES
// ==========================================
function formatDate(dateStr) {
    if(!dateStr) return "---";
    return dateStr.split('-').reverse().join('/');
}

// Alterado para window. para garantir que o HTML encontre a função dentro do escopo
window.editClient = function(id) {
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

window.resetForm = function() {
    clientForm.reset();
    editIdField.value = '';
    saveBtn.innerText = "Salvar Cliente";
    saveBtn.style.background = "#28a745";
    cancelBtn.style.display = "none";
}

cancelBtn.onclick = window.resetForm;

window.deleteClient = function(id) {
    if(confirm("Tem certeza que deseja remover este cliente?")) {
        console.log(`🗑️ Removendo cliente ID: ${id}...`);
        dbRef.child(id).remove()
            .then(() => console.log("✅ Cliente removido."))
            .catch(error => console.error("❌ Erro ao remover:", error));
    }
}

window.exportToExcel = function() {
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