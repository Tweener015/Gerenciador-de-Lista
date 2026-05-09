// 1. Conexão
const database = firebase.database();
const clientesRef = database.ref('clientes');

// 2. Salvar Cliente
// FUNÇÃO PARA SALVAR OU EDITAR (COM ALERTA DE ERRO)
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
            .then(() => {
                alert("✅ Cliente ATUALIZADO com sucesso!");
                document.getElementById('edit-id').value = '';
                document.getElementById('save-btn').innerText = 'Salvar Cliente';
                document.getElementById('cancel-btn').style.display = 'none';
            })
            .catch(error => alert("❌ ERRO AO ATUALIZAR: " + error.message));
    } else {
        clientesRef.push(dados)
            .then(() => {
                alert("✅ Cliente SALVO com sucesso no banco de dados!");
            })
            .catch(error => {
                alert("❌ ERRO DO FIREBASE: O banco de dados bloqueou o salvamento. Erro: " + error.message);
            });
    }
    
    this.reset();
});
// 3. Mostrar na Tabela (Igual à imagem que você mandou)
clientesRef.on('value', (snapshot) => {
    const lista = document.getElementById('client-list');
    const busca = document.getElementById('search-input').value.toLowerCase();
    lista.innerHTML = '';
    
    let clientes = [];
    snapshot.forEach((child) => {
        clientes.push({ key: child.key, ...child.val() });
    });

    // Filtro de busca por nome
    clientes = clientes.filter(c => c.nome.toLowerCase().includes(busca));

    clientes.forEach((c) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.nome}</strong><br><small>${c.local || ''}</small></td>
            <td>MAC: ${c.mac}<br>Key: ${c.key || '---'}<br><span style="color:#007bff; font-weight:bold;">${c.app}</span></td>
            <td>${formatarData(c.vencApp)}</td>
            <td>${formatarData(c.vencLista)}</td>
            <td>
                <button class="edit-btn" style="background:#ffc107; border:none; padding:5px 10px; cursor:pointer; border-radius:3px; margin-bottom:5px; width:80px;" onclick="editar('${c.key}', '${c.nome}', '${c.mac}', '${c.key}', '${c.app}', '${c.local}', '${c.vencApp}', '${c.vencLista}')">Editar</button><br>
                <button class="remove-btn" style="background:#dc3545; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px; width:80px;" onclick="remover('${c.key}')">Remover</button>
            </td>
        `;
        lista.appendChild(tr);
    });
});

// 4. Exportar Excel
function exportToExcel() {
    clientesRef.once('value', (snapshot) => {
        const data = [];
        snapshot.forEach((child) => {
            const c = child.val();
            data.push({
                "Cliente": c.nome,
                "MAC": c.mac,
                "Key": c.key,
                "App": c.app,
                "Venc. App": c.vencApp,
                "Venc. Lista": c.vencLista
            });
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
        XLSX.writeFile(workbook, "Gerenciamento_Clientes.xlsx");
    });
}

// Auxiliares
document.getElementById('search-input').addEventListener('input', () => {
    clientesRef.once('value', snapshot => { /* A tabela atualiza sozinha pelo .on('value') */ });
});

function formatarData(data) {
    if(!data) return '---';
    const partes = data.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function remover(id) {
    if(confirm("Deseja remover?")) database.ref('clientes/' + id).remove();
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
    document.getElementById('cancel-btn').style.display = 'inline-block';
    window.scrollTo(0,0);
}