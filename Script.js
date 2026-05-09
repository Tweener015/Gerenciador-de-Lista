// 1. Usa a conexão que já foi criada no index.html
const clientesRef = database.ref('clientes');

// 2. FUNÇÃO PARA SALVAR OU EDITAR
document.getElementById('client-form').addEventListener('submit', function(e) {
    e.preventDefault(); 
    
    const id = document.getElementById('edit-id').value;
    const dados = {
        nome: document.getElementById('nome').value,
        mac: document.getElementById('mac').value,
        key: document.getElementById('key').value,
        app: document.getElementById('app').value,
        local: document.getElementById('local').value,
        vencApp: document.getElementById('vencApp').value,
        vencLista: document.getElementById('vencLista').value
    };

    if (id) {
        database.ref('clientes/' + id).set(dados)
            .then(() => alert("✅ Atualizado!"))
            .catch(err => alert("❌ Erro: " + err.message));
    } else {
        clientesRef.push(dados)
            .then(() => alert("✅ Cliente salvo com sucesso!"))
            .catch(err => alert("❌ Erro ao salvar: " + err.message));
    }
    
    this.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('save-btn').innerText = 'Salvar Cliente';
});

// 3. MOSTRAR NA TABELA (IGUAL À SUA IMAGEM)
clientesRef.on('value', (snapshot) => {
    const lista = document.getElementById('client-list');
    const busca = document.getElementById('search-input').value.toLowerCase();
    lista.innerHTML = '';
    
    snapshot.forEach((child) => {
        const c = child.val();
        const key = child.key;

        if (c.nome.toLowerCase().includes(busca)) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.nome}</strong><br><small>${c.local || ''}</small></td>
                <td>MAC: ${c.mac}<br>Key: ${c.key || '---'}<br><span style="color:blue; font-weight:bold;">${c.app}</span></td>
                <td>${formatarData(c.vencApp)}</td>
                <td>${formatarData(c.vencLista)}</td>
                <td>
                    <button style="background:#ffc107; border:none; padding:5px; cursor:pointer; border-radius:3px; margin-bottom:2px; width:70px;" onclick="editar('${key}', '${c.nome}', '${c.mac}', '${c.key}', '${c.app}', '${c.local}', '${c.vencApp}', '${c.vencLista}')">Editar</button>
                    <button style="background:#dc3545; color:white; border:none; padding:5px; cursor:pointer; border-radius:3px; width:70px;" onclick="remover('${key}')">Remover</button>
                </td>
            `;
            lista.appendChild(tr);
        }
    });
});

// Funções Extras (Excel, Data, Editar)
function exportToExcel() {
    clientesRef.once('value', (snapshot) => {
        const data = [];
        snapshot.forEach(c => data.push(c.val()));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");
        XLSX.writeFile(wb, "Gerenciamento_L.I_Express.xlsx");
    });
}

function formatarData(data) {
    if(!data) return '---';
    const partes = data.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function remover(id) {
    if(confirm("Deseja remover este cliente?")) database.ref('clientes/' + id).remove();
}

function editar(id, nome, mac, key, app, local, vencApp, vencLista) {
    document.getElementById('edit-id').value = id;
    document.getElementById('nome').value = nome;
    document.getElementById('mac').value = mac;
    document.getElementById('key').value = key;
    document.getElementById('app').value = app;
    document.getElementById('local').value = local;
    document.getElementById('vencApp').value = vencApp;
    document.getElementById('vencLista').value = vencLista;
    document.getElementById('save-btn').innerText = 'Atualizar Cliente';
    window.scrollTo(0,0);
}

document.getElementById('search-input').addEventListener('input', () => {
    clientesRef.once('value', () => {}); 
});