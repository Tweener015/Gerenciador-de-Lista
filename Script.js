const clientesRef = database.ref('clientes');

// SALVAR OU EDITAR
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
        // Atualiza cliente existente
        database.ref('clientes/' + id).set(dados);
        document.getElementById('edit-id').value = '';
        document.getElementById('save-btn').innerText = 'Salvar Cliente';
        document.getElementById('cancel-btn').style.display = 'none';
    } else {
        // Cria novo cliente
        clientesRef.push(dados);
    }

    this.reset();
});

// ESCUTAR MUDANÇAS (Faz aparecer no Celular e PC ao mesmo tempo)
clientesRef.on('value', (snapshot) => {
    const lista = document.getElementById('client-list');
    lista.innerHTML = '';
    
    snapshot.forEach((childSnapshot) => {
        const c = childSnapshot.val();
        const key = childSnapshot.key;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.nome}</strong><br><small>${c.local || ''}</small></td>
            <td>MAC: ${c.mac}<br>Key: ${c.key || '---'}<br>App: ${c.app}</td>
            <td>${formatarData(c.vencApp)}</td>
            <td>${formatarData(c.vencLista)}</td>
            <td>
                <button onclick="editar('${key}', '${c.nome}', '${c.mac}', '${c.key}', '${c.app}', '${c.local}', '${c.vencApp}', '${c.vencLista}')">✏️</button>
                <button onclick="remover('${key}')" style="background:red; color:white;">🗑️</button>
            </td>
        `;
        lista.appendChild(tr);
    });
});

function formatarData(data) {
    if(!data) return '---';
    const partes = data.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function remover(id) {
    if(confirm("Remover cliente?")) {
        database.ref('clientes/' + id).remove();
    }
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
    document.getElementById('cancel-btn').style.display = 'block';
    window.scrollTo(0,0);
}

document.getElementById('cancel-btn').addEventListener('click', function() {
    document.getElementById('client-form').reset();
    document.getElementById('edit-id').value = '';
    this.style.display = 'none';
    document.getElementById('save-btn').innerText = 'Salvar Cliente';
});